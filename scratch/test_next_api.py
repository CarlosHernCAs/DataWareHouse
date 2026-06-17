import requests
import json

session = requests.Session()
login_payload = {
    "username": "admin2",
    "password": "Secreto2026"
}

fastapi_res = session.post("http://localhost:8000/auth/login", data=login_payload, allow_redirects=False)
if fastapi_res.status_code == 200:
    token = fastapi_res.json()["access_token"]
    
    # Do a direct GET to /api/cc/health sending the cookie manually via headers
    headers = {
        "Cookie": f"mdm_session={token}"
    }
    
    health_res = requests.get("http://localhost:3000/api/cc/health", headers=headers, allow_redirects=False)
    print("Health HTTP status:", health_res.status_code)
    print("Health body:", health_res.text[:500])
else:
    print("Login failed")
