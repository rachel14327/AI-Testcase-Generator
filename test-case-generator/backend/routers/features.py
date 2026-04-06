from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, FeatureResponse, createFeatureRequest
from util.protectedRoute import get_current_user
from services.featuresService import featuresService

featuresRouter = APIRouter()

@featuresRouter.get("/features", response_model=List[FeatureResponse])
def get_features(session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return featuresService(session=session).get_features(user_id=current_user.id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@featuresRouter.delete("/features/{feature_id}")
def delete_feature(
    feature_id: int,
    session: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    try:
        return featuresService(session=session).delete_feature(
            feature_id=feature_id, user_id=current_user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@featuresRouter.post("/features/create-feature", response_model=FeatureResponse)
def create_feature(request: createFeatureRequest, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return featuresService(session=session).create_feature(request=request, user_id=current_user.id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
    