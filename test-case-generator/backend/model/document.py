from database.db import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.sql import func
from sqlalchemy.types import JSON


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    feature_name = Column(Text, nullable=True)
    file_name = Column(Text, nullable=True)
    file_path = Column(Text, nullable=True)  # legacy: optional if file stored on disk
    file_content = Column(LargeBinary, nullable=True)  # PDF bytes stored in DB
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Testcase(Base):
    __tablename__ = "testcases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    feature_id = Column(Integer, ForeignKey("features.id"), nullable=True, index=True)
    name = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    steps = Column(Text, nullable=True)
    expected_result = Column(Text, nullable=True)
    priority = Column(Text, nullable=True)
    status = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


