# backend/Dockerfile

FROM python:3.12-slim

# 1) Instalamos pg_isready (viene en postgresql-client) y dependencias de psycopg2
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      postgresql-client \
      libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2) Copiamos requirements e instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3) Copiamos el código y marcamos entrypoint
COPY entrypoint.sh .
COPY app ./app
RUN chmod +x entrypoint.sh

EXPOSE 8000

# 4) Usamos el entrypoint para esperar a la base de datos y luego arrancar uvicorn
ENTRYPOINT ["./entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]