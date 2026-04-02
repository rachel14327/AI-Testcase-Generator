from datetime import datetime
from typing import Optional, Union

from fastapi import UploadFile
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    class Config:
        from_attributes = True

class UserInUpdate(BaseModel):
    id : int
    first_name: Union[str, None] = None
    last_name: Union[str, None] = None
    email: Union[EmailStr, None] = None
    password: Union[str, None] = None

class DocumentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    feature_name: Optional[str] = None
    file_name: str
    file_path: Optional[str] = None
    uploaded_at: datetime
    class Config:
        from_attributes = True

class FeatureResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True
class DocumentRequest(BaseModel):
    file: UploadFile
    feature_name: str
    class Config:
        from_attributes = True
class FeatureRequest(BaseModel):
    feature_name: str
    test_cases: object
    user_id: int
    class Config:
        from_attributes = True 

class ProcessRagRequest(BaseModel):
    document_id: int
    feature_name: str
    class Config:
        from_attributes = True


class TestcaseResponse(BaseModel):
    id: int
    feature_id: int
    name: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TestcaseRequest(BaseModel):
    feature_id: int
    name: str
    description: str
    steps: str
    expected_result: str
    priority: str
    status: str
    class Config:
        from_attributes = True

class createFeatureRequest(BaseModel):
    name: str
    user_id: int
    description: Optional[str] = None

class createFeatureResponse(BaseModel):
    id: int
    name: str
    user_id: int
    description: Optional[str] = None  
    class Config:
        from_attributes = True
