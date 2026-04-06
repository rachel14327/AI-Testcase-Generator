from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, getProjectsResponse
from util.protectedRoute import get_current_user
from services.projectService import projectService


projectRouter = APIRouter();

@projectRouter.get("/projects", response_model=getProjectsResponse)
def get_Projects(session: Session = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    try:
      return projectService(session=session).get_projects(user_id=current_user.id)
    except Exception as e:
       print(e)
       raise HTTPException(status_code=500, detail=str(e))

