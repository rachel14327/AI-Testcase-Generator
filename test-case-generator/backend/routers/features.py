from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from model.schemas import UserResponse, FeatureResponse, createFeatureRequest
from util.deps import DB, Current_user
from services.featuresService import featuresService

featuresRouter = APIRouter()

@featuresRouter.get("/features", response_model=List[FeatureResponse])
def get_features(db: DB, current_user: Current_user):
    try:
        return featuresService(session=db).get_features(user_id=current_user.id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@featuresRouter.delete("/features/{feature_id}")
def delete_feature(
    feature_id: int,
    db: DB,
    current_user: Current_user,
):
    try:
        return featuresService(session=db).delete_feature(
            feature_id=feature_id, user_id=current_user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@featuresRouter.post("/features/create-feature", response_model=FeatureResponse)
def create_feature(request: createFeatureRequest, db: DB, current_user: Current_user):
    try:
        return featuresService(session=db).create_feature(request=request, user_id=current_user.id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
    