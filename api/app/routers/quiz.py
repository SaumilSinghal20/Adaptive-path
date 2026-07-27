"""
Quiz router — serves questions and processes quiz submissions.

Endpoints:
  GET  /api/quiz/questions/{topic_id}  — return 3 questions for the topic
  POST /api/quiz/submit                — score quiz, run BKT update, update bandit arm
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.models import Topic, LearnerTopicState, QuizResult, QuizQuestion
from app.models.bandit import BanditArm
from app.services.knowledge_tracing import apply_quiz_to_mastery
from app.services.recommender import recommend_next, derive_states

router = APIRouter(prefix="/api/quiz", tags=["quiz"])


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

@router.get("/questions/{topic_id}")
def get_questions(topic_id: str, db: Session = Depends(get_db)):
    """Return the quiz questions for a given topic (max 3, randomised order)."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    rows = db.query(QuizQuestion).filter(QuizQuestion.topic_id == topic_id).all()
    return [
        {
            "id": r.id,
            "topic_id": r.topic_id,
            "question": r.question,
            "options": json.loads(r.options),
            "answer_index": r.answer_index,
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Submit
# ---------------------------------------------------------------------------

class QuizSubmission(BaseModel):
    learner_id: str
    topic_id: str
    correct_count: int
    total_count: int


@router.post("/submit")
def submit_quiz(payload: QuizSubmission, db: Session = Depends(get_db)):
    if payload.total_count <= 0 or payload.correct_count < 0 or payload.correct_count > payload.total_count:
        raise HTTPException(status_code=400, detail="Invalid correct_count/total_count")

    # ------------------------------------------------------------------
    # BKT update
    # ------------------------------------------------------------------
    state_row = (
        db.query(LearnerTopicState)
        .filter(
            LearnerTopicState.learner_id == payload.learner_id,
            LearnerTopicState.topic_id == payload.topic_id,
        )
        .first()
    )
    prior_mastery = state_row.p_mastery if state_row else 0.1
    new_mastery = apply_quiz_to_mastery(prior_mastery, payload.correct_count, payload.total_count)
    mastery_delta = new_mastery - prior_mastery

    if state_row:
        state_row.p_mastery = new_mastery
    else:
        state_row = LearnerTopicState(
            learner_id=payload.learner_id,
            topic_id=payload.topic_id,
            p_mastery=new_mastery,
        )
        db.add(state_row)

    db.add(QuizResult(
        learner_id=payload.learner_id,
        topic_id=payload.topic_id,
        correct_count=payload.correct_count,
        total_count=payload.total_count,
    ))

    # ------------------------------------------------------------------
    # Bandit arm update (incremental average: Q ← Q + (r - Q) / n)
    # ------------------------------------------------------------------
    arm = (
        db.query(BanditArm)
        .filter(BanditArm.learner_id == payload.learner_id, BanditArm.topic_id == payload.topic_id)
        .first()
    )
    if arm:
        arm.pull_count += 1
        arm.q_value += (mastery_delta - arm.q_value) / arm.pull_count
    else:
        db.add(BanditArm(
            learner_id=payload.learner_id,
            topic_id=payload.topic_id,
            q_value=mastery_delta,
            pull_count=1,
        ))

    db.commit()

    # ------------------------------------------------------------------
    # Return updated state + new recommendation
    # ------------------------------------------------------------------
    all_states = db.query(LearnerTopicState).filter(LearnerTopicState.learner_id == payload.learner_id).all()
    mastery = {r.topic_id: r.p_mastery for r in all_states}
    topics = [{"id": t.id, "label": t.label, "parent_id": t.parent_id} for t in db.query(Topic).all()]

    return {
        "topic_id": payload.topic_id,
        "prior_mastery": round(prior_mastery, 3),
        "new_mastery": round(new_mastery, 3),
        "mastery_delta": round(mastery_delta, 3),
        "state": derive_states(topics, mastery),
        "recommendation": recommend_next(topics, mastery, db=db, learner_id=payload.learner_id),
    }
