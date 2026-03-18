from repository.userRepo import userRepository
from model.schemas import RegisterRequest, LoginRequest, TokenResponse
from core.security.hashHelper import HashHelper
from core.security.authHelper import AuthHelper
from sqlalchemy.orm import Session
from fastapi import HTTPException

class userService(object):
    def __init__(self, session: Session):
        self._userRepository = userRepository(session=session)

    def signup(self, user_details: RegisterRequest):    
        if self._userRepository.user_exist_by_email(email=user_details.email):
            raise HTTPException(status_code=400, detail="Email already exists")
        
        hashed_password = HashHelper.get_password_hash(password=user_details.password)
        user_details.password = hashed_password
        new_user = self._userRepository.create_user(user=user_details)
        return new_user


    def login(self, login_details: LoginRequest) -> TokenResponse:
        if not self._userRepository.user_exist_by_email(email=login_details.email):
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        user = self._userRepository.get_user_exist_by_email(email=login_details.email)
        if HashHelper.verify_password(password=login_details.password, hashed_password=user.password):
            token = AuthHelper.sign_jwt(user_id=user.id)
            if token:
                return TokenResponse(access_token=token, token_type="bearer")
            raise HTTPException(status_code=400, detail="Unable to generate token")
        raise HTTPException(status_code=400, detail="Invalid credentials")

    def get_user_by_id(self, id: int):
        return self._userRepository.get_user_exist_by_id(id=id)