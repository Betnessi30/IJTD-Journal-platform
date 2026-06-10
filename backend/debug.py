"""
debug_failures.py — Get exact error details for the 4 failing endpoints.
Run: python debug_failures.py (with backend running)
"""
import requests

BASE  = "http://localhost:5000/api"

# Login first
r = requests.post(f"{BASE}/auth/login",
    json={"email": "admin@ijtd.com", "password": "Admin@IJTD2026!"})
token = r.json().get("access_token")
h     = {"Authorization": f"Bearer {token}"}

print("=" * 60)
for label, method, url, kwargs in [
    ("Dashboard stats",          "get",  f"{BASE}/admin/stats",                         {"headers": h}),
    ("List manuscripts",         "get",  f"{BASE}/admin/manuscripts",                   {"headers": h}),
    ("Track by email (404)",     "get",  f"{BASE}/manuscripts/track?email=test@x.com",  {}),
    ("Certificate unknown email","get",  f"{BASE}/certificate?email=x@x.com",           {}),
]:
    res = getattr(requests, method)(url, timeout=5, **kwargs)
    print(f"\n[{res.status_code}] {label}")
    try:
        print("  Body:", res.json())
    except Exception:
        print("  Body:", res.text[:300])
print("=" * 60)