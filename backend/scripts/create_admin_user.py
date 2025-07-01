
import requests
import os
import time
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

admin_password = "admin"
hashed_admin_password = pwd_context.hash(admin_password)

# Retry mechanism for creating the user
max_retries = 10
retry_delay = 5 # seconds

for i in range(max_retries):
    try:
        create_user_response = requests.post(
            "http://localhost:8000/api/users/initial-admin-setup",
            json={
                "username": "admin",
                "email": "admin@example.com",
                "password": admin_password, # Send plain password, it will be hashed by the API
                "role": "admin",
            },
        )
        create_user_response.raise_for_status()
        print("Usuario 'admin' creado exitosamente.")
        break # Exit loop if successful
    except requests.exceptions.ConnectionError as e:
        print(f"Connection refused. Retrying in {retry_delay} seconds... ({i+1}/{max_retries})")
        time.sleep(retry_delay)
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
        break # Exit loop on other HTTP errors
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        break
else:
    print("Failed to create admin user after multiple retries.")
