from fastapi import APIRouter, Depends, Query

from src.api.schema.reaction import ReactionItem, ReactionUpsertRequest
from src.middleware.auth import get_current_user_id
from src.service.reaction_service import ReactionService

router = APIRouter(prefix="/reactions", tags=["reactions"])
service = ReactionService()


@router.get("", response_model=list[ReactionItem])
def list_reactions() -> list[dict]:
    return service.list_all()


@router.put("", response_model=ReactionItem)
def upsert_reaction(payload: ReactionUpsertRequest, current_user_id: str = Depends(get_current_user_id)) -> dict:
    return service.upsert(user_id=current_user_id, appreciation_id=payload.appreciation_id, emoji=payload.emoji)


@router.delete("")
def delete_reaction(appreciation_id: str = Query(...), current_user_id: str = Depends(get_current_user_id)) -> dict[str, str]:
    service.delete(user_id=current_user_id, appreciation_id=appreciation_id)
    return {"message": "Reaction removed"}
