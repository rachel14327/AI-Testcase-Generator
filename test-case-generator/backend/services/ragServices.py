"""
rag_pipeline.py

Senior QA Analyst RAG Pipeline
--------------------------------
- Per-session ChromaDB isolation (each session_id gets its own collections)
- Upload a PDF -> auto-summarise feature -> impact analysis against previous docs
- If impact found: generate TCs for new feature + regression TCs for impacted ones
- If no impact: generate clean test cases for the new feature only
- Session data lives only for the duration of the session (in-memory + temp ChromaDB)

Usage:
    from rag_pipeline import SessionRAG, process_document

    rag = SessionRAG(session_id="user_abc")
    result = process_document(rag, file_path="/tmp/login_feature.pdf", display_name="login_feature.pdf")

    print(result["summary"])
    print(result["impact"])
    print(result["test_cases"])
"""

import os
import json
import logging
import requests
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────

CHUNK_SIZE = 800
CHUNK_OVERLAP = 150
CHROMA_BASE = "vector_store"
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
# GROQ_API_KEY is read lazily inside _call_llm — NOT at module level.
# Reading os.getenv at import time in FastAPI always returns "" because
# modules are imported before load_dotenv() runs.

# Shared embedding model — loaded once, reused across all sessions
_embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_name(session_id: str, filename: str) -> str:
    """Build a safe ChromaDB collection name scoped to the session."""
    base = os.path.splitext(os.path.basename(filename))[0]
    safe = "".join(c if c.isalnum() or c in "_-" else "_" for c in f"{session_id}_{base}")
    return safe[:60]


def _docs_to_text(docs: list[Document], max_chars: int = 4000) -> str:
    """Flatten retrieved chunks into a single string for prompt injection."""
    parts = []
    total = 0
    for d in docs:
        chunk = (
            f"[{d.metadata.get('source_file', '?')} | p.{d.metadata.get('page', '?')}]\n"
            f"{d.page_content}"
        )
        if total + len(chunk) > max_chars:
            break
        parts.append(chunk)
        total += len(chunk)
    return "\n\n---\n\n".join(parts)


def _call_llm(prompt: str, max_tokens: int = 2048) -> str:
    """
    Call Groq chat completions endpoint via plain requests.
    Reads GROQ_API_KEY lazily at call time — avoids FastAPI import-time empty-string trap.
    Groq is free, fast, and uses the same OpenAI-compatible API shape.
    """
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. "
            "Add it to your .env file: GROQ_API_KEY=gsk_xxxx"
        )
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    resp = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
    if not resp.ok:
        # Log the full Groq error body so we can see exactly what went wrong
        logger.error(f"Groq API error {resp.status_code}: {resp.text}")
        resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"].strip()


# ── Session RAG ───────────────────────────────────────────────────────────────

class SessionRAG:
    """
    Manages all vector stores and feature metadata for one user session.
    Each call to ingest() creates a separate ChromaDB collection so docs
    never bleed into each other and sessions stay fully isolated.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        # collection_name -> Chroma vectorstore
        self.stores: dict[str, Chroma] = {}
        # collection_name -> {filename, feature_summary, test_cases}
        self.feature_registry: dict[str, dict] = {}

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def ingest(self, file_path: str, display_name: str) -> str:
        """
        Load a PDF, split into chunks, embed and persist to ChromaDB.
        Returns the collection name for this document.
        Skips re-embedding if already ingested in this session.
        """
        col = _safe_name(self.session_id, display_name)
        col_path = os.path.join(CHROMA_BASE, col)

        if col in self.stores:
            logger.info(f"[{self.session_id}] Already ingested: {display_name}")
            return col

        logger.info(f"[{self.session_id}] Ingesting '{display_name}'...")
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        for d in docs:
            d.metadata["source_file"] = display_name
            d.metadata["session_id"] = self.session_id

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )
        chunks = splitter.split_documents(docs)
        logger.info(f"[{self.session_id}] {len(chunks)} chunks from '{display_name}'")

        db = Chroma.from_documents(
            documents=chunks,
            embedding=_embeddings,
            collection_name=col,
            persist_directory=col_path,
        )
        self.stores[col] = db
        logger.info(f"[{self.session_id}] Saved collection '{col}'")
        return col

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def retrieve_from(self, col: str, query: str, k: int = 8) -> list[Document]:
        """Retrieve top-k chunks from a specific document collection."""
        if col not in self.stores:
            return []
        return self.stores[col].similarity_search(query, k=k)

    def retrieve_all_except(self, exclude: str, query: str, k: int = 5) -> list[Document]:
        """Retrieve relevant chunks from ALL previous docs except the current one."""
        results = []
        for col, store in self.stores.items():
            if col == exclude:
                continue
            results.extend(store.similarity_search(query, k=k))
        return results

    # ── Registry ──────────────────────────────────────────────────────────────

    def register(self, col: str, filename: str, summary: str, test_cases: str):
        """Save feature summary and TCs into session memory for future impact lookups."""
        self.feature_registry[col] = {
            "filename": filename,
            "feature_summary": summary,
            "test_cases": test_cases,
        }

    def previous_features(self, exclude: str) -> list[dict]:
        """Return all registered features except the one currently being processed."""
        return [
            {"collection": col, **data}
            for col, data in self.feature_registry.items()
            if col != exclude
        ]

    def doc_count(self) -> int:
        return len(self.stores)

    def cleanup(self):
        """Release in-memory references. ChromaDB dirs are scoped by session_id."""
        self.stores.clear()
        self.feature_registry.clear()
        logger.info(f"[{self.session_id}] Session cleaned up.")


# ── LLM Step 1: Summarise the new feature ─────────────────────────────────────

_SUMMARISE_PROMPT = """<s>[INST]
You are a senior QA analyst reading a new feature's documentation.

Documentation:
{context}

In 4-6 sentences, summarise:
- What this feature does and its purpose
- The key user flows it covers
- Any integrations, APIs, or dependencies it mentions
- Any data entities or shared components involved

Be concise and factual. Do not write test cases yet.
[/INST]"""


def _summarise(rag: SessionRAG, col: str) -> str:
    docs = rag.retrieve_from(col, query="feature overview functionality user flow", k=8)
    prompt = _SUMMARISE_PROMPT.format(context=_docs_to_text(docs))
    return _call_llm(prompt, max_tokens=400)


# ── LLM Step 2: Impact analysis ───────────────────────────────────────────────

_IMPACT_PROMPT = """<s>[INST]
You are a senior QA analyst performing an impact analysis.

NEW FEATURE being documented now:
{new_summary}

PREVIOUSLY DOCUMENTED FEATURES in this session:
{previous_features}

RELEVANT CHUNKS retrieved from previous docs (by similarity to the new feature):
{previous_chunks}

Your task:
Determine if the new feature has any functional impact on the previously documented features.

Impact exists when there are: shared data entities, overlapping user flows, common UI components,
shared APIs or services, auth/permission dependencies, or any state that one feature reads/writes
that the other also touches.

If there IS an impact — list only the affected features with a brief reason (1-2 sentences each).
If there is NO impact — respond with exactly: NO_IMPACT

Respond ONLY in this JSON format, no extra text outside the JSON:
{{
  "has_impact": true,
  "impacts": [
    {{
      "feature_name": "filename of affected feature",
      "reason": "brief explanation of why it is impacted"
    }}
  ]
}}
[/INST]"""


def _impact_analysis(rag: SessionRAG, col: str, new_summary: str) -> dict:
    """
    Check whether the new feature impacts any previously uploaded features.
    Returns a dict: { has_impact: bool, impacts: list }
    Automatically returns no-impact if this is the first document.
    """
    previous = rag.previous_features(exclude=col)
    if not previous:
        return {"has_impact": False, "impacts": []}

    prev_features_text = "\n\n".join(
        f"Feature: {f['filename']}\nSummary: {f['feature_summary']}"
        for f in previous
    )
    prev_chunks = rag.retrieve_all_except(exclude=col, query=new_summary, k=5)

    prompt = _IMPACT_PROMPT.format(
        new_summary=new_summary,
        previous_features=prev_features_text,
        previous_chunks=_docs_to_text(prev_chunks, max_chars=3000),
    )
    raw = _call_llm(prompt, max_tokens=600)

    if "NO_IMPACT" in raw:
        return {"has_impact": False, "impacts": []}

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        logger.warning(f"Impact JSON parse failed. Raw output: {raw[:200]}")
        return {"has_impact": False, "impacts": [], "_parse_error": raw[:300]}


# ── LLM Step 3: Generate test cases ───────────────────────────────────────────

_TC_PROMPT_CLEAN = """<s>[INST]
You are a senior QA analyst with 10 years of experience. Your test cases must be specific, actionable, and directly derived from the documentation provided. Generic test cases are not acceptable.

Feature summary:
{summary}

Full feature documentation (read every word carefully):
{context}

STRICT RULES:
1. Every test case MUST reference actual field names, button labels, API names, status values, or business rules mentioned in the documentation above. Do NOT invent generic steps.
2. If the doc mentions specific statuses (e.g. "Pending", "Prepared"), use those exact values.
3. If the doc mentions specific APIs, services, or integrations, write test cases that validate those.
4. If the doc mentions specific UI elements, include them in the steps.
5. Steps must be granular — each step is one specific action, not a vague summary.
6. Expected results must be precise — state exactly what should appear, change, or be returned.
7. Do NOT write test cases like "verify the feature works correctly" — that is useless.
8. Minimum 15 test cases.

Categories to cover (derive all from the actual documentation):
- Core happy path flows (step by step, using actual field names)
- Each business rule mentioned in the doc as a separate test case
- Each API or service integration mentioned
- Each status transition mentioned
- UI element validation (labels, buttons, icons mentioned in doc)
- Error states and validation messages
- Permission and access control if mentioned
- Edge cases specific to this feature (not generic edge cases)
- Data integrity checks

Format each test case EXACTLY like this:
TC-001 | [Specific title referencing actual feature name/flow] | [Specific precondition] | [Numbered granular steps] | [Precise expected result] | [High/Medium/Low]

Output ONLY the test cases, no preamble or explanation.
[/INST]"""

_TC_PROMPT_WITH_IMPACT = """<s>[INST]
You are a senior QA analyst with 10 years of experience. Your test cases must be specific, actionable, and directly derived from the documentation. Generic test cases are not acceptable.

NEW FEATURE summary:
{summary}

New feature documentation (read every word carefully):
{context}

IMPACTED PREVIOUS FEATURES (with their existing test cases):
{impact_section}

STRICT RULES:
1. Every test case MUST reference actual field names, API names, status values, or business rules from the documentation. Do NOT invent generic steps.
2. Steps must be granular — each step is one specific action.
3. Expected results must be precise — state exactly what appears, changes, or is returned.
4. For regression test cases, explain exactly HOW the new feature could break the old one.
5. Minimum 15 new feature test cases, minimum 5 regression test cases per impacted feature.

## New Feature Test Cases
Cover: core flows, each business rule, each API/integration, status transitions, UI elements, error states, permissions, edge cases specific to this feature.

Format: TC-001 | [Specific title] | [Specific precondition] | [Numbered granular steps] | [Precise expected result] | [High/Medium/Low]

## Regression / Impact Test Cases
For each impacted feature, write test cases that validate the integration point between old and new feature.

Format: RTC-001 | [Specific title] | [Feature name] | [Specific precondition] | [Numbered granular steps] | [Precise expected result] | [High/Medium/Low]

Output ONLY the test cases, no preamble or explanation.
[/INST]"""


def _generate_test_cases(
    rag: SessionRAG,
    col: str,
    summary: str,
    impact: dict,
) -> str:
    # Use multiple targeted queries to get richer context from the doc
    queries = [
        "feature functionality user flow steps",
        "API integration service endpoints",
        "business rules validation error handling",
        "UI elements fields buttons status values",
        "data entities permissions access control",
    ]
    seen = set()
    all_docs = []
    for q in queries:
        for d in rag.retrieve_from(col, query=q, k=6):
            key = d.page_content[:100]
            if key not in seen:
                seen.add(key)
                all_docs.append(d)
    context = _docs_to_text(all_docs, max_chars=6000)

    if not impact.get("has_impact"):
        prompt = _TC_PROMPT_CLEAN.format(summary=summary, context=context)
    else:
        impact_parts = []
        for imp in impact.get("impacts", []):
            prev = next(
                (f for f in rag.previous_features(exclude=col)
                 if f["filename"] == imp["feature_name"]),
                None,
            )
            existing_tcs = prev["test_cases"][:1500] if prev else "(not available)"
            impact_parts.append(
                f"### {imp['feature_name']}\n"
                f"Impact reason: {imp['reason']}\n"
                f"Existing test cases:\n{existing_tcs}"
            )
        prompt = _TC_PROMPT_WITH_IMPACT.format(
            summary=summary,
            context=context,
            impact_section="\n\n".join(impact_parts),
        )

    return _call_llm(prompt, max_tokens=2048)


# ── Public entry point ────────────────────────────────────────────────────────

def process_document(rag: SessionRAG, file_path: str, display_name: str) -> dict:
    """
    Full pipeline for one uploaded PDF document.

    Steps:
      1. Ingest        — chunk, embed, store in session-scoped ChromaDB collection
      2. Summarise     — LLM reads the doc and produces a feature summary
      3. Impact check  — compares new feature against all previous ones in this session
                         (skipped automatically if this is the first document)
      4. Test cases    — writes TCs for the new feature
                         + regression TCs if any impact was detected
      5. Register      — saves summary + TCs into session memory for future lookups

    Args:
        rag:          SessionRAG instance for this user session
        file_path:    Absolute path to the PDF (e.g. a temp file path)
        display_name: Original filename shown to the user

    Returns:
        {
            "filename":   str,
            "collection": str,
            "summary":    str,
            "impact": {
                "has_impact": bool,
                "impacts": [{"feature_name": str, "reason": str}, ...]
            },
            "test_cases": str
        }
    """
    logger.info(
        f"[{rag.session_id}] Processing '{display_name}' "
        f"(doc #{rag.doc_count() + 1} in session)"
    )

    col = rag.ingest(file_path, display_name)

    logger.info(f"[{rag.session_id}] Step 2: Summarising feature...")
    summary = _summarise(rag, col)

    logger.info(f"[{rag.session_id}] Step 3: Running impact analysis...")
    impact = _impact_analysis(rag, col, summary)
    if impact.get("has_impact"):
        affected = [i["feature_name"] for i in impact.get("impacts", [])]
        logger.info(f"[{rag.session_id}] Impact detected on: {affected}")
    else:
        logger.info(f"[{rag.session_id}] No impact on previous features.")

    logger.info(f"[{rag.session_id}] Step 4: Generating test cases...")
    test_cases = _generate_test_cases(rag, col, summary, impact)

    rag.register(col, display_name, summary, test_cases)
    logger.info(f"[{rag.session_id}] Done. Registered '{display_name}' in session memory.")

    return {
        "filename":   display_name,
        "collection": col,
        "summary":    summary,
        "impact":     impact,
        "test_cases": test_cases,
    }