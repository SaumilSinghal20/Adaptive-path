# AdaptivePath — Backend

FastAPI service providing content, learner state, quiz submission, and (stub) auth.
This is the piece the frontend's `mockApi.js` will eventually be swapped out for.

## Run it

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs (auto-generated): http://localhost:8000/docs

SQLite database file (`adaptivepath.db`) is created automatically on first run and
seeded with the same 8-topic DSA graph the frontend uses.

## What's real vs. placeholder

**Real:**
- **Bayesian Knowledge Tracing** (`services/knowledge_tracing.py`) — the actual
  4-parameter BKT update, not the frontend's rough mock formula. Verified end to end:
  a 3/3 quiz correctly pushes mastery from 0.46 → 0.995.
- **Semantic search** (`services/embeddings.py`) — TF-IDF + cosine similarity over
  topic content. Verified: querying "contiguous subarray technique" correctly
  surfaces "Sliding window" as the top match.
- **SQLAlchemy models + SQLite persistence** — learner mastery actually persists
  across requests (unlike the frontend's in-memory-only state).

**Placeholder, by design, with a clear swap point:**
- `services/embeddings.py` uses TF-IDF instead of the planned
  `all-MiniLM-L6-v2` sentence-transformer — that model requires downloading weights
  from huggingface.co, which wasn't reachable from the sandbox this was built in.
  The file has the exact 3-line swap documented at the top once you have real
  internet access.
- `services/recommender.py` is the same rule-based logic as the frontend mock —
  this is exactly what the `rl-service` (contextual bandit / DQN) will replace.
- `routers/auth.py` returns a fake token with no real verification — replace before
  any real deployment.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/api/content/topics` | list all topics |
| GET | `/api/content/search?q=...` | semantic search over topic content |
| GET | `/api/learner/{learner_id}/state` | mastery, derived state, recommendation |
| POST | `/api/quiz/submit` | submit quiz result, runs real BKT update |
| POST | `/api/auth/login` | stub login, returns a fake token |

## Structure

```
app/
├── main.py                     # app entrypoint, seeds DB + content index on startup
├── db/database.py
├── models/models.py             # Topic, LearnerTopicState, QuizResult
├── services/
│   ├── knowledge_tracing.py    # real BKT
│   ├── embeddings.py           # TF-IDF semantic search (swap point for sentence-transformers)
│   └── recommender.py          # rule-based placeholder for rl-service
├── routers/{auth,content,learner,quiz}.py
└── seed_data.py                 # matches the frontend's topic graph exactly
```

## Connecting to the frontend

CORS is already configured for the Vite dev server (`http://localhost:5173`). To wire
the real frontend up, replace calls in `frontend/src/api/mockApi.js` with `fetch()`
calls to these endpoints — the response shapes were designed to match what the
frontend context already expects.

## Next milestone
`rl-service` — separate FastAPI microservice with the learner simulator, contextual
bandit, and DQN agent, replacing `services/recommender.py`.
