from typing import Annotated, Union
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from core.security.authHelper import AuthHelper
from database.db import get_db
from model.schemas import UserResponse
from services.userService import userService

AUTH_PREFIX = "Bearer"


def get_current_user(
    session: Session = Depends(get_db),
    authorization: Annotated[Union[str, None], Header()] = None,
) -> UserResponse:
        auth_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

        if not authorization:
            raise auth_exception
    
        if not authorization.startswith(AUTH_PREFIX):
            raise auth_exception

        payload = AuthHelper.decode_jwt(token=authorization.split()[1])
        if payload and "user_id" in payload:
            try:
                user_id = payload["user_id"]
                user = userService(session=session).get_user_by_id(id=user_id)
                if user:
                    return UserResponse(
                        id=user.id,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        email=user.email
                    )
            except Exception as e:
                print(e)
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
        raise auth_exception
    
    
def get_user_by_id(user_id : int, session: Session = Depends(get_db)) -> UserResponse:
    user = userService(session=session).get_user_by_id(id=user_id)
    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")         