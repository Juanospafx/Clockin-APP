
import requests
import os

# Obtener el token de autenticación
auth_response = requests.post(
    "http://localhost:8000/api/auth/token",
    data={"username": "admin", "password": "admin"},
)
auth_response.raise_for_status()  # Lanza una excepción si la solicitud falla
access_token = auth_response.json()["access_token"]

# Crear el usuario
create_user_response = requests.post(
    "http://localhost:8000/api/admin/users/",
    headers={"Authorization": f"Bearer {access_token}"},
    json={
        "username": "admin",
        "email": "admin@example.com",
        "password": "admin",
        "role": "admin",
    },
)
create_user_response.raise_for_status()

print("Usuario 'admin' creado exitosamente.")
