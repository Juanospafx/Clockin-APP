FROM python:3.12-slim as python_build

# 1) Dependencias de sistema para Postgres/psycopg2
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      postgresql-client \
      libpq-dev \
      python3-bcrypt \
      python3 \
      python3-pip \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app


# 2) Instalamos tus paquetes Python cacheables
COPY requirements.txt .
RUN pip cache purge
RUN pip --timeout 1000 install --no-cache-dir -r requirements.txt

# 3) Dependencias de sistema para OpenCV/Torch Hub
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libgl1-mesa-glx \
      libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# 4) Instalamos sólo lo que faltaba: pandas, requests y seaborn
RUN pip install --no-cache-dir pandas requests seaborn

# 5) Copiamos tu código y arrancamos
COPY entrypoint.sh .
COPY app ./app
RUN chmod +x entrypoint.sh

# --- Nginx Stage ---
FROM nginx:alpine

# Copiar el build de Python
COPY --from=python_build /app /app

# Copiar certificados
COPY ../certs /etc/nginx/certs

# Configuración de Nginx para HTTPS
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 443

# Iniciar Uvicorn y Nginx
CMD nginx -g 'daemon off;' & python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
