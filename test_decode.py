import sys
from jose import jwt

token = sys.argv[1]
secret = "3g9_vK8H2mR1zP5xW7yS4qB0tN6mL4jK9vU2rI1oX8w"
print("TOKEN:", token)
try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    print("PAYLOAD:", payload)
except Exception as e:
    print("ERROR:", e)
