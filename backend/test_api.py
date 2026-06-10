"""
test_api.py — Run this script to verify all backend endpoints are working.
Usage: python test_api.py
Make sure the backend server is running first: python run.py
"""
import requests
import json

BASE = "http://localhost:5000/api"
PASS = "\033[92m PASS\033[0m"
FAIL = "\033[91m FAIL\033[0m"
WARN = "\033[93m WARN\033[0m"

results = []

def check(label, method, url, expected_status, **kwargs):
    try:
        res = getattr(requests, method)(url, timeout=5, **kwargs)
        ok  = res.status_code == expected_status
        tag = PASS if ok else FAIL
        detail = ""
        if not ok:
            try:
                detail = f"  → got {res.status_code}: {res.json()}"
            except Exception:
                detail = f"  → got {res.status_code}"
        print(f"{tag}  {label}{detail}")
        results.append((label, ok))
        return res if ok else None
    except Exception as e:
        print(f"{FAIL}  {label}  → {e}")
        results.append((label, False))
        return None


print("\n" + "="*60)
print(" IJTD API — Backend Connectivity Test")
print("="*60)

# ── Health ─────────────────────────────────────────────────────────────────
print("\n[ System ]")
check("Health check",       "get",  f"{BASE}/health",   200)

# ── Public article endpoints ───────────────────────────────────────────────
print("\n[ Articles ]")
check("Get latest articles",  "get", f"{BASE}/articles/latest?limit=3", 200)
check("Get current issue",    "get", f"{BASE}/articles/current-issue",  200)
check("Get in-progress",      "get", f"{BASE}/articles/in-progress",    200)
check("Search articles",      "get", f"{BASE}/articles/search?q=climate", 200)
check("Get article by ID",    "get", f"{BASE}/articles/1",              200)

# ── Volumes ────────────────────────────────────────────────────────────────
print("\n[ Volumes ]")
check("Get all volumes",           "get", f"{BASE}/volumes",               200)
check("Get issue 1 of volume 1",   "get", f"{BASE}/volumes/1/issues/1",    200)

# ── Editorial board ────────────────────────────────────────────────────────
print("\n[ Editorial Board ]")
check("Get editorial board",  "get", f"{BASE}/editorial-board", 200)

# ── Auth ───────────────────────────────────────────────────────────────────
print("\n[ Auth ]")
login_res = check("Admin login",  "post", f"{BASE}/auth/login", 200,
    json={"email": "admin@ijtd.com", "password": "Admin@IJTD2026!"})

token = None
if login_res:
    data  = login_res.json()
    token = data.get("access_token")
    print(f"        Token received: {'YES' if token else 'NO'}")
    check("Get /me (authenticated)", "get", f"{BASE}/auth/me", 200,
        headers={"Authorization": f"Bearer {token}"})
    check("Wrong password",          "post", f"{BASE}/auth/login", 401,
        json={"email": "admin@ijtd.com", "password": "wrongpassword"})

# ── Admin (requires token) ─────────────────────────────────────────────────
print("\n[ Admin — requires auth ]")
if token:
    h = {"Authorization": f"Bearer {token}"}
    check("Dashboard stats",    "get", f"{BASE}/admin/stats",        200, headers=h)
    check("List manuscripts",   "get", f"{BASE}/admin/manuscripts",  200, headers=h)
    check("List users",         "get", f"{BASE}/admin/users",        200, headers=h)
    check("List issues",        "get", f"{BASE}/admin/issues",       200, headers=h)
    check("List applications",  "get", f"{BASE}/admin/applications", 200, headers=h)
    check("List messages",      "get", f"{BASE}/admin/messages",     200, headers=h)
    check("List reviewers",     "get", f"{BASE}/admin/reviewers",    200, headers=h)
    check("No token → 401",     "get", f"{BASE}/admin/stats",        401)
else:
    print(f"{WARN}  Skipping admin tests (login failed)")

# ── Manuscript submission ──────────────────────────────────────────────────
print("\n[ Manuscripts ]")
check("Track by email",  "get",  f"{BASE}/manuscripts/track?email=test@test.com", 404)
check("Submit (missing fields)", "post", f"{BASE}/manuscripts/submit",             400,
    data={"title": "Test"})   # missing required fields → 400

# ── Contact ────────────────────────────────────────────────────────────────
print("\n[ Contact ]")
check("Missing fields → 400", "post", f"{BASE}/contact", 400,
    json={"name": "Test"})

# ── Join ───────────────────────────────────────────────────────────────────
print("\n[ Join ]")
check("Reviewer - missing fields → 400", "post", f"{BASE}/join/reviewer", 400,
    json={"fullName": "Test"})

# ── Certificate ────────────────────────────────────────────────────────────
print("\n[ Certificate ]")
check("No email → 400",         "get", f"{BASE}/certificate",             400)
check("Unknown email → 404",    "get", f"{BASE}/certificate?email=x@x.com", 404)

# ── Summary ────────────────────────────────────────────────────────────────
print("\n" + "="*60)
passed = sum(1 for _, ok in results if ok)
total  = len(results)
print(f" Results: {passed}/{total} tests passed")
if passed == total:
    print(" All endpoints responding correctly!")
else:
    failed = [label for label, ok in results if not ok]
    print(f" Failed: {', '.join(failed)}")
print("="*60 + "\n")