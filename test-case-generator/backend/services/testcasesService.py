from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.schemas import TestcaseResponse, addTestcaseResponse, addTestcaseRequest, deteleTestcaseResponse, updateTestcaseStatusRequest, updateTestcaseStatusResponse, getTestcaseDescriptionResponse, updateDesriptionRequest, updateDesriptionResponse, updateTestcaseRequest, updateTestcaseResponse
from model.document import Testcase, Feature
from typing import List

class testcasesService:
    def __init__(self, session:Session):
        self.session = session

    def get_feature_testcases(self, user_id: int, feature_id: int):
        feature = self.session.query(Feature).filter(Feature.id == feature_id, Feature.user_id == user_id).first()
        testcases = (
            self.session.query(Testcase)
            .filter(Testcase.user_id == user_id, Testcase.feature_id == feature_id)
            .order_by(Testcase.id.asc())
            .all()
        )
        if not testcases:
            return feature, testcases

        # Track the ID of the first test case added to each section, to preserve creation order of sections.
        section_first_id: dict = {}
        for tc in testcases:
            if tc.section not in section_first_id:
                section_first_id[tc.section] = tc.id

        def _sort_key(tc):
            # Null-section test cases always float to the top (group 0), ordered by their own id.
            # Named sections sort after (group 1), ordered by the section's first-ever id, then by test case id.
            if tc.section is None:
                return (0, tc.id)
            return (1, section_first_id[tc.section], tc.id)

        testcases = sorted(testcases, key=_sort_key)
        return feature, testcases
    
    def create_testcase(self, user_id: int, feature_id: int, body: addTestcaseRequest) -> addTestcaseResponse:
        testcase = Testcase(
            name=body.testcase,
            user_id=user_id,
            feature_id=feature_id,
            status=body.status,
            section=body.section,
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

        status = (body.status or "").strip().lower()
        if status in {"failed", "blocked"} and not (body.bug_id or "").strip():
            raise HTTPException(status_code=400, detail="bug_id is required for failed or blocked testcases")

        testcase.status = body.status
        testcase.testing_data = (body.testing_data or "").strip() or None
        testcase.bug_id = (body.bug_id or "").strip() or None
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
    
    def update_testcase_name(self, user_id: int, feature_id: int, testcase_id: int, body: updateTestcaseRequest) -> updateTestcaseResponse:
        testcase = self.session.query(Testcase).filter(
            Testcase.id == testcase_id,
            Testcase.feature_id == feature_id,
            Testcase.user_id == user_id,
        ).first()
        if not testcase:
            raise HTTPException(status_code=404, detail="Testcase not found")
        testcase.name = body.name
        self.session.commit()
        self.session.refresh(testcase)
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