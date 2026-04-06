from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, AlltestcasesPerFeatureResponse, addTestcaseResponse, addTestcaseRequest, deteleTestcaseResponse, updateTestcaseStatusRequest, updateTestcaseStatusResponse, getTestcaseDescriptionResponse, updateDesriptionResponse, updateDesriptionRequest
from util.protectedRoute import get_current_user
from services.testcasesService import testcasesService

testcasesRouter = APIRouter()

@testcasesRouter.get("/features/{feature_id}/testcases", response_model=AlltestcasesPerFeatureResponse)
def get_feature_testcases(feature_id: int, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        testcases = testcasesService(session=session).get_feature_testcases(user_id=current_user.id, feature_id=feature_id)
        return {"feature_id": feature_id, "test_cases": testcases}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.post("/features/{feature_id}/add-testcase", response_model=addTestcaseResponse)
def add_testcases(feature_id: int, body: addTestcaseRequest, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return testcasesService(session=session).create_testcase(user_id=current_user.id, feature_id=feature_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@testcasesRouter.patch("/features/{feature_id}/testcases/{testcase_id}/status", response_model=updateTestcaseStatusResponse)
def update_testcase_status(feature_id: int, testcase_id: int, body: updateTestcaseStatusRequest, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return testcasesService(session=session).update_status(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.delete("/features/{feature_id}/testcases/{testcase_id}", response_model=deteleTestcaseResponse)
def delete_testcase(feature_id: int, testcase_id: int, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return testcasesService(session=session).detele_testcase(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.get("/features/{feature_id}/testcases/{testcase_id}/description", response_model=getTestcaseDescriptionResponse)
def get_testcase_description(feature_id: int, testcase_id: int, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return testcasesService(session=session).get_testcase_description(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@testcasesRouter.put("/features/{feature_id}/testcases/{testcase_id}/description", response_model = updateDesriptionResponse)
def update_testcase_description(feature_id: int, testcase_id: int, body: updateDesriptionRequest, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return testcasesService(session=session).update_testcase_description(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id, body = body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))