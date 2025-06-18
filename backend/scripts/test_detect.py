# backend/scripts/test_detect.py

import requests
import time
import os

# 1) Tus credenciales reales
USERNAME = "pedro"
PASSWORD = "pedro"

# 2) Los IDs que correspondan
USER_ID    = "4a71ff1b-18c9-4df7-9019-37a3720ed271"
PROJECT_ID = "425e4068-b71a-4807-aea2-878f8b4f952d"

# 3) URL base de tu API
BASE_URL = "http://localhost:8000"

# 4) Ruta de la foto a probar
PHOTO_PATH = r"C:\Users\pablo\Downloads\WhatsApp Image 2025-06-18 at 8.13.34 AM.jpeg"

def main():
    #
    # Paso A) Login contra tu endpoint POST /login
    #
    login_url = f"{BASE_URL}/login"
    login_resp = requests.post(
        login_url,
        json={"username": USERNAME, "password": PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    login_resp.raise_for_status()

    body = login_resp.json()
    token = body.get("access_token")
    if not token:
        print("❌ No vino access_token en la respuesta:", body)
        return
    print("✅ Token:", token[:10] + "…")

    headers = {"Authorization": f"Bearer {token}"}

    #
    # Paso B) Enviar la imagen al endpoint /detection/clockins/{user_id}/detect
    #
    detect_url = f"{BASE_URL}/detection/clockins/{USER_ID}/detect"
    data = {
        "project_id":    PROJECT_ID,
        "latitude":      "19.XX",
        "longitude":     "-70.XX",
        "state":         "Santo Domingo",
        "city":          "Santo Domingo",
        "street":        "Avenida Principal",
        "street_number": "123",
        "postal_code":   "10101",
    }

    # — Comprobación de fichero —
    if not os.path.exists(PHOTO_PATH):
        print("❌ No existe el fichero:", PHOTO_PATH)
        return
    size = os.path.getsize(PHOTO_PATH)
    print(f"📤 Enviando archivo: {PHOTO_PATH}")
    print(f"📏 Tamaño: {size} bytes")

    with open(PHOTO_PATH, "rb") as f:
        files = {"file": f}
        resp = requests.post(detect_url, headers=headers, data=data, files=files)

    print("→ Detect status:", resp.status_code, resp.text)
    resp.raise_for_status()

    task_id = resp.json()["task_id"]
    print("→ Task ID:", task_id)

    #
    # Paso C) Polling hasta que la tarea termine
    #
    status_url = f"{BASE_URL}/detection/task-status/{task_id}"
    while True:
        st = requests.get(status_url, headers=headers).json()
        print("⏱ Polling:", st)
        if st["status"] in ("completed", "failed"):
            break
        time.sleep(2)

    if st["status"] == "completed":
        print("✅ Detección OK:", st["clockin"])
    else:
        print("🚫 Detección fallida:", st.get("error"))

if __name__ == "__main__":
    main()
