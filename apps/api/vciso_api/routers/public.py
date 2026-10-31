from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import client_ip
from ..models import Lead
from ..ratelimit import hit

router = APIRouter(prefix="/public", tags=["public"])


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    company: str = Field(min_length=1, max_length=200)
    company_size: str = Field(default="", max_length=40)
    message: str = Field(default="", max_length=3000)
    website: str = Field(default="", max_length=200)  # honeypot


@router.post("/leads", status_code=201)
def create_lead(body: LeadIn, request: Request, db: Session = Depends(get_db)):
    hit(f"lead:{client_ip(request)}", limit=5, window=3600)
    if not body.website:  # bots fill hidden fields
        db.add(Lead(**body.model_dump(exclude={"website"})))
        db.commit()
    return {"ok": True}
