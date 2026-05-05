from fastapi import APIRouter

from src.api.routes.auth import router as auth_router
from src.api.routes.admin import router as admin_router
from src.api.routes.feedback import router as feedback_router
from src.api.routes.health import router as health_router
from src.api.routes.profiles import router as profiles_router
from src.api.routes.reactions import router as reactions_router
from src.api.routes.review_cycles import router as review_cycles_router
from src.api.routes.upvotes import router as upvotes_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(profiles_router)
api_router.include_router(feedback_router)
api_router.include_router(upvotes_router)
api_router.include_router(reactions_router)
api_router.include_router(review_cycles_router)
