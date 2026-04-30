from datetime import datetime
from typing import List, Optional, Union

from fastapi import UploadFile
from pydantic import BaseModel, EmailStr
from pydantic import BaseModel, ConfigDict


class RegisterRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    email: str
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    email: str
    password: str


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    first_name: str
    last_name: str
    email: str
   

class UserInUpdate(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id : int
    first_name: Union[str, None] = None
    last_name: Union[str, None] = None
    email: Union[EmailStr, None] = None
    password: Union[str, None] = None


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    feature_name: str | None = None
    file_name: str
    file_path: str | None = None
    uploaded_at: datetime


class FeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    user_id: int
    name: str
    description: str | None = None


class DocumentRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    file: UploadFile
    feature_name: str


class FeatureRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    feature_name: str
    test_cases: object
    user_id: int


class ProcessRagRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    document_id: int
    feature_name: str


class TestcaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    feature_id: int
    name: str | None = None
    description: str | None = None
    steps: str | None = None
    expected_result: str | None = None
    priority: str | None = None
    status: str | None = None
    testing_data: str | None = None
    bug_id: str | None = None
    section: str | None = None
    created_at: datetime


class TestcaseRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    feature_id: int
    name: str
    description: str
    steps: str
    expected_result: str
    priority: str
    status: str


class CreateFeatureRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    name: str
    user_id: int
    description: str | None = None


class CreateFeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    name: str
    user_id: int
    description: str | None = None  


class AlltestcasesPerFeatureResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    feature_id: int
    name: str | None = None
    test_cases: list[TestcaseResponse]


class AddTestcaseRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    testcase: str
    status: str = "untested"
    section: str | None = None


class AddTestcaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    feature_id: int
    name: str
    status: str | None = "untested"
    section: str | None = None

    

class DeteleTestcaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    feature_id: int
    name: str

class StatusEnum(str, Enum):
    untested =  "untested"
    passed =  "passed"
    failed =  "failed"
    blocked = "blocked"

class UpdateTestcaseStatusRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    status: StatusEnum  # "passed", "failed", "blocked", "untested"
    testing_data: str | None = None
    bug_id: str | None = None

    @model_validator(mode="after")
    def bug_id_required_for_failed_blocked_testcase(self):
        if self.status in (StatusEnum.failed, StatusEnum.blocked) and not (self.bug_id or '').strip():
            raise ValueError('bug_id is required when status is failed or blocked')
        return self
 


class UpdateTestcaseStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    status: str
    testing_data: str | None = None
    bug_id: str | None = None


class GetTestcaseDescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    feature_id: int
    name: str
    status: str
    description: str | None = None
    steps: str | None = None
    expected_result: str | None = None
    priority: str | None = None
    testing_data: str | None = None
    bug_id: str | None = None


class updateDesriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    feature_id: int


class UpdateDesriptionRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    name: str
    status: StatusEnum
    description: str | None = None
    steps: str | None = None
    expected_result: str | None = None
 

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    name: str
    description: str | None = None


class GetProjectsResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    projects: List[ProjectResponse]
    

class UpdateTestcaseRequest(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    name: str


class UpdateTestcaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: int
    name: str

