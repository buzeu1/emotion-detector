# Emotion Camera

A real-time facial emotion detection web app using your webcam and artificial intelligence.

Detects 7 emotions: **Happy, Sad, Angry, Scared, Surprised, Disgusted, Neutral**

---

## Structure

```
emotion-detector/
├── backend/                  # Python API (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/analyze.py
│   │   └── services/emotion_service.py
│   ├── Dockerfile
│   ├── Procfile
│   └── requirements.txt
└── frontend/                 # Web interface (Next.js)
    ├── app/
    ├── components/
    │   ├── WebcamCapture.tsx
    │   └── EmotionOverlay.tsx
    ├── lib/api.ts
    └── package.json
```

---

## Technologies

| Component | Technology |
|---|---|
| Emotion Detection | FER (Facial Expression Recognition) |
| Computer Vision | OpenCV |
| Backend API | FastAPI + Uvicorn |
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Containerization | Docker |

---

## How I built it

The backend is written in Python with FastAPI and uses the FER library for facial expression recognition via OpenCV. The frontend is built with Next.js and TypeScript — it captures frames from the webcam every 300ms and sends them via a POST request to the FastAPI backend as base64 encoded images. The backend processes the frame, detects the emotion, and returns the results in the same base64 JSON format, which the frontend then displays in real time with progress bars and an overlay on the detected face.

For deployment, the backend is containerized with Docker and hosted on **Railway**, while the frontend is deployed on **Vercel** with the backend URL set through an environment variable.

---

---

# Emotion Camera

O aplicatie web de detectie a emotiilor faciale in timp real, folosind webcam-ul si inteligenta artificiala.

Detecteaza 7 emotii: **Fericit, Trist, Infuriat, Speriat, Surprins, Dezgustat, Neutru**

---

## Structura

```
emotion-detector/
├── backend/                  # API Python (FastAPI)
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/analyze.py
│   │   └── services/emotion_service.py
│   ├── Dockerfile
│   ├── Procfile
│   └── requirements.txt
└── frontend/                 # Interfata web (Next.js)
    ├── app/
    ├── components/
    │   ├── WebcamCapture.tsx
    │   └── EmotionOverlay.tsx
    ├── lib/api.ts
    └── package.json
```

---

## Tehnologii

| Componenta | Tehnologie |
|---|---|
| Detectie emotii | FER (Facial Expression Recognition) |
| Computer Vision | OpenCV |
| Backend API | FastAPI + Uvicorn |
| Frontend | Next.js 14, React 18, TypeScript |
| Stilizare | Tailwind CSS |
| Containerizare | Docker |

---

## Cum am construit

Backendui este scris in Python cu FastAPI si foloseste biblioteca FER pentru recunoasterea expresiilor faciale prin OpenCV. Frontendui este construit cu Next.js si TypeScript — captureaza cadre din webcam la fiecare 300ms si le trimite prin POST request la backendui FastAPI ca imagini encodate in base64. Backendui proceseaza cadrul, detecteaza emotia si returneaza rezultatele in acelasi format JSON base64, pe care frontendui le afiseaza in timp real cu bare de progres si overlay pe fata detectata.

Pentru deploy, backendui este containerizat cu Docker si hostat pe **Railway**, iar frontendui este deploiat pe **Vercel** cu URL-ul backend-ului setat prin variabila de mediu.

