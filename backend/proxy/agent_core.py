# SafeLens/backend/proxy/agent_core.py
from mitmproxy import http
import random

# --- AGENTIC CONFIGURATION ---
# Target specific tracking parameters to "Poison"
SENSITIVE_PARAMS = [
    "geolocation", "lat", "long", "zip", "user_id", "dob", 
    "ai", "adk", "client", "slotname", "ggid"
]

def request(flow: http.HTTPFlow):
    # 1. Check Query Parameters
    for key in list(flow.request.query.keys()): # Use list() to avoid runtime error during modification
        # Check if the param name matches our target list
        if any(param == key.lower() or param in key.lower() for param in SENSITIVE_PARAMS):
            
            original_val = flow.request.query[key]
            # Generate Fake Data
            fake_val = f"SAFELENS_POISON_{random.randint(1000,9999)}"
            
            # Apply the Poison
            flow.request.query[key] = fake_val
            
            # LOG IT LOUDLY so you can see it in the terminal
            print(f"\n🔥🔥🔥 SAFELENS AGENT INTERVENTION 🔥🔥🔥")
            print(f"Target: {flow.request.host}")
            print(f"Action: Poisoned Parameter '{key}'")
            print(f"Old Value: {original_val[:20]}...")
            print(f"New Value: {fake_val}")
            print("------------------------------------------------\n")

    # 2. Check JSON Body Data (POST payloads)
    if flow.request.method == "POST" and flow.request.headers.get("Content-Type") == "application/json":
        try:
            data = flow.request.json() # Parse JSON
            modified = False
            
            # Recursive function to find keys in nested JSON
            def poison_json(obj):
                nonlocal modified
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if any(param in k.lower() for param in SENSITIVE_PARAMS):
                            obj[k] = "SAFE_LENS_FUZZED_DATA"
                            modified = True
                        elif isinstance(v, (dict, list)):
                            poison_json(v)
                elif isinstance(obj, list):
                    for item in obj:
                        poison_json(item)

            poison_json(data)
            
            if modified:
                flow.request.json = data # Pack it back
                print(f"🛡️ SafeLens Agent: Poisoned JSON Body for {flow.request.host}")
                
        except Exception:
            pass # Failed to parse JSON, let it go

def response(flow: http.HTTPFlow):
    """
    AGENTIC ACTION 2: HEADER CLEANING
    Strips tracking headers from the server response before it reaches the browser.
    """
    headers_to_strip = ["ETag", "Server", "X-Powered-By"]
    for h in headers_to_strip:
        if h in flow.response.headers:
            del flow.response.headers[h]