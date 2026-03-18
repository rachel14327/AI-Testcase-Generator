import jwt
from datetime import datetime, timedelta, timezone
from core.config import get_settings

settings = get_settings()
JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM

class AuthHelper(object):
    @staticmethod
    def sign_jwt(user_id: int) -> str:
        payload = {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES) # expires in 30 minutes
        }
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token

    @staticmethod
    def decode_jwt(token: str) -> dict:
        try:
            decoded_token = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return decoded_token if decoded_token["exp"] >= datetime.now(timezone.utc).timestamp() else None
        except:
            print("Unable to decode token")    
            return None