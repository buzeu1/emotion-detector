FROM python:3.11-slim

WORKDIR /app

# Dependinte sistem necesare pentru OpenCV si ffmpeg
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalam dependintele lui fer MANUAL, fara facenet-pytorch (PyTorch = ~1GB)
# fer functioneaza fara PyTorch daca folosim mtcnn=False
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    "pydantic>=2.0" \
    "pydantic-settings>=2.0" \
    tensorflow-cpu \
    opencv-contrib-python-headless \
    "numpy<2.0" \
    pandas \
    requests \
    tqdm \
    matplotlib \
    Pillow \
    moviepy \
    ffmpeg-python

# Instalam fer fara sa traga automat dependintele (evitam torch/facenet-pytorch)
RUN pip install --no-cache-dir --no-deps fer

# Copiem codul aplicatiei
COPY . .

EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
