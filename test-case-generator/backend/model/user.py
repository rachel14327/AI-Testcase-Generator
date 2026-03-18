from database.db import Base
from sqlalchemy import Column, Integer, String, DateTime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key = True)
    first_name = Column(String(50), nullable = False)
    last_name = Column(String(50), nullable = False)
    email = Column(String(100), unique = True, nullable = False)
    password = Column(String(250), nullable = False)