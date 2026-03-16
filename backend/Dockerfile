FROM python:3.11-slim

WORKDIR /app

# Системные зависимости для psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем зависимости отдельно (кэш Docker)
COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

# Копируем код
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
