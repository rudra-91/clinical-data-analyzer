from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    FRONTEND_URL,
    PROJECT_DESCRIPTION,
    PROJECT_NAME,
    PROJECT_VERSION,
)
from app.routes.analyze import router as analyze_router
from app.routes.health import router as health_router

app = FastAPI(
    title=PROJECT_NAME,
    description=PROJECT_DESCRIPTION,
    version=PROJECT_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(analyze_router)
