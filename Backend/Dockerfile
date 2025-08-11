# ===== Stage 1: Builder =====
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build tools for C extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list and install Python packages
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Copy service account key
COPY serviceAccountKey.json ./serviceAccountKey.json

# Copy application code
COPY . .

# ===== Stage 2: Runtime =====
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Install Nginx
RUN apt-get update && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

WORKDIR /app

# Copy installed packages and source code
COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /app /app

# Copy Nginx config
COPY nginx/nginx.conf /backend/nginx/nginx.conf

USER appuser

# Uvicorn runs internally on 8000, Nginx listens on $PORT
EXPOSE 8000
EXPOSE 10000

# Start both Nginx and Uvicorn
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port 8000 & nginx -g 'daemon off;'"