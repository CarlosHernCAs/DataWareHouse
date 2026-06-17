import requests

session = requests.Session()
login_payload = {
    "email": "admin2",
    "password": "Secreto2026"
}

print("1. Login a Next.js (o FastAPI)")
res = session.post("http://localhost:3000/api/auth/login", json=login_payload, allow_redirects=False)
print("Login HTTP status:", res.status_code)
print("Login Headers:", res.headers)
print("Cookies:", session.cookies.get_dict())

print("\n2. Peticion a /api/cc/health")
health_res = session.get("http://localhost:3000/api/cc/health", allow_redirects=False)
print("Health HTTP status:", health_res.status_code)
print("Health body:", health_res.text[:500])

print("\n3. Login directo a FastAPI backend")
fastapi_res = session.post("http://localhost:8000/auth/login", json=login_payload, allow_redirects=False)
print("FastAPI Login HTTP status:", fastapi_res.status_code)
print("FastAPI body:", fastapi_res.text[:500])
