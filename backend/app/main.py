from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import analyze

app = FastAPI(title="Emotion Detector API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────────
# Permite frontend-ului (ex. Vercel) sa trimita cereri catre acest server.
# Fara asta, browserul blocheaza cererile din motive de securitate.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rute ──────────────────────────────────────────────────────────────
app.include_router(analyze.router, prefix="/analyze", tags=["Analiza"])


@app.get("/health", tags=["Sistem"])
def health_check():
    """Verifica daca serverul functioneaza. Folosit de Railway/Vercel."""
    return {"status": "ok"}
