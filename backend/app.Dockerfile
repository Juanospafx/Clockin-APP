FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Postgres/psycopg2 and OpenCV/Torch Hub
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      postgresql-client \
      libpq-dev \
      libgl1-mesa-glx \
      libglib2.0-0 \
      curl \
 && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install bcrypt separately (if not in requirements.txt)
RUN pip install bcrypt

# Copy application code
COPY app ./app
COPY scripts ./scripts
COPY entrypoint.sh .

RUN chmod +x entrypoint.sh

# Expose the port Uvicorn will run on
EXPOSE 8000

# Command to run the application
CMD ["/usr/local/bin/python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

