# Emotion Camera — Explicatie completa a proiectului

> Acest fisier explica tot proiectul de la zero: ce face, cum functioneaza,
> de ce s-au luat anumite decizii, si ce concepte tehnice sunt implicate.

---

## 1. Ce face proiectul (descriere simpla)

Deschizi site-ul pe telefon sau PC, iti dai acces la camera, si aplicatia
detecteaza in timp real emotia de pe fata ta. Afiseaza o imagine reprezentativa
(fericit, trist, suparat etc.) si bare de progres cu cat la suta esti din fiecare
emotie, actualizate de ~3 ori pe secunda.

**Emotiile detectate:** fericit, trist, suparat, speriat, surprins, dezgustat, neutru.

**De ce e interesant tehnic:**
- ruleaza AI (retea neurala) pe imagini live de la camera
- are doua aplicatii separate care comunica prin internet
- functioneaza pe orice dispozitiv cu browser (PC, telefon, tableta)
- deploy automat la fiecare modificare de cod

---

## 2. Arhitectura generala — ce inseamna "full-stack"

**Full-stack** = o aplicatie care are atat parte vizuala (frontend) cat si server (backend).

```
┌─────────────────────────────────────────────────────────┐
│                    UTILIZATOR                           │
│              (browser pe telefon/PC)                    │
└─────────────────┬───────────────────────────────────────┘
                  │ vede si interactioneaza cu
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND                              │
│         Next.js + React + TypeScript                    │
│              Gazduit pe: Vercel                         │
│                                                         │
│  - afiseaza camera video                                │
│  - captureaza cadre si le trimite la backend            │
│  - afiseaza rezultatele (poza emotie, bare progres)     │
└─────────────────┬───────────────────────────────────────┘
                  │ trimite imagini prin internet (HTTP/HTTPS)
                  │ primeste emotiile detectate
                  ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND                               │
│            Python + FastAPI + FER                       │
│             Gazduit pe: Railway                         │
│                                                         │
│  - primeste imaginea de la frontend                     │
│  - detecteaza fata cu OpenCV                            │
│  - clasifica emotia cu TensorFlow                       │
│  - raspunde cu rezultatele                              │
└─────────────────────────────────────────────────────────┘
```

**De ce nu am facut totul intr-o singura aplicatie?**

Browser-ul (unde ruleaza frontend-ul) este un mediu restrictionat — nu poti
instala TensorFlow sau OpenCV in el. De aceea logica AI sta pe un server separat
(backend) care are acces la toate librariile necesare.

---

## 3. Cum comunica frontend-ul cu backend-ul — REST API

Comunicarea se face prin **REST API** — un standard universal pentru schimbul
de date intre aplicatii prin internet.

**Ce este un API?**
API = Application Programming Interface = o interfata prin care doua programe
vorbesc intre ele. Ca o usa cu un ghiseu: tu bagi o cerere, primesti un raspuns.

**Ce este REST?**
REST defineste cum trebuie structurate aceste cereri. Foloseste metodele HTTP:
- `GET` — cere date (ca sa citesti ceva)
- `POST` — trimite date (ca sa faci ceva cu ele)
- `PUT/PATCH` — modifica ceva existent
- `DELETE` — sterge ceva

In proiectul nostru avem un singur endpoint:
```
POST /analyze/frame
  → trimite: { "image": "base64string..." }
  ← primeste: { "emotie_dominanta": "happy", "incredere": 0.87, ... }
```

**FastAPI** genereaza automat documentatie interactiva la adresa
`https://[url-railway]/docs` — poti testa endpoint-ul direct din browser.

---

## 4. Ce este base64 si de ce il folosim

**Problema:** Camera produce imagini (date binare — bytes). HTTP poate transporta
text, nu bytes direct in JSON.

**Solutia — base64:** Convertim bytes-urile imaginii intr-un sir de caractere
text (litere + cifre + `+` `/`). Arata asa:
```
/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U...
```

Pasii din cod:
```
Camera video
    ↓ (canvas.toDataURL)
Frame JPEG → base64 string (frontend trimite asta)
    ↓ (base64.b64decode)
bytes → numpy array → imagine OpenCV (backend lucreaza cu asta)
```

---

## 5. Cum functioneaza detectia de emotii — AI explicat

### Pasul 1: Detectia fetei (OpenCV — Haar Cascade)

**OpenCV** (Open Computer Vision) este o librarie de procesare a imaginilor.

**Haar Cascade** este un algoritm clasic (2001, Viola-Jones) care detecteaza fete
in imagini. Functioneaza prin:
1. Imparte imaginea in zone mici
2. Cauta tipare caracteristice fetelor (ochi mai intunecati decat fruntea etc.)
3. Aplica sute de astfel de "filtre" in secventa
4. Daca zona trece toate filtrele → e o fata

Returneaza un **dreptunghi** `(x, y, w, h)` — pozitia fetei in imagine.

**Alternativa — MTCNN** (Multi-task Cascaded Convolutional Networks):
- mult mai precis, detecteaza fete in unghiuri dificile
- necesita **facenet-pytorch** (~1GB extra)
- am ales `mtcnn=False` ca sa nu depasim limitele de memorie pe Railway

### Pasul 2: Clasificarea emotiei (TensorFlow — Retea Neurala)

**TensorFlow** este framework-ul Google pentru Machine Learning.

**Cum a invatat modelul?** A fost antrenat pe sute de mii de imagini cu fete
etichetate manual (oameni care au zis "asta e fata fericita", "asta e trista" etc.).
Reteaua neurala a invatat ce pixeli/tipare corespund fiecarei emotii.

**Ce primim inapoi:** un scor intre 0 si 1 pentru fiecare din cele 7 emotii.
Suma lor = 1 (probabilitati). Emotia cu scorul cel mai mare = emotia dominanta.

```python
emotii = {
    "happy":    0.82,   # 82% fericit
    "neutral":  0.10,   # 10% neutru
    "sad":      0.05,   # 5% trist
    ...
}
emotie_dominanta = "happy"
incredere = 0.82
```

**De ce 7 emotii?** Psihologul Paul Ekman a identificat in anii '70 sase emotii
universale (prezente in toate culturile umane): fericire, tristete, furie, frica,
dezgust, surpriza. FER adauga si "neutru" ca a saptea categorie.

---

## 6. Frontend in detaliu

### Tehnologii folosite

**React** — librarie JavaScript pentru a construi interfete. In loc sa manipulezi
DOM-ul manual (`document.getElementById(...)`) scrii componente declarative:
```jsx
function Buton({ text }) {
  return <button>{text}</button>
}
```

**Next.js** — framework peste React. Avantaje principale:
- **App Router**: fiecare fisier `page.tsx` din `app/` devine automat o pagina
- **Server Components**: unele componente ruleaza pe server, nu in browser
- **Optimizari**: imagini optimizate automat, font loading etc.
- **Deploy facil**: Vercel (facuta de aceeasi companie) face deploy cu un click

**TypeScript** — JavaScript cu sistem de tipuri. Avantaje:
- erorile de tip sunt prinse inainte de rulare, nu dupa
- IDE-ul stie ce proprietati are un obiect → autocomplete mai bun
- codul devine auto-documentat

Exemplu din proiect:
```typescript
interface RezultatEmotie {
  emotie_dominanta: string | null  // TypeScript stie ca poate fi null
  incredere: number | null
  emotii: Record<string, number> | null
  dreptunghi: Dreptunghi | null
}
```

**Tailwind CSS** — framework CSS utilitar. In loc sa scrii:
```css
.container { display: flex; background: #111; color: white; }
```
Scrii direct in JSX:
```jsx
<div className="flex bg-gray-950 text-white">
```

### Structura folderului frontend/

```
frontend/
├── app/
│   ├── layout.tsx        ← wrapper HTML pentru toate paginile
│   │                        defineste fontul (Inter), titlul, limba (ro)
│   ├── page.tsx          ← pagina principala (/)
│   │                        compune cele doua componente principale
│   └── globals.css       ← Tailwind base + reseturi CSS globale
│
├── components/
│   ├── WebcamCapture.tsx ← gestioneaza tot ce tine de camera:
│   │                        pornire, captura cadre, trimitere la server,
│   │                        desenare dreptunghi + emoji pe canvas
│   └── EmotionOverlay.tsx← panoul cu rezultatele:
│                            poza emotiei, procentaj, 7 bare de progres
│
├── lib/
│   └── api.ts            ← singura functie care face request la backend
│                            abstractizeaza fetch() intr-o functie curata
│
├── public/
│   └── images/           ← fericit.jpg, trist.jpg, infuriat.jpg,
│                            speriat.jpg, surprins.jpg, neutru.jpg,
│                            desgustat.jpg
│                            servite direct la /images/fericit.jpg
│
├── package.json          ← lista dependinte npm
├── tsconfig.json         ← configuratie TypeScript
├── tailwind.config.ts    ← Tailwind: ce fisiere sa scaneze pentru clase
└── next.config.mjs       ← configuratie Next.js (la noi: goala = defaults)
```

### Cum functioneaza WebcamCapture.tsx (componenta principala)

```
1. useEffect → navigator.mediaDevices.getUserMedia({ video: true })
   Browserul cere permisiunea utilizatorului pentru camera.
   Streamul video e legat la elementul <video> prin videoRef.

2. La fiecare 300ms (setInterval):
   a. Copiaza frame-ul curent din <video> pe un <canvas> ascuns (640x480)
   b. Converteste canvas-ul in base64 JPEG (calitate 80%)
   c. Trimite base64 la backend (lib/api.ts → POST /analyze/frame)
   d. Primeste raspuns cu emotie + dreptunghi
   e. Deseneaza dreptunghiul colorat + emoji pe overlay canvas
   f. Apeleaza onRezultat(rezultat) → trimite datele la page.tsx

3. style={{ transform: "scaleX(-1)" }} pe container
   Oglindeste orizontal (mod selfie) — camera e in oglinda, mai natural.

4. La dezmontarea componentei (cleanup):
   stream.getTracks().forEach(track => track.stop())
   Opreste camera corect, elibereaza resursele.
```

### Design responsive (mobil vs desktop)

```
Desktop (md: si mai lat):          Mobil (implicit):
┌──────────────┬──────────┐        ┌──────────────────┐
│              │          │        │    CAMERA        │
│   CAMERA     │  PANEL   │        │    (50% ecran)   │
│              │  EMOTII  │        ├──────────────────┤
│              │          │        │    PANEL EMOTII  │
└──────────────┴──────────┘        │    (50% ecran)   │
  flex-row                         └──────────────────┘
                                     flex-col
```

Implementat cu clase Tailwind responsive:
- `flex-col md:flex-row` — coloana pe mobil, rand pe desktop
- `h-dvh` — 100% din inaltimea vizibila (dvh = dynamic viewport height,
  tine cont de bara browserului pe telefon care dispare la scroll)

---

## 7. Backend in detaliu

### Tehnologii folosite

**Python** — limbaj ales pentru AI/ML deoarece are cel mai bun ecosistem de
librarii: TensorFlow, OpenCV, PyTorch, scikit-learn, pandas etc.

**FastAPI** — framework web modern pentru Python. Avantaje:
- **Pydantic**: validare automata a datelor de intrare/iesire
- **async/await**: poate gestiona mai multe requesturi simultan
- **Documentatie automata**: `/docs` (Swagger UI) si `/redoc`
- **Tipuri Python**: foloseste type hints pentru a genera validarea

**Uvicorn** — serverul ASGI care ruleaza FastAPI. ASGI = Asynchronous Server
Gateway Interface — permite cod asincron (async/await).

**FER** (Face Emotion Recognition) — librarie Python care combina:
- OpenCV pentru detectia fetei
- Un model TensorFlow pre-antrenat pentru clasificarea emotiei

### Structura folderului backend/

```
backend/
├── app/
│   ├── __init__.py           ← fisier gol obligatoriu
│   │                            Python trateaza folderul ca "pachet"
│   │                            fara el, `from app.routers import analyze`
│   │                            nu ar functiona
│   │
│   ├── main.py               ← punctul de intrare (entry point)
│   │                            - creeaza instanta FastAPI
│   │                            - configureaza CORS middleware
│   │                            - inregistreaza router-ul de analize
│   │                            - defineste GET /health (ping server)
│   │
│   ├── routers/
│   │   ├── __init__.py       ← fisier gol obligatoriu
│   │   └── analyze.py        ← defineste POST /analyze/frame
│   │                            - primeste { image: base64 }
│   │                            - apeleaza emotion_service
│   │                            - returneaza { emotie_dominanta, ... }
│   │                            - daca ceva pica → HTTP 500 cu detalii
│   │
│   └── services/
│       ├── __init__.py       ← fisier gol obligatoriu
│       └── emotion_service.py← logica AI (separata de HTTP):
│                                - decodifica base64 → imagine OpenCV
│                                - ruleaza FER pe imagine
│                                - extrage si formateaza rezultatul
│                                - returneaza dict cu emotiile
│
├── Dockerfile                ← reteta containerului Docker
└── requirements.txt          ← lista dependinte (referinta)
```

### De ce separare routers/ si services/?

Este **principiul Single Responsibility** — fiecare fisier are o singura
responsabilitate clara:

| Fisier | Stie despre | Nu stie despre |
|--------|------------|----------------|
| `analyze.py` | HTTP, request, response, status codes | OpenCV, TensorFlow |
| `emotion_service.py` | AI, imagine, numpy | HTTP, FastAPI |

**Avantaj practic:** Daca maine vrei sa schimbi FER cu alt model AI, modifici
doar `emotion_service.py`. `analyze.py` ramane intact. Daca vrei sa adaugi un
nou endpoint (ex: analiza video), adaugi in `analyze.py` fara sa atingi AI-ul.

### Ce este Docker si cum functioneaza

**Problema reala pe care am intampinat-o:**
TensorFlow si OpenCV necesita librarii de sistem (`libGL`, `libGLib2`) care nu
exista implicit pe serverele Linux curate. Fara ele, serverul crapa la pornire.

**Docker** rezolva asta prin containerizare — impachetezi aplicatia impreuna cu
tot ce are nevoie intr-un "container" care ruleaza identic oriunde.

**Dockerfile-ul nostru pas cu pas:**
```dockerfile
# 1. Porneste de la o imagine Linux cu Python 3.11 (minimala)
FROM python:3.11-slim

# 2. Instaleaza librariile de sistem necesare pentru OpenCV
RUN apt-get install -y libgl1 libglib2.0-0 ffmpeg

# 3. Instaleaza pachetele Python (in ordine specifica pentru compatibilitate)
#    tensorflow-cpu (nu gpu — Railway nu are GPU)
#    fer==22.5.1 --no-deps (fara PyTorch ~1GB, economisim spatiu)
#    moviepy<2.0 (versiunea 2.x a stricat importurile)
RUN pip install tensorflow-cpu opencv-contrib-python-headless numpy...
RUN pip install --no-deps fer==22.5.1

# 4. Copiaza codul aplicatiei in container
COPY . .

# 5. Porneste serverul la lansarea containerului
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**De ce `--no-deps` pentru fer?**
`fer` normal instaleaza si `facenet-pytorch` (~1GB) pentru detectia MTCNN.
Noi nu folosim MTCNN (`mtcnn=False`), deci instalarea lui e o pierdere de timp
si spatiu. `--no-deps` = instaleaza pachetul fara dependintele lui.

**De ce `tensorflow-cpu` si nu `tensorflow`?**
`tensorflow` (normal) incearca sa foloseasca GPU daca exista. Pe Railway nu
exista GPU, asa ca versiunea `-cpu` e mai mica si functioneaza corect.

---

## 8. Infrastructura si deploy — cum ajunge codul online

### GitHub — controlul versiunilor

**Git** este un sistem de versionare: tine evidenta tuturor modificarilor din cod,
cu data, autorul, si mesajul modificarii. **GitHub** e platforma online unde e
stocat repository-ul (repo-ul) cu tot istoricul.

```
Lucrul local → git add → git commit → git push → GitHub
```

### Vercel — deploy frontend automat

Vercel este o platforma de hosting pentru aplicatii Next.js. Are integrare
nativa cu GitHub:
1. Conectezi repo-ul GitHub la Vercel
2. La fiecare `git push`, Vercel detecteaza modificarile automat
3. Ruleaza `npm run build` → construieste aplicatia
4. O publica pe internet in ~1-2 minute

**Variabile de mediu pe Vercel:**
`NEXT_PUBLIC_API_URL=https://...railway.app` — adresa backend-ului.
Trebuie setata in panoul Vercel (nu in cod) deoarece nu se urca pe GitHub.

**Important:** Variabilele `NEXT_PUBLIC_*` sunt "baked in" (incorporate) la
build time — compilatorul le inlocuieste direct in cod. Daca schimbi valoarea,
trebuie re-deploy.

### Railway — deploy backend automat (Docker)

Railway este o platforma cloud care gazduite aplicatii Docker. Similar cu Vercel:
1. Conectezi repo-ul GitHub
2. La fiecare push, Railway detecteaza Dockerfile-ul din `backend/`
3. Construieste containerul Docker (`docker build`)
4. Il porneste pe serverele lor

**De ce Railway si nu Vercel pentru backend?**
Vercel e optimizat pentru frontend/serverless. Backend-ul nostru are nevoie de
TensorFlow care necesita Docker si nu e compatibil cu serverless (pornire lenta).

**Health check:**
`GET /health` returneaza `{ "status": "ok" }`. Railway il foloseste periodic
pentru a verifica ca serverul e viu. Daca nu raspunde → reporneste containerul.

### CORS — de ce browserul bloca requesturile

**Cross-Origin Resource Sharing** — un mecanism de securitate al browserului.

Implicit, un browser NU permite JavaScript de pe `domeniu-a.com` sa faca
requesturi la `domeniu-b.com`. Aceasta previne atacuri de tip CSRF.

**Situatia noastra:**
- Frontend: `emotion-detector.vercel.app` (domeniu A)
- Backend: `...railway.app` (domeniu B)
- Browser-ul blocheaza requestul fara permisiune explicita

**Solutia:** Backend-ul trimite header-ul:
```
Access-Control-Allow-Origin: *
```
Asta spune browserului "accept requesturi de la orice domeniu".

In cod (main.py):
```python
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
```

Intr-o aplicatie de productie cu utilizatori reali, ai pune:
```python
allow_origins=["https://emotion-detector.vercel.app"]
```
ca sa blochezi requesturi de pe site-uri necunoscute.

---

## 9. Fluxul complet de date — de la camera la ecran

```
[Camera telefon/PC]
        |
        | stream video (MediaStream API)
        |
[<video> element in browser]
        |
        | la fiecare 300ms: copiaza frame pe <canvas> ascuns
        |
[Canvas 640x480]
        |
        | canvas.toDataURL("image/jpeg", 0.8)
        | → "/9j/4AAQSkZJRgAB..." (base64, ~50-100KB text)
        |
[fetch POST /analyze/frame]  ←── INTERNET (HTTPS) ───►  [Railway Server]
        |                                                         |
        | { "image": "base64..." }                               | base64.b64decode()
        |                                                         | np.frombuffer()
        |                                                         | cv2.imdecode()
        |                                                         |
        |                                                   [OpenCV Haar Cascade]
        |                                                    detecteaza fata → (x,y,w,h)
        |                                                         |
        |                                                   [TensorFlow / FER model]
        |                                                    clasifica emotia → scoruri
        |                                                         |
[Raspuns JSON]  ◄──────────────────────────────────────  returneaza rezultat
        |
        | {
        |   "emotie_dominanta": "happy",
        |   "incredere": 0.87,
        |   "emotii": { "happy": 0.87, "sad": 0.05, ... },
        |   "dreptunghi": { "x": 120, "y": 80, "w": 200, "h": 200 }
        | }
        |
[WebcamCapture.tsx]
    - deseneaza dreptunghi colorat pe overlay canvas
    - deseneaza emoji deasupra fetei
    - apeleaza onRezultat(rezultat)
        |
[EmotionOverlay.tsx]
    - schimba poza (fericit.jpg, trist.jpg etc.)
    - afiseaza procentul de incredere
    - actualizeaza cele 7 bare de progres cu animatie
```

---

## 10. Provocari tehnice intalnite si cum au fost rezolvate

Acestea sunt lucruri bune de mentionat intr-un interviu:

### Problema 1: Dimensiunea imaginii Docker (2.5GB → ~1GB)
**Cauza:** `fer` instala automat `facenet-pytorch` (PyTorch) chiar daca nu era folosit.
**Solutia:** `pip install --no-deps fer==22.5.1` — instalare fara dependinte.
Rezultat: build de ~15 min → ~8 min, imagine mai mica.

### Problema 2: `libgl1-mesa-glx` nu exista pe Debian Trixie
**Cauza:** Numele pachetului s-a schimbat in versiunile noi de Debian.
**Solutia:** Inlocuit cu `libgl1` (noul nume al aceluiasi pachet).

### Problema 3: `moviepy.editor` ImportError
**Cauza:** `moviepy` versiunea 2.x a eliminat modulul `moviepy.editor`.
**Solutia:** Pinuit versiunea la `moviepy<2.0`.

### Problema 4: CORS bloca requesturile desi headerele pareau corecte
**Cauza:** Variabila `ALLOWED_ORIGINS` din `.env` nu se parsa corect din string JSON.
**Solutia:** Hardcodat `allow_origins=["*"]` direct in `main.py`.

### Problema 5: `NEXT_PUBLIC_API_URL` nu se lua in cont
**Cauza:** Variabilele `NEXT_PUBLIC_*` sunt incorporate la build time.
Dupa ce am setat variabila pe Vercel, trebuia re-deploy manual.
**Solutia:** Trigger deploy nou pe Vercel dupa setarea variabilei.

### Problema 6: Camera dau scroll pe mobil (UX)
**Cauza:** Layout-ul era `flex-row` fix, nu responsive.
**Solutia:** `flex-col md:flex-row` cu `h-dvh` (dynamic viewport height).
`dvh` in loc de `vh` tine cont de bara de adresa a browserului pe telefon.

---

## 11. Concepte cheie de retinut pentru CV/interviu

### Ce tehnologii ai folosit si de ce
| Tehnologie | Categorie | De ce |
|-----------|-----------|-------|
| Next.js 14 | Frontend framework | Routing, optimizari, deploy simplu pe Vercel |
| React 18 | UI library | Componente reutilizabile, state management |
| TypeScript | Limbaj | Tipuri statice, mai putine bug-uri |
| Tailwind CSS | Styling | Rapid, consistent, responsive usor |
| Python 3.11 | Backend limbaj | Ecosistem AI/ML cel mai bun |
| FastAPI | Backend framework | Performant, validare automata, async |
| TensorFlow | ML framework | Model pre-antrenat pentru emotii |
| OpenCV | Computer vision | Detectie fete in imagini |
| FER library | AI wrapper | Integreaza OpenCV + TensorFlow usor |
| Docker | Containerizare | Dependinte sistem complexe (libGL etc.) |
| Vercel | Frontend hosting | CI/CD automat, gratis, optimizat Next.js |
| Railway | Backend hosting | Suport Docker, CI/CD automat |
| GitHub | Version control | Cod sursa + trigger pentru deploy automat |

### Ce concepte demonstreaza proiectul
- **REST API design** — endpoint POST cu request/response JSON tipizat
- **Computer Vision** — procesare imagini in timp real
- **Machine Learning** — inferenta cu model pre-antrenat
- **CI/CD** — Continuous Integration/Deployment (push → deploy automat)
- **Containerizare** — Docker pentru medii reproductibile
- **Responsive Design** — UI care functioneaza pe orice ecran
- **Async programming** — captura cadre + cereri HTTP in paralel
- **Cross-Origin Communication** — CORS intre domenii diferite

### Cum sa descrii proiectul in CV
> "Aplicatie web full-stack de detectie emotii in timp real, cu frontend Next.js
> (TypeScript, Tailwind CSS) deployat pe Vercel si backend Python (FastAPI,
> TensorFlow, OpenCV) containerizat cu Docker si deployat pe Railway.
> Implementeaza pipeline end-to-end: captura webcam → transfer base64 via REST API
> → detectie faciala cu Haar Cascade → clasificare emotii cu retea neurala →
> afisare rezultate in timp real cu layout responsive mobil/desktop."

---

## 12. Fisierele de configurare — ce contine fiecare

| Fisier | Rol |
|--------|-----|
| `package.json` | dependinte npm (`next`, `react`, `typescript`) + comenzi (`dev`, `build`) |
| `tsconfig.json` | cum compileaza TypeScript: module system, paths aliases (`@/`) |
| `tailwind.config.ts` | ce fisiere sa scaneze pentru clase Tailwind |
| `next.config.mjs` | configuratie Next.js (la noi: goala = valorile implicite) |
| `next-env.d.ts` | generat automat de Next.js, declara tipuri globale |
| `.gitignore` | ce sa NU urce pe GitHub: `node_modules/`, `.env`, `.next/` |
| `Dockerfile` | reteta containerului Docker pentru backend |
| `requirements.txt` | lista dependinte Python (referinta, Dockerfile le instaleaza) |

---

## 13. Structura completa a proiectului

```
emotion-detector/
│
├── frontend/                      ← aplicatia Next.js
│   ├── app/
│   │   ├── layout.tsx             ← wrapper HTML global (font, titlu, lang="ro")
│   │   ├── page.tsx               ← pagina "/" : compune camera + panel
│   │   └── globals.css            ← stiluri globale + Tailwind directives
│   │
│   ├── components/
│   │   ├── WebcamCapture.tsx      ← camera, captura, trimitere la server
│   │   └── EmotionOverlay.tsx     ← poza emotiei + bare de progres
│   │
│   ├── lib/
│   │   └── api.ts                 ← fetch la backend (POST /analyze/frame)
│   │
│   ├── public/
│   │   └── images/
│   │       ├── fericit.jpg
│   │       ├── trist.jpg
│   │       ├── infuriat.jpg
│   │       ├── speriat.jpg
│   │       ├── surprins.jpg
│   │       ├── neutru.jpg
│   │       └── desgustat.jpg
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   └── next-env.d.ts
│
├── backend/                       ← serverul Python FastAPI
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                ← entry point: FastAPI, CORS, rute
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── analyze.py        ← POST /analyze/frame
│   │   └── services/
│   │       ├── __init__.py
│   │       └── emotion_service.py ← logica AI: base64 → emotie
│   │
│   ├── Dockerfile                 ← containerul Docker pentru Railway
│   └── requirements.txt          ← lista dependinte Python (referinta)
│
├── .gitignore                     ← ce nu se urca pe GitHub
└── EXPLICATIE.md                  ← acest fisier
```
