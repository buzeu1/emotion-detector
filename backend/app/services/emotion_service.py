import base64

import cv2
import numpy as np
from fer import FER

# Initializam detectorul o singura data la pornirea serverului.
# mtcnn=True = mai precis dar mai lent. Pune False daca e prea lent.
_detector = FER(mtcnn=True)


def analizeaza_imagine(imagine_base64: str) -> dict:
    """
    Primeste o imagine codificata in base64.
    Returneaza emotiile detectate sau valori null daca nu gaseste nicio fata.
    """

    # Pasul 1: decodificam base64 → bytes → numpy array → imagine OpenCV
    bytes_imagine = base64.b64decode(imagine_base64)
    array = np.frombuffer(bytes_imagine, dtype=np.uint8)
    cadru = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if cadru is None:
        return _raspuns_gol()

    # Pasul 2: detectam emotiile cu FER
    rezultate = _detector.detect_emotions(cadru)

    if not rezultate:
        return _raspuns_gol()

    # Pasul 3: luam prima fata detectata
    fata = rezultate[0]
    emotii = fata["emotions"]
    emotie_dominanta = max(emotii, key=emotii.get)
    x, y, w, h = fata["box"]

    return {
        "emotie_dominanta": emotie_dominanta,
        "incredere": round(emotii[emotie_dominanta], 4),
        "emotii": {k: round(v, 4) for k, v in emotii.items()},
        "dreptunghi": {"x": x, "y": y, "w": w, "h": h},
    }


def _raspuns_gol() -> dict:
    """Returnat cand nu se detecteaza nicio fata in imagine."""
    return {
        "emotie_dominanta": None,
        "incredere": None,
        "emotii": None,
        "dreptunghi": None,
    }
