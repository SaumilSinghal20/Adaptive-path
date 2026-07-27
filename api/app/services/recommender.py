"""
Epsilon-Greedy Contextual Bandit Recommender.

Upgrades the original rule-based heuristic with a lightweight bandit that:
  - Maintains a Q-value (running average mastery-delta reward) per (learner, topic) arm
  - ε = 0.15  →  explore 15% of the time (random unlocked topic)
  - ε = 0.85  →  exploit the arm with the highest Q-value
  - Cold-start: new learners have no arm data, so fall back to the heuristic (highest
    current mastery among unlocked topics) until they've done at least one quiz.

The bandit arms are updated by routers/quiz.py after every quiz submission, using the
BKT mastery delta (new_mastery - prior_mastery) as the reward signal.

`recommend_next` and `derive_states` keep the same signatures as the old recommender
so nothing else in the codebase breaks.
"""
import random

MASTERED_THRESHOLD = 0.8
EPSILON = 0.15          # exploration rate


def derive_states(topics: list[dict], mastery: dict[str, float]) -> dict[str, str]:
    state = {}
    for t in topics:
        m = mastery.get(t["id"], 0.0)
        parent_mastered = t["parent_id"] is None or mastery.get(t["parent_id"], 0.0) >= MASTERED_THRESHOLD
        if m >= MASTERED_THRESHOLD:
            state[t["id"]] = "mastered"
        elif parent_mastered:
            state[t["id"]] = "unlocked"
        else:
            state[t["id"]] = "locked"
    return state


def recommend_next(
    topics: list[dict],
    mastery: dict[str, float],
    db=None,
    learner_id: str | None = None,
) -> dict:
    """
    Pick the next topic to recommend.

    If db + learner_id are provided, uses the epsilon-greedy bandit (reads
    BanditArm rows).  Falls back to the mastery heuristic when no arm data
    exists (cold-start) or when called without a DB session (legacy path).
    """
    state = derive_states(topics, mastery)
    candidates = [t for t in topics if state[t["id"]] == "unlocked"]

    if not candidates:
        return {"topic_id": None, "confidence": 0.0, "alternatives": [], "mode": "exhausted"}

    # ------------------------------------------------------------------
    # Try bandit path
    # ------------------------------------------------------------------
    if db is not None and learner_id:
        try:
            from app.models.bandit import BanditArm
            arms = {
                row.topic_id: row
                for row in db.query(BanditArm)
                .filter(
                    BanditArm.learner_id == learner_id,
                    BanditArm.topic_id.in_([c["id"] for c in candidates]),
                )
                .all()
            }
            # Only use bandit if the learner has at least one pull on any candidate
            if any(arms.get(c["id"]) and arms[c["id"]].pull_count > 0 for c in candidates):
                if random.random() < EPSILON:
                    # Explore — pick a random unlocked topic
                    chosen = random.choice(candidates)
                    mode = "explore"
                else:
                    # Exploit — pick the arm with the highest Q-value
                    def _q(t):
                        arm = arms.get(t["id"])
                        return arm.q_value if arm and arm.pull_count > 0 else -1.0

                    sorted_cands = sorted(candidates, key=_q, reverse=True)
                    chosen = sorted_cands[0]
                    mode = "exploit"

                chosen_q = arms.get(chosen["id"])
                confidence = round(min(0.97, 0.50 + (chosen_q.q_value if chosen_q else 0.5) * 0.5), 2)
                alternatives = [
                    {
                        "topic_id": c["id"],
                        "confidence": round(confidence - 0.10 * (i + 1), 2),
                    }
                    for i, c in enumerate(
                        [x for x in candidates if x["id"] != chosen["id"]][:2]
                    )
                ]
                return {
                    "topic_id": chosen["id"],
                    "confidence": confidence,
                    "alternatives": alternatives,
                    "mode": mode,
                }
        except Exception:
            pass  # Fall through to heuristic on any error

    # ------------------------------------------------------------------
    # Heuristic fallback (cold-start or no DB session)
    # ------------------------------------------------------------------
    sorted_cands = sorted(candidates, key=lambda t: mastery.get(t["id"], 0.0), reverse=True)
    top = sorted_cands[0]
    top_mastery = mastery.get(top["id"], 0.0)
    confidence = round(min(0.95, 0.55 + top_mastery / 2), 2)

    alternatives = [
        {"topic_id": c["id"], "confidence": round(confidence - 0.12 * (i + 1), 2)}
        for i, c in enumerate(sorted_cands[1:3])
    ]
    return {
        "topic_id": top["id"],
        "confidence": confidence,
        "alternatives": alternatives,
        "mode": "heuristic",
    }
