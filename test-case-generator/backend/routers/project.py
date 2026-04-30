from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from model.schemas import UserResponse, getProjectsResponse
from util.deps import DB, Current_user
from services.projectService import projectService


projectRouter = APIRouter();

@projectRouter.get("/projects", response_model=getProjectsResponse)
def get_Projects(db: DB, current_user: Current_user):
    try:
      return projectService(session=db).get_projects(user_id=current_user.id)
    except Exception as e:
       print(e)
       raise HTTPException(status_code=500, detail=str(e))

