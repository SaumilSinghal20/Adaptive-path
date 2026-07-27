from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine, SessionLocal
from app.models.models import Topic, QuizQuestion  # noqa: F401 — imported so Base knows them
from app.models.bandit import BanditArm            # noqa: F401
from app.routers import auth, content, learner, quiz
from app.services.embeddings import content_index
from app.seed_data import SEED_TOPICS, SEED_QUESTIONS

app = FastAPI(title="AdaptivePath API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  # Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Create all tables (including new ones: users, quiz_questions, bandit_arms)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed topics
        if db.query(Topic).count() == 0:
            for t in SEED_TOPICS:
                db.add(Topic(**t))
            db.commit()

        # Seed quiz questions
        if db.query(QuizQuestion).count() == 0:
            for q in SEED_QUESTIONS:
                db.add(QuizQuestion(**q))
            db.commit()

        # Build the TF-IDF semantic search index
        topics = db.query(Topic).all()
        content_index.build([t.id for t in topics], [t.content_text for t in topics])
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(content.router)
app.include_router(learner.router)
app.include_router(quiz.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.2.0"}
