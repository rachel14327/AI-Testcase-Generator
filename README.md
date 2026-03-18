TestCraft — AI QA Analyst
Turns feature documentation into test cases. Automatically.
Most teams write test cases manually — reading through docs, cross-referencing other features, figuring out what might break. TestCraft does that work for you. Upload a PDF, get structured test cases back in seconds.

The Intelligence
TestCraft doesn't just summarise your document and prompt an LLM. It builds a memory of your entire system as you upload docs — one feature at a time. When a new feature comes in, it:

Reads and understands what the feature does
Checks every previously uploaded feature for overlap — shared APIs, common data, overlapping flows
If it finds an impact, it writes regression test cases for the affected features too
If there's no overlap, it focuses entirely on the new feature

The result is test coverage that reflects how your system actually works — not just how one feature works in isolation.

Under the Hood

FastAPI backend with JWT auth and PostgreSQL
ChromaDB for per-session vector storage — each user's data is fully isolated
LangChain + PyPDFLoader for document ingestion and chunking
sentence-transformers (all-MiniLM-L6-v2) for semantic embeddings
LLaMA 3.3 70B via Groq for fast, free LLM inference
Three-stage LLM pipeline: summarise → impact analysis → test case generation


Output Format
Every test case is structured and ready to use:
TC IDTitlePreconditionStepsExpected ResultPriorityTC-001............High
When regression cases are needed, they come in a separate section with clear attribution to the feature they belong to.

Why It Exists
QA is always the bottleneck. Developers ship features, product managers write specs, and someone has to turn all of it into test cases before anything goes to production. That someone is usually a QA engineer spending hours on work that follows predictable patterns. TestCraft handles the predictable parts — so QA engineers can focus on the edge cases only a human would think of.

Skills & Technologies
AI & Machine Learning
Retrieval-Augmented Generation (RAG) LLM Prompt Engineering Semantic Search Vector Embeddings Impact Analysis Multi-document Reasoning LangChain sentence-transformers ChromaDB
Backend Development
Python FastAPI REST API Design JWT Authentication PostgreSQL SQLAlchemy Async Programming
LLM & AI Infrastructure
Groq API LLaMA 3.3 HuggingFace OpenAI-compatible APIs Prompt Chaining Structured Output Parsing
Data & Document Processing
PDF Parsing Document Chunking Text Splitting Metadata Tagging Vector Store Management
Software Engineering
Session Isolation Architecture Per-user Data Namespacing Lazy Environment Loading Error Handling & Logging Modular Pipeline Design

Key Concepts Demonstrated

Designing a stateful RAG pipeline where memory accumulates across uploads within a session
Cross-document reasoning — not just answering questions from one doc but finding relationships between multiple ones
Prompt engineering for structured output — getting an LLM to return consistent JSON for impact analysis and formatted tables for test cases
Session-scoped vector isolation — multiple users can run concurrent sessions with zero data leakage between them
Production-aware patterns: lazy secret loading, graceful error messages, per-step logging
