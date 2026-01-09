# backend/app/test_client.py
import requests
import json

# 1. THE LOGS YOU GAVE ME (Converted to JSON format manually)
# Eventually, your Chrome Extension will do this formatting automatically.
softonic_payload = {
    "url": "https://toppr-learning-app-for-class-5-12.en.softonic.com/android",
    "cookies": [
        {"name": "tracking_id", "domain": ".adex-rtb.com", "secure": False},
        {"name": "gid", "domain": ".softonic.com", "secure": False}
    ],
    "scripts": [
        "https://tracker.adex-rtb.com/sync?id=4",
        "https://revamp.softonic.com/boot.ad4d7e.js",
        "https://securepubads.g.doubleclick.net/tag/js/gpt.js"
    ],
    "content_snippet": "REVAMP [INFO]: Rev·Amp loaded. TrackingEvents set Object. Adding EventTrackerProvider ga4. Attestation check for Topics on ap.lijit.com failed. Powered by AMP HTML."
}

# 2. SEND TO YOUR LOCAL SERVER
print("🚀 Sending Softonic data to SafeLens AI...")

try:
    response = requests.post("http://127.0.0.1:8000/analyze", json=softonic_payload)
    
    # 3. CHECK RESULT
    if response.status_code == 200:
        report = response.json()
        print("\n✅ SUCCESS! AI Analysis Received:")
        print(json.dumps(report, indent=2))
    else:
        print(f"\n❌ Error {response.status_code}: {response.text}")

except requests.exceptions.ConnectionError:
    print("\n❌ CRITICAL: Your server is not running!")
    print("Go to the 'backend' folder and run: uvicorn app.main:app --reload")