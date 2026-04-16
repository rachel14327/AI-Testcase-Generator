from sqlalchemy import create_engine, inspect, text
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
    # Add file_content column if it was added to Document model after table was created
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN file_content BYTEA"))
            conn.commit()
    except Exception:
        pass  # column likely already exists

    # Add test_cases column for Features sheets
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE features ADD COLUMN test_cases TEXT"))
            conn.commit()
    except Exception:
        pass  # column likely already exists

    # Add testcase execution tracking columns for status popup data
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE testcases ADD COLUMN testing_data TEXT"))
            conn.commit()
    except Exception:
        pass  # column likely already exists

    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE testcases ADD COLUMN bug_id TEXT"))
            conn.commit()
    except Exception:
        pass  # column likely already exists


def get_table_names():
    """Return list of table names in the database."""
    return inspect(engine).get_table_names()


def get_table_columns(table_name: str):
    """Return list of column names for a table."""
    return [c["name"] for c in inspect(engine).get_columns(table_name)]