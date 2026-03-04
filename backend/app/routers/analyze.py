from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.emotion_service import analizeaza_imagine

router = APIRouter()


# ── Modele de date (ce primeste si ce returneaza endpoint-ul) ─────────

class InputCadru(BaseModel):
    image: str  # imaginea trimisa de frontend, codificata in base64


class Dreptunghi(BaseModel):
    x: int  # pozitia stanga a fetei (pixeli)
    y: int  # pozitia sus a fetei (pixeli)
    w: int  # latimea fetei (pixeli)
    h: int  # inaltimea fetei (pixeli)


class RezultatEmotie(BaseModel):
    emotie_dominanta: str | None   # ex: "happy", "sad" — None daca nu e fata
    incredere: float | None        # cat de sigur e modelul (0.0 → 1.0)
    emotii: dict[str, float] | None  # toate cele 7 emotii cu scorurile lor
    dreptunghi: Dreptunghi | None  # pozitia fetei in imagine


# ── Endpoint-uri ──────────────────────────────────────────────────────

@router.post("/frame", response_model=RezultatEmotie)
async def analizeaza_cadru(input: InputCadru):
    """
    Primeste un cadru video (base64 JPEG) de la frontend
    si returneaza emotiile detectate.
    """
    try:
        return analizeaza_imagine(input.image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare la analiza: {e}")
