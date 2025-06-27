#!/bin/sh

# Usar valores por defecto sin validación
# Las variables de entorno se pasan desde docker-compose.yml

echo "⏳ Esperando a Postgres ($POSTGRES_HOST:$POSTGRES_PORT)..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" >/dev/null 2>&1; do
  sleep 1
done

# Solo para diagnóstico - mostrar variables
echo "--- Variables de entorno ---"
echo "POSTGRES_USER=$POSTGRES_USER"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "POSTGRES_HOST=$POSTGRES_HOST"
echo "POSTGRES_PORT=$POSTGRES_PORT"
echo "POSTGRES_DB=$POSTGRES_DB"
echo "----------------------------"

# Crear tablas
echo "🚀 Iniciando FastAPI..."
exec "$@"