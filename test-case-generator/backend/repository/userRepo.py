from .base import BaseRepository
from model.user import User
from model.schemas import RegisterRequest

class userRepository(BaseRepository):
    def create_user(self, user: RegisterRequest):
        newUser = User(**user.model_dump(exclude_none=True)) # will exclude None values and the new user will be created witht is schema
        self.session.add(instance=newUser)
        self.session.commit()
        self.session.refresh(instance=newUser)

        return newUser

    def user_exist_by_email(self, email : str) -> bool:
       user = self.session.query(User).filter_by(email = email).first()
       return bool(user)     

    def get_user_exist_by_email(self, email : str) -> User:
       user = self.session.query(User).filter_by(email = email).first()
       return user

    def get_user_exist_by_id(self, id : int) -> User:
        user = self.session.query(User).filter_by(id = id).first()
        return user