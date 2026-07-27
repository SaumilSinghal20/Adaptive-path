from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, func
from app.db.database import Base


class User(Base):
    """Registered learners — stores hashed password for real auth."""
    __tablename__ = "users"
    id = Column(String, primary_key=True)            # email used as the stable learner_id
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class Topic(Base):
    __tablename__ = "topics"
    id = Column(String, primary_key=True)          # e.g. "slidingwindow"
    label = Column(String, nullable=False)
    parent_id = Column(String, ForeignKey("topics.id"), nullable=True)
    content_text = Column(String, nullable=False)   # source text for embeddings + lesson body


class QuizQuestion(Base):
    """Per-topic quiz questions served from DB (seeded from seed_data.py)."""
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    question = Column(String, nullable=False)
    options = Column(String, nullable=False)         # JSON-encoded list of strings
    answer_index = Column(Integer, nullable=False)   # 0-based index of correct option


class LearnerTopicState(Base):
    """Per-learner, per-topic mastery — the live BKT state."""
    __tablename__ = "learner_topic_state"
    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, index=True, nullable=False)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    p_mastery = Column(Float, default=0.1)          # BKT P(L) - probability topic is learned
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    learner_id = Column(String, index=True, nullable=False)
    topic_id = Column(String, ForeignKey("topics.id"), nullable=False)
    correct_count = Column(Integer, nullable=False)
    total_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
