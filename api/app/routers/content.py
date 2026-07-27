from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Topic
from app.services.embeddings import content_index

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(Topic).all()
    return [
        {"id": t.id, "label": t.label, "parent_id": t.parent_id, "content_text": t.content_text}
        for t in topics
    ]


@router.get("/search")
def search_content(q: str, top_k: int = 5):
    """Semantic search over topic content (TF-IDF cosine similarity — see services/embeddings.py)."""
    return {"query": q, "results": content_index.search(q, top_k)}
