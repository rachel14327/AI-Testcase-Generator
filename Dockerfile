FROM node:18 AS frontend-build

WORKDIR /frontend
COPY test-case-generator/frontend/package*.json ./
RUN npm install
COPY test-case-generator/frontend/ ./
RUN npm run build

FROM python:3.9

RUN useradd -m -u 1000 user

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY --chown=user . /app

COPY --from=frontend-build --chown=user /frontend/dist /app/test-case-generator/backend/static

RUN mkdir -p /app/test-case-generator/backend/vector_store

WORKDIR /app/test-case-generator/backend

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
