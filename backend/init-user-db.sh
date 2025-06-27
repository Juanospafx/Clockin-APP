#!/bin/bash
set -e

echo "Running init-user-db.sh"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER postgres WITH PASSWORD 'mypassword';
EOSQL

echo "Password for postgres user set successfully."