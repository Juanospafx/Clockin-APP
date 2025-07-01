#!/bin/bash
set -e

echo "Running init-user-db.sh"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER postgres WITH PASSWORD 'mypassword';

    -- Create admin user
    DO
    $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'admin') THEN
            CREATE USER admin WITH PASSWORD 'admin';
        END IF;
    END
    $$;

    -- Grant privileges to admin user
    GRANT ALL PRIVILEGES ON DATABASE clockin_app TO admin;
EOSQL

echo "Password for postgres user set successfully."
echo "Admin user created and privileges granted."
