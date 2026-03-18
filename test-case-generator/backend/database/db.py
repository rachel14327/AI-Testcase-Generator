from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import get_settings

settings = get_settings()

if not settings.DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not set in .env. Use a PostgreSQL URL, e.g. "
        "postgresql://user:password@localhost:5432/dbname"
    )

# PostgreSQL: no SQLite-specific connect_args
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables. Import models (e.g. model.user) before calling so they are registered with Base."""
    Base.metadata.create_all(bind=engine)


def get_table_names():
    """Return list of table names in the database."""
    return inspect(engine).get_table_names()


def get_table_columns(table_name: str):
    """Return list of column names for a table."""
    return [c["name"] for c in inspect(engine).get_columns(table_name)]