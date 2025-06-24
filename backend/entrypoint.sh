#!/usr/bin/env sh
# backend/entrypoint.sh

# Espera activo hasta que Postgres responda
echo "⏳ Esperando a Postgres..."
until pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" >/dev/null 2>&1; do
  sleep 1
done

# Ejecuta migraciones / crea tablas si lo necesitas:
python3 - <<'EOF'
from app.database import Base, engine
from app import models
Base.metadata.create_all(bind=engine)
print("✅ Tablas creadas (si no existían)")
EOF

# Finalmente arranca Uvicorn
echo "🚀 Iniciando FastAPI..."
exec "$@"
