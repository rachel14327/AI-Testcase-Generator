from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, AlltestcasesPerFeatureResponse, addTestcaseResponse, addTestcaseRequest, deteleTestcaseResponse, updateTestcaseStatusRequest, updateTestcaseStatusResponse, getTestcaseDescriptionResponse, updateDesriptionResponse, updateDesriptionRequest, updateTestcaseRequest, updateTestcaseResponse
from util.deps import DB, Current_user
from services.testcasesService import testcasesService

testcasesRouter = APIRouter()

@testcasesRouter.get("/features/{feature_id}/testcases", response_model=AlltestcasesPerFeatureResponse)
def get_feature_testcases(feature_id: int, db: DB, current_user: Current_user):
    try:
        feature, testcases = testcasesService(session=db).get_feature_testcases(user_id=current_user.id, feature_id=feature_id)
        return {"feature_id": feature_id, "name": feature.name if feature else None, "test_cases": testcases}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.post("/features/{feature_id}/add-testcase", response_model=addTestcaseResponse)
def add_testcases(feature_id: int, body: addTestcaseRequest, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).create_testcase(user_id=current_user.id, feature_id=feature_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


@testcasesRouter.patch("/features/{feature_id}/testcases/{testcase_id}/status", response_model=updateTestcaseStatusResponse)
def update_testcase_status(feature_id: int, testcase_id: int, body: updateTestcaseStatusRequest, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).update_status(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.delete("/features/{feature_id}/testcases/{testcase_id}", response_model=deteleTestcaseResponse)
def delete_testcase(feature_id: int, testcase_id: int, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).detele_testcase(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.get("/features/{feature_id}/testcases/{testcase_id}/description", response_model=getTestcaseDescriptionResponse)
def get_testcase_description(feature_id: int, testcase_id: int, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).get_testcase_description(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@testcasesRouter.patch("/features/{feature_id}/testcases/{testcase_id}", response_model=updateTestcaseResponse)
def update_testcase_name(feature_id: int, testcase_id: int, body: updateTestcaseRequest, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).update_testcase_name(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id, body=body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@testcasesRouter.put("/features/{feature_id}/testcases/{testcase_id}/description", response_model = updateDesriptionResponse)
def update_testcase_description(feature_id: int, testcase_id: int, body: updateDesriptionRequest, db: DB, current_user: Current_user):
    try:
        return testcasesService(session=db).update_testcase_description(user_id=current_user.id, feature_id=feature_id, testcase_id=testcase_id, body = body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

