import requests

LOGIN_URL = "http://localhost:8000/login"
CREATE_USER_URL = "http://localhost:8000/admin/users/"

def login_and_create_user():
    # Login as admin
    login_payload = {"username": "admin", "password": "admin"}
    try:
        login_response = requests.post(LOGIN_URL, json=login_payload)
        login_response.raise_for_status()
        access_token = login_response.json()["access_token"]
        print(f"Login successful. Access Token: {access_token}")
    except requests.exceptions.RequestException as e:
        print(f"Login failed: {e}")
        if e.response:
            print(f"Response: {e.response.text}")
        return

    # Create a test user
    headers = {"Authorization": f"Bearer {access_token}"}
    create_user_payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpassword",
        "role": "field",
    }
    try:
        create_user_response = requests.post(CREATE_USER_URL, headers=headers, json=create_user_payload)
        create_user_response.raise_for_status()
        print("Test user 'testuser' created successfully.")
    except requests.exceptions.RequestException as e:
        print(f"Creating test user failed: {e}")
        if e.response:
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    login_and_create_user()
