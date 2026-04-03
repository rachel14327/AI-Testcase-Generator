from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.schemas import TestcaseResponse, addTestcaseResponse, addTestcaseRequest
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
        )
        self.session.add(testcase)
        self.session.commit()
        self.session.refresh(testcase)
        return testcase
