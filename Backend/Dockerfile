# ===== Stage 1: Builder =====
FROM python:3.11-slim AS builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install build tools (for dependencies with C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency list and install packages into local user directory
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt



copy ./serviceAccountKey.json ./serviceAccountKey.json

# Copy source code
COPY . .

# ===== Stage 2: Runtime =====
FROM python:3.11-slim AS runtime

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser

# Set working directory
WORKDIR /app

# Copy only the installed packages and app code from builder stage
COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /app /app

# Change to non-root user
USER appuser

# Expose port (for FastAPI)
EXPOSE 8000

# Start with gunicorn and uvicorn worker
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# For production, use: uvicorn app_factory:create_app --factory --host 0.0.0.0 --port 80
# Or with Gunicorn: gunicorn -k uvicorn.workers.UvicornWorker app_factory:create_app --factory --bind 0.0.0.0:80
