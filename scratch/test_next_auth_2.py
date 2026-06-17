import requests

session = requests.Session()
login_payload = {
    "username": "admin2",
    "password": "Secreto2026"
}

print("1. Login directo a FastAPI backend para sacar el token")
fastapi_res = session.post("http://localhost:8000/auth/login", data=login_payload, allow_redirects=False)
print("FastAPI Login HTTP status:", fastapi_res.status_code)

if fastapi_res.status_code == 200:
    token = fastapi_res.json()["access_token"]
    print("Token obtenido!")
    
    # Set the cookie for Next.js
    session.cookies.set("mdm_session", token, domain="localhost")
    
    print("\n2. Peticion a /api/cc/health con la cookie")
    health_res = session.get("http://localhost:3000/api/cc/health", allow_redirects=False)
    print("Health HTTP status:", health_res.status_code)
    print("Health body:", health_res.text[:500])
    
    print("\n3. Peticion a /api/cc/etl/active con la cookie")
    active_res = session.get("http://localhost:3000/api/cc/etl/active", allow_redirects=False)
    print("Active HTTP status:", active_res.status_code)
    print("Active body:", active_res.text[:500])
else:
    print("Login failed:", fastapi_res.text)
