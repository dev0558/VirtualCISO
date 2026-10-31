import csv
import io
from datetime import UTC, datetime

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from ..ai import questionnaire as qa
from ..deps import ANY_ROLE, EDITORS, Ctx
from ..models import Answer, Questionnaire
from ..services import audit
from ..services.state import ser_questionnaire

router = APIRouter(prefix="/orgs/{org_id}/questionnaires", tags=["questionnaires"])
MAX_UPLOAD = 5 * 1024 * 1024


def _q(ctx: Ctx, qid: str) -> Questionnaire:
    q = ctx.db.scalars(select(Questionnaire).where(Questionnaire.organization_id == ctx.org.id, Questionnaire.id == qid)).first()
    if not q:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Questionnaire not found")
    return q


@router.post("", status_code=201)
async def upload(ctx: Ctx = EDITORS, file: UploadFile = File(...), title: str = Form(""), customer_name: str = Form("")):
    data = await file.read(MAX_UPLOAD + 1)
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File is larger than 5 MB")
    try:
        questions = qa.parse_file(file.filename or "", data)
    except qa.QuestionnaireParseError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(e)) from None
    q = Questionnaire(organization_id=ctx.org.id, title=(title or file.filename or "Questionnaire")[:255],
                      customer_name=customer_name[:255], source_filename=(file.filename or "")[:255])
    ctx.db.add(q)
    ctx.db.flush()
    for i, (cat, text) in enumerate(questions, start=1):
        ctx.db.add(Answer(organization_id=ctx.org.id, questionnaire_id=q.id, question_number=i, category=cat, question=text))
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="QUESTIONNAIRE_UPLOADED",
              resource=q.title, details=f"{len(questions)} questions from {q.source_filename}")
    ctx.db.commit()
    ctx.db.refresh(q)
    return ser_questionnaire(q)


@router.post("/{qid}/autofill")
def autofill(qid: str, ctx: Ctx = EDITORS):
    q = _q(ctx, qid)
    pending = [a for a in q.answers if not a.human_approved]
    if not pending:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "All answers are already approved")
    stats = qa.autofill(ctx.db, ctx.org.id, pending)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="QUESTIONNAIRE_AUTOFILLED",
              resource=q.title, details=f"{stats['answered']} answered, {stats['flagged']} flagged for review. Drafts only.")
    ctx.db.commit()
    ctx.db.refresh(q)
    return {"stats": stats, "questionnaire": ser_questionnaire(q)}


class AnswerEdit(BaseModel):
    answer: str = Field(min_length=1, max_length=5000)


@router.put("/{qid}/answers/{aid}")
def edit_answer(qid: str, aid: str, body: AnswerEdit, ctx: Ctx = EDITORS):
    q = _q(ctx, qid)
    a = next((a for a in q.answers if str(a.id) == aid), None)
    if not a:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer not found")
    a.answer, a.human_approved = body.answer, False
    ctx.db.commit()
    return ser_questionnaire(q)


class ApproveIn(BaseModel):
    notes: str = Field(default="", max_length=2000)


@router.post("/{qid}/answers/{aid}/approve")
def approve_answer(qid: str, aid: str, body: ApproveIn, ctx: Ctx = EDITORS):
    q = _q(ctx, qid)
    a = next((a for a in q.answers if str(a.id) == aid), None)
    if not a or not a.answer:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Answer not found or empty")
    a.human_approved, a.needs_review = True, False
    a.review_notes, a.approved_by, a.approved_at = body.notes or None, ctx.actor, datetime.now(UTC)
    if all(x.human_approved for x in q.answers):
        q.completed_at = datetime.now(UTC)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="ANSWER_APPROVED",
              resource=f"{q.title} Q{a.question_number}")
    ctx.db.commit()
    return ser_questionnaire(q)


@router.get("/{qid}/export.csv")
def export(qid: str, ctx: Ctx = ANY_ROLE):
    q = _q(ctx, qid)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["#", "category", "question", "answer", "status", "confidence", "sources"])
    for a in q.answers:
        w.writerow([a.question_number, a.category, a.question, a.answer,
                    "approved" if a.human_approved else "draft - needs review" if a.needs_review else "draft",
                    a.confidence, "; ".join(f"{s.get('reference')}" for s in a.cited_sources)])
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="questionnaire-{q.id}.csv"'})


@router.delete("/{qid}", status_code=204)
def delete(qid: str, ctx: Ctx = EDITORS):
    q = _q(ctx, qid)
    audit.log(ctx.db, org_id=ctx.org.id, user_id=ctx.user.id, actor=ctx.actor, role=ctx.role, action="QUESTIONNAIRE_DELETED",
              resource=q.title)
    ctx.db.delete(q)
    ctx.db.commit()
