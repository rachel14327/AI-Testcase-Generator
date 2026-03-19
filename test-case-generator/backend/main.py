import logging
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from sqlalchemy.exc import OperationalError  # type: ignore[import-untyped]
from core.config import get_settings
from database.db import create_tables, get_table_names, get_table_columns
from model.schemas import UserResponse
from model.user import User  # noqa: F401 - register model with Base
from model.document import Document  # noqa: F401 - register model with Base
from routers.auth import authRouter
from routers.rag import ragRouter
from routers.upload import uploadRouter
from routers.features import featuresRouter
from routers.CreateFeatures import createFeaturesRouter
from util.protectedRoute import get_current_user
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        create_tables()
    except OperationalError as e:
        logger.warning(
            "Database connection failed at startup (tables not created). "
            "Check DATABASE_URL in .env and that PostgreSQL is running and the user/password are correct. %s",
            e,
        )
    yield


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)
app.include_router(authRouter, prefix="/api/v1/auth", tags=["auth"])
app.include_router(uploadRouter, prefix="/api/v1/upload", tags=["upload"])
app.include_router(ragRouter, prefix="/api/v1/rag", tags=["rag"])
app.include_router(featuresRouter, prefix="/api/v1", tags=["features"])
app.include_router(createFeaturesRouter, prefix="/api/v1/features", tags=["features"])


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/protected")
def read_protected(current_user: UserResponse = Depends(get_current_user)):
    return {"message": "This is a protected route", "user": current_user}