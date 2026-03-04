# Explicatie completa a proiectului Emotion Camera

---

## Ce face proiectul?

Deschizi site-ul pe telefon sau PC, ti se cere acces la camera, si in timp real
aplicatia detecteaza emotia de pe fata ta (fericit, trist, suparat etc.) si ti-o
arata cu o imagine si bare de progres.

---

## Structura generala (tipica pentru orice proiect full-stack)

Orice aplicatie web moderna are doua parti mari:

```
emotion-detector/
├── frontend/    ← ce vede utilizatorul in browser (interfata)
└── backend/     ← serverul care face calculele grele (AI, procesare)
```

Aceasta separare e **clasica si standard**. Frontend-ul NU poate rula
TensorFlow sau OpenCV direct in browser — e prea greu si nesigur. Asa ca
trimite imaginile la backend, care le proceseaza si raspunde.

---

## Frontend — ce este si cum functioneaza

**Tehnologie:** Next.js (React) + TypeScript + Tailwind CSS
**Deployed pe:** Vercel (gratis, deploy automat la fiecare push pe GitHub)

### De ce Next.js?
Next.js este un framework peste React care adauga:
- routing automat (fiecare fisier din `app/` devine o pagina)
- optimizari de performanta
- suport pentru TypeScript din start

### De ce TypeScript?
TypeScript = JavaScript cu tipuri. In loc de `let x = 5` poti scrie
`let x: number = 5`. Iti arata erorile inainte sa rulezi codul.

### De ce Tailwind CSS?
Tailwind iti permite sa stilizezi direct in HTML/JSX cu clase predefinite
(`bg-gray-900`, `flex`, `rounded-xl` etc.) fara sa scrii fisiere CSS separate.

---

### Structura folderului frontend/

```
frontend/
├── app/                    ← paginile aplicatiei (routing Next.js)
│   ├── layout.tsx          ← "scheletul" HTML comun tuturor paginilor
│   │                          (titlul, fontul, <html> si <body>)
│   ├── page.tsx            ← pagina principala (ruta "/")
│   │                          asaza camera si panoul de emotii in layout
│   └── globals.css         ← stiluri CSS globale (reseturi de baza, Tailwind)
│
├── components/             ← bucati de UI reutilizabile (componente React)
│   ├── WebcamCapture.tsx   ← porneste camera, capteaza cadre, le trimite la server
│   └── EmotionOverlay.tsx  ← panoul din dreapta/jos cu poza emotiei si bare
│
├── lib/                    ← cod ajutator (logica, nu UI)
│   └── api.ts              ← singura functie care vorbeste cu backend-ul
│                              trimite base64, primeste emotiile detectate
│
├── public/                 ← fisiere statice servite direct (fara procesare)
│   └── images/             ← pozele emotiilor (fericit.jpg, trist.jpg etc.)
│                              Next.js le serveste la /images/fericit.jpg
│
├── next.config.mjs         ← configuratia Next.js (la noi e goala, defaults)
├── tailwind.config.ts      ← configuratia Tailwind (ce fisiere sa scaneze)
├── tsconfig.json           ← configuratia TypeScript (cum sa compileze)
├── next-env.d.ts           ← generat automat de Next.js, da tipuri pentru TypeScript
└── package.json            ← lista de dependinte npm + comenzile disponibile
                               ("npm run dev" porneste serverul local)
```

---

### Cum circula datele in frontend

```
1. WebcamCapture porneste camera (getUserMedia)
2. La fiecare 300ms: captureaza un frame din video
3. Converteste frame-ul in base64 JPEG
4. Trimite base64 la backend prin lib/api.ts (POST /analyze/frame)
5. Primeste raspunsul (emotie, scor, dreptunghi fata)
6. Deseneaza dreptunghiul + emoji pe canvas (suprapus peste video)
7. Trimite rezultatul sus in page.tsx via prop onRezultat
8. page.tsx il paseaza la EmotionOverlay
9. EmotionOverlay actualizeaza imaginea si barele de progres
```

---

## Backend — ce este si cum functioneaza

**Tehnologie:** Python + FastAPI + FER (Face Emotion Recognition)
**Deployed pe:** Railway (cu Docker, gratis cu limite)

### De ce FastAPI?
FastAPI este cel mai rapid framework web pentru Python. Avantaje:
- genereaza automat documentatie la /docs
- validare automata a datelor cu Pydantic
- suport async nativ

### De ce FER?
FER (Face Emotion Recognition) este o librarie Python care foloseste:
- **OpenCV** pentru a detecta fata in imagine (Haar Cascade)
- **TensorFlow** pentru a clasifica emotia fetei detectate

Folosim `FER(mtcnn=False)` — detectia mai simpla, fara PyTorch (~1GB evitat).

---

### Structura folderului backend/

```
backend/
├── app/                         ← pachetul Python principal
│   ├── __init__.py              ← fisier gol, marcheaza folderul ca pachet Python
│   │                               (Python nu recunoaste importurile fara el)
│   ├── main.py                  ← punctul de intrare al serverului
│   │                               creeaza aplicatia FastAPI, adauga CORS, inregistreaza rutele
│   ├── routers/                 ← endpoint-urile API (rutele HTTP)
│   │   ├── __init__.py          ← fisier gol, pachet Python
│   │   └── analyze.py           ← ruta POST /analyze/frame
│   │                               primeste imaginea, apeleaza serviciul, returneaza rezultatul
│   └── services/                ← logica de business (separat de rute)
│       ├── __init__.py          ← fisier gol, pachet Python
│       └── emotion_service.py   ← decodeaza base64, ruleaza FER, returneaza emotiile
│
├── Dockerfile                   ← reteta pentru a construi containerul Docker
│                                   instaleaza Python, dependintele, codul, porneste serverul
├── requirements.txt             ← lista completa a dependintelor Python (referinta)
│                                   Dockerfile le instaleaza manual (nu foloseste acest fisier)
└── runtime.txt                  ← specifica versiunea Python (python-3.11)
                                    folosit de platforme non-Docker ca Heroku
```

---

### De ce separare routers/ si services/?

Aceasta e o conventie clasica:

- **routers/** = stie doar despre HTTP (primeste request, returneaza response)
- **services/** = stie doar despre logica (procesare imagini, AI)

Avantaj: daca vrei sa schimbi libraria AI, modifici doar `emotion_service.py`,
nu atingi nimic din rute. Daca vrei sa adaugi un nou endpoint, nu atingi logica AI.

---

### Ce este Docker si de ce il folosim?

**Problema:** TensorFlow si OpenCV au dependinte de sistem (libGL, libGLib etc.)
care nu exista pe serverele standard. Fara Docker, ar trebui sa instalezi manual
aceste librarii pe fiecare server.

**Solutia - Docker:** Creezi o "reteta" (Dockerfile) care porneste de la o imagine
curata de Python, instaleaza exact ce ai nevoie, si codul tau ruleaza identic
oriunde — pe laptop, pe Railway, pe orice server.

```
Dockerfile (simplificat):
1. Porneste de la python:3.11-slim (Linux minimal)
2. Instaleaza libGL, libGLib (necesare pentru OpenCV)
3. Instaleaza toate pachetele Python
4. Copiaza codul aplicatiei
5. Porneste serverul: uvicorn app.main:app
```

---

### Ce este CORS si de ce am setat allow_origins=["*"]?

**Problema:** Browserele blocheaza implicit requesturile de pe un domeniu
la un alt domeniu (securitate). Frontend-ul e pe `vercel.app`, backend-ul pe
`railway.app` — domenii diferite.

**CORS** (Cross-Origin Resource Sharing) = mecanism prin care serverul spune
browserului "accept requesturi si de la alte domenii".

`allow_origins=["*"]` = accept de la orice domeniu. Merge pentru proiecte
personale/scolare. Intr-o aplicatie de productie ai pune doar domeniul tau.

---

## Fluxul complet end-to-end

```
[Telefon/PC]
    |
    | Camera → frame JPEG → base64 string
    |
[Frontend - Vercel]
    |
    | POST https://...railway.app/analyze/frame
    | Body: { "image": "base64string..." }
    |
[Backend - Railway]
    |
    | base64 → bytes → numpy array → imagine OpenCV
    | OpenCV detecteaza fata → FER clasifica emotia
    | Returneaza: { emotie_dominanta, incredere, emotii, dreptunghi }
    |
[Frontend - Vercel]
    |
    | Actualizeaza UI:
    | - deseneaza dreptunghi pe canvas
    | - schimba poza si bara de progres in EmotionOverlay
    |
[Telefon/PC - Ecran]
```

---

## Fisierele de configurare (ce sa cauti in ele)

| Fisier | Ce configureaza |
|--------|----------------|
| `package.json` | dependinte npm, comenzi (dev, build, start) |
| `tsconfig.json` | cum compileaza TypeScript (module, paths, strictness) |
| `tailwind.config.ts` | ce fisiere sa scaneze Tailwind pentru clase |
| `next.config.mjs` | configuratii Next.js (redirecturi, variabile etc.) |
| `.gitignore` | ce fisiere sa NU fie urcate pe GitHub (node_modules, .env) |
| `Dockerfile` | cum se construieste containerul pentru Railway |
| `requirements.txt` | dependintele Python (referinta) |

---

## Comenzi utile

### Frontend (in folderul frontend/)
```bash
npm run dev      # porneste serverul local pe http://localhost:3000
npm run build    # construieste versiunea de productie
```

### Backend (in folderul backend/)
```bash
uvicorn app.main:app --reload    # porneste serverul local pe http://localhost:8000
                                  # --reload = reporneste automat la modificari
```

### Docker (in folderul backend/)
```bash
docker build -t emotion-backend .    # construieste imaginea Docker
docker run -p 8000:8000 emotion-backend  # ruleaza containerul
```

---

## Variabile de mediu (.env) — ce sunt si de ce conteaza

Variabilele de mediu sunt setari care se schimba intre local si productie.
**NU se urca pe GitHub** (sunt in .gitignore).

| Variabila | Unde | Valoare locala | Valoare productie |
|-----------|------|----------------|-------------------|
| `NEXT_PUBLIC_API_URL` | Vercel | `http://localhost:8000` | `https://...railway.app` |

**De ce NEXT_PUBLIC_?** In Next.js, variabilele accesibile in browser TREBUIE
sa inceapa cu `NEXT_PUBLIC_`. Altfel sunt disponibile doar pe server.

**Important:** Variabilele cu `NEXT_PUBLIC_` sunt "baked in" la build time —
dupa ce schimbi valoarea pe Vercel, trebuie sa faci un nou deploy ca sa aiba efect.

---

## De ce am ales aceste tehnologii si nu altele?

| Alegere | Alternativa | De ce am ales |
|---------|-------------|---------------|
| Next.js | React pur, Vue, Angular | Routing automat, deploy simplu pe Vercel |
| FastAPI | Flask, Django | Mai rapid, validare automata, async |
| Railway | Heroku, Render, AWS | Deploy simplu din GitHub, suporta Docker |
| Vercel | Netlify, GitHub Pages | Integrat cu Next.js, deploy automat |
| Tailwind | CSS clasic, Bootstrap | Nu scrii CSS separat, clase utilitare rapide |
| Docker | Requirements.txt direct | TensorFlow/OpenCV au nevoie de dependinte sistem |
