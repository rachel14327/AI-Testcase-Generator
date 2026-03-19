from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, FeatureResponse, createFeatureRequest
from util.protectedRoute import get_current_user
from services.featuresService import featuresService

createFeaturesRouter = APIRouter()

@createFeaturesRouter.post("/create-feature", response_model=FeatureResponse)
def create_feature(request: createFeatureRequest, session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
        return featuresService(session=session).create_feature(request=request, user_id=current_user.id)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))