from fastapi import HTTPException
from sqlalchemy.orm import Session
from model.schemas import getProjectsResponse
from model.project import project

class projectService:
    def __init__(self, session:Session):
        self.session = session

    def get_projects(self, user_id: int) -> getProjectsResponse:
        projects = self.session.query(project).filter(project.user_id == user_id).all()
        return {"projects": projects}
