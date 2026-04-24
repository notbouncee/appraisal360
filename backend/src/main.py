from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.router import api_router
from src.core.settings import settings
from src.repository.repo_utils.bootstrap import ensure_schema

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup() -> None:
    ensure_schema()


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} is running"}
