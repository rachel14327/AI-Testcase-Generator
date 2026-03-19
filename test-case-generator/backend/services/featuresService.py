from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.schemas import FeatureResponse, createFeatureRequest
from model.document import Feature, Testcase
from typing import List

class featuresService:
    def __init__(self, session: Session):
        self.session = session

    def get_features(self, user_id: int) -> List[FeatureResponse]:
        return self.session.query(Feature).filter(Feature.user_id == user_id).all() 

    def create_feature(self, request: createFeatureRequest, user_id: int) -> FeatureResponse:
        new_feature = Feature(
            name=request.name,
            user_id=user_id,
            description=request.description,
        )
        self.session.add(new_feature)
        self.session.commit() 
        self.session.refresh(new_feature)
        return new_feature  

    def delete_feature(self, feature_id: int, user_id: int) -> dict:
        feature = (
            self.session.query(Feature)
            .filter(Feature.id == feature_id, Feature.user_id == user_id)
            .first()
        )
        if not feature:
            raise HTTPException(status_code=404, detail="Feature not found")

        self.session.query(Testcase).filter(Testcase.feature_id == feature_id).update(
            {Testcase.feature_id: None}
        )
        self.session.delete(feature)
        self.session.commit()
        return {"ok": True, "deleted_id": feature_id}