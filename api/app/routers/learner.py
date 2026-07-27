from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Topic, LearnerTopicState
from app.services.recommender import recommend_next, derive_states
from app.seed_data import SEED_MASTERY

router = APIRouter(prefix="/api/learner", tags=["learner"])


def _get_or_seed_mastery(db: Session, learner_id: str) -> dict[str, float]:
    rows = db.query(LearnerTopicState).filter(LearnerTopicState.learner_id == learner_id).all()
    if rows:
        return {r.topic_id: r.p_mastery for r in rows}

    # Brand new learner — seed with starting mastery
    for topic_id, mastery in SEED_MASTERY.items():
        db.add(LearnerTopicState(learner_id=learner_id, topic_id=topic_id, p_mastery=mastery))
    db.commit()
    return SEED_MASTERY.copy()


@router.get("/{learner_id}/state")
def get_learner_state(learner_id: str, db: Session = Depends(get_db)):
    topics = [
        {"id": t.id, "label": t.label, "parent_id": t.parent_id}
        for t in db.query(Topic).all()
    ]
    mastery = _get_or_seed_mastery(db, learner_id)
    state = derive_states(topics, mastery)
    # Pass db + learner_id so the bandit can be used for recommendation
    recommendation = recommend_next(topics, mastery, db=db, learner_id=learner_id)

    return {
        "learner_id": learner_id,
        "mastery": mastery,
        "state": state,
        "recommendation": recommendation,
    }
