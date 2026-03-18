from datetime import datetime
from typing import Union

from fastapi import UploadFile
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str

class UserInUpdate(BaseModel):
    id : int
    first_name: Union[str, None] = None
    last_name: Union[str, None] = None
    email: Union[EmailStr, None] = None
    password: Union[str, None] = None

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    feature_name: str
    file_name: str
    file_path: str
    uploaded_at: datetime


class FeatureResponse(BaseModel):
    id: int
    user_id: int
    feature_name: str
    created_at: datetime


class DocumentRequest(BaseModel):
    file: UploadFile
    feature_name: Union[str, None] = None 

class FeatureRequest(BaseModel):
    feature_name: str   
    user_id: int

