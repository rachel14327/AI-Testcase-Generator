from fastapi import APIRouter, Depends, HTTPException, status
from model.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from database.db import get_db
from sqlalchemy.orm import Session
from services.userService import userService

authRouter = APIRouter()

@authRouter.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(loginDetails: LoginRequest, session: Session = Depends(get_db)):
    try:
        return userService(session=session).login(login_details=loginDetails)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@authRouter.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(registerDetails: RegisterRequest, session: Session = Depends(get_db)):
    try:
        return userService(session=session).signup(user_details=registerDetails)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


    # Router -> Service -> Repository -> Database