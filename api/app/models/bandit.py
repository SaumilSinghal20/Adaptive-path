"""Epsilon-Greedy contextual bandit arm state — one row per (learner, topic) pair.

The bandit upgrades the rule-based recommender in services/recommender.py.
- Q-value  : running average of BKT mastery-delta rewards received for this topic
- pull_count: number of times this topic was recommended to this learner

Cold-start (pull_count == 0) falls back to the mastery-heuristic until the bandit
has enough signal to learn preferences.
"""
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from app.db.database import Base


class BanditArm(Base):
    __tablename__ = "bandit_arms"
    learner_id = Column(String, ForeignKey("users.id"), primary_key=True)
    topic_id = Column(String, ForeignKey("topics.id"), primary_key=True)
    q_value = Column(Float, default=0.5)   # running average reward (mastery delta)
    pull_count = Column(Integer, default=0)
