import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_workflow():
    print("--- Starting IJTD Workflow Test ---")

    # 1. Test Contact Form (The new email feature)
    print("\n[1] Testing Contact Form...")
    contact_data = {
        "name": "Test Author",
        "email": "author@example.com",
        "subject": "Submission Inquiry",
        "message": "Hello, I want to submit a paper."
    }
    res = requests.post(f"{BASE_URL}/contact", json=contact_data)
    if res.status_code == 201:
        print("Success: Contact message sent (Auto-reply & Admin forward triggered).")
    else:
        print(f"Failed: {res.json()}")

    # 2. Test User Registration/Auth (Simulated)
    # You would typically POST to /api/auth/register here
    print("\n[2] Skipping Auth test (Assuming users are created via DB setup).")

    # 3. Test Manuscript Submission 
    # Note: Requires a real file for multipart/form-data
    print("\n[3] Testing Manuscript Submission Endpoint...")
    with open("test_manuscript.docx", "wb") as f:
        f.write(b"dummy file content")
    
    files = {"file": open("test_manuscript.docx", "rb")}
    data = {"title": "Test Title", "author_id": 1}
    
    # Example for your manuscript endpoint
    # res = requests.post(f"{BASE_URL}/manuscripts/submit", files=files, data=data)
    print("Manual intervention needed for file upload multipart testing.")

    # 4. Test Volume/Article Retrieval
    print("\n[4] Testing Public Article Fetching...")
    res = requests.get(f"{BASE_URL}/articles")
    if res.status_code == 200:
        print(f"Success: Retrieved {len(res.json())} articles.")
    else:
        print("Failed to fetch articles.")

    print("\n--- Test Suite Complete ---")

if __name__ == "__main__":
    test_workflow()