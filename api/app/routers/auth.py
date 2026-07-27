"""
Real JWT-based auth router.

Endpoints:
  POST /api/auth/signup  — create account, return token + learner_id
  POST /api/auth/login   — verify credentials, return token + learner_id
  GET  /api/auth/me      — return current user info from Bearer token

learner_id == user email (stable, human-readable, easy to debug).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, LearnerTopicState
from app.services.auth_utils import hash_password, verify_password, create_access_token, decode_access_token
from app.seed_data import SEED_MASTERY

router = APIRouter(prefix="/api/auth", tags=["auth"])
_bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    learner_id: str
    full_name: str


class MeResponse(BaseModel):
    learner_id: str
    full_name: str
    email: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _seed_learner(db: Session, learner_id: str):
    """Seed initial mastery state for a brand-new learner."""
    for topic_id, mastery in SEED_MASTERY.items():
        db.add(LearnerTopicState(learner_id=learner_id, topic_id=topic_id, p_mastery=mastery))
    db.commit()


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """Create a new account. Returns a JWT token on success."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        id=payload.email,           # learner_id == email
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _seed_learner(db, user.id)

    token = create_access_token({"sub": user.id})
    return AuthResponse(token=token, learner_id=user.id, full_name=user.full_name)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a JWT token."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user.id})
    return AuthResponse(token=token, learner_id=user.id, full_name=user.full_name)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(_get_current_user)):
    """Return the currently authenticated user's profile."""
    return MeResponse(
        learner_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
    )


# ---------------------------------------------------------------------------
# Mock OAuth Endpoints
# ---------------------------------------------------------------------------

@router.get("/{provider}/login")
def oauth_login(provider: str):
    """
    Initiate the mock OAuth flow.
    In a real app, this would redirect to Google/GitHub authorization URL.
    """
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    # Redirect immediately to our callback
    return RedirectResponse(url=f"/api/auth/{provider}/callback")


@router.get("/{provider}/callback")
def oauth_callback(provider: str, db: Session = Depends(get_db)):
    """
    Handle the callback from the OAuth provider.
    In a real app, this exchanges the code for a token and fetches user info.
    """
    if provider not in ["google", "github"]:
        raise HTTPException(status_code=400, detail="Invalid provider")

    # Mock user info based on provider
    if provider == "google":
        email = "demo.google@example.com"
        full_name = "Google User"
    else:
        email = "demo.github@example.com"
        full_name = "GitHub User"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-signup
        user = User(
            id=email,
            email=email,
            full_name=full_name,
            hashed_password=None  # Nullable password for OAuth
        )
        db.add(user)
        _seed_learner(db, learner_id=email)
        
    token = create_access_token({"sub": user.id})
    # Redirect back to the frontend with the token
    return RedirectResponse(url=f"http://localhost:5173/oauth-callback?token={token}")
