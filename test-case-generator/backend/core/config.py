from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# Project root .env (parent of test-case-generator/backend/core)
_ROOT_ENV = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # App
    APP_NAME: str = "AI Testcase Generator"
    DEBUG: bool = False

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = _ROOT_ENV if _ROOT_ENV.exists() else ".env"
        env_file_encoding = "utf-8"

    # Groq
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"    

    # HuggingFace
    HUGGINGFACE_API_KEY: str = ""

    # Data
    TESTCASE_DATA_PATH: str = "data/raw/testcase_data.pdf"

    # LangChain
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_TRACING_V2: bool = True
    LANGCHAIN_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGCHAIN_PROJECT: str = "ai-testcase-generator"

    # Security
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str = ""

    # JWT
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

@lru_cache
def get_settings() -> Settings:
    return Settings()

