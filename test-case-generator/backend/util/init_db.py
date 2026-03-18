from core.config import get_settings
from database.db import Base, engine
from model.user import User

settings = get_settings()

def create_tables():
    Base.metadata.create_all(bind=engine)
