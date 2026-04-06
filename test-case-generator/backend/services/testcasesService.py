from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.schemas import TestcaseResponse, addTestcaseResponse, addTestcaseRequest, deteleTestcaseResponse, updateTestcaseStatusRequest, updateTestcaseStatusResponse, getTestcaseDescriptionResponse, updateDesriptionRequest, updateDesriptionResponse
from model.document import Testcase
from typing import List

class testcasesService:
    def __init__(self, session:Session):
        self.session = session

    def get_feature_testcases(self, user_id:int, feature_id:int) -> List[TestcaseResponse]:
        return self.session.query(Testcase).filter(Testcase.user_id == user_id, Testcase.feature_id == feature_id).all()
    
    def create_testcase(self, user_id: int, feature_id: int, body: addTestcaseRequest) -> addTestcaseResponse:
        testcase = Testcase(
            name=body.testcase,
            user_id=user_id,
            feature_id=feature_id,
            status=body.status,
        )
        self.session.add(testcase)
        self.session.commit()
        self.session.refresh(testcase)
        return testcase

    def update_status(self, user_id: int, feature_id: int, testcase_id: int, body: updateTestcaseStatusRequest) -> updateTestcaseStatusResponse:
        testcase = self.session.query(Testcase).filter(
            Testcase.id == testcase_id,
            Testcase.feature_id == feature_id,
            Testcase.user_id == user_id,
        ).first()
        if not testcase:
            raise HTTPException(status_code=404, detail="Testcase not found")
        testcase.status = body.status
        self.session.commit()
        self.session.refresh(testcase)
        return testcase

    def detele_testcase(self, user_id: int, feature_id: int, testcase_id: int) -> deteleTestcaseResponse:
        testcase = self.session.query(Testcase).filter(
            Testcase.id == testcase_id,
            Testcase.feature_id == feature_id,
            Testcase.user_id == user_id,
        ).first()
        if not testcase:
            raise HTTPException(status_code=404, detail="Testcase not found")
        self.session.delete(testcase)
        self.session.commit()
        return testcase
    
    def get_testcase_description(self, user_id: int, feature_id: int, testcase_id: int) -> getTestcaseDescriptionResponse:
        testcase = self.session.query(Testcase).filter(
            Testcase.id == testcase_id,
            Testcase.feature_id == feature_id,
            Testcase.user_id == user_id,
        ).first()
        if not testcase:
            raise HTTPException(status_code=404, detail="Testcase not found")
        return testcase
    
    def update_testcase_description(self, user_id:int, feature_id:int, testcase_id: int, body: updateDesriptionRequest) -> updateDesriptionResponse:
        testcase = self.session.query(Testcase).filter(
            Testcase.id == testcase_id,
            Testcase.feature_id == feature_id,
            Testcase.user_id == user_id,
        ).first()
        if not testcase:
            raise HTTPException(status_code=404, detail="Testcase not found")
        testcase.description = body.description
        testcase.steps = body.steps
        testcase.expected_result = body.expected_result
        testcase.status = body.status
        self.session.commit()
        self.session.refresh(testcase)
        return testcase