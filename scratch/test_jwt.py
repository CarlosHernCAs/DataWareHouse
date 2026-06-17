import requests
import base64
import json

session = requests.Session()
login_payload = {
    "username": "admin2",
    "password": "Secreto2026"
}

fastapi_res = session.post("http://localhost:8000/auth/login", data=login_payload, allow_redirects=False)
if fastapi_res.status_code == 200:
    token = fastapi_res.json()["access_token"]
    payload_b64 = token.split('.')[1]
    payload_b64 += '=' * (-len(payload_b64) % 4)
    payload_json = base64.b64decode(payload_b64).decode('utf-8')
    print("Token Payload:", payload_json)
else:
    print("Login failed:", fastapi_res.text)
