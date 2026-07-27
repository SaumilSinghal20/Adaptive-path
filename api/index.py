from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Adaptive Path API is running"}

# Import your routes here
# from .routes import router
# app.include_router(router)

# Placeholder for additional API endpoints
@app.get("/api/")
async def root():
    return {"message": "Welcome to Adaptive Path API", "version": "1.0.0"}
