import asyncio
from playwright.async_api import async_playwright
import httpx
import pandas as pd
import time
import json

# --- CONFIGURATION ---
API_URL = "http://127.0.0.1:8000/analyze"
OUTPUT_FILE = "safelens_benchmark_results.csv"

# The "Exam Paper" - List of sites to test
# We mix High Risk (Gaming, News) with Low Risk (Gov, Banks)
TARGET_URLS = [
    "https://pastebin.com",        # Risk: Medium (User content)
    "https://skribbl.io",          # Risk: High (Gaming Ads)
    "https://softonic.com",        # Risk: High (Trackers)
    "https://www.speedtest.net",   # Risk: High (Ads)
    "https://stackoverflow.com",   # Risk: Low
    "https://www.wikipedia.org",   # Risk: Safe
    "https://www.bbc.com",         # Risk: Medium (News Trackers)
    "https://www.cnn.com",         # Risk: Medium
    "https://www.reddit.com",      # Risk: Medium
    "https://github.com",          # Risk: Safe
    # Add more to reach 20 for the final report
]

async def analyze_url(browser, url):
    page = await browser.new_page()
    start_time = time.time()
    
    print(f"Testing: {url}...")
    
    try:
        # 1. Visit Page (Timeout after 10s to be fast)
        await page.goto(url, wait_until="domcontentloaded", timeout=150000)
        
        # 2. Scrape Data (Mimicking your Chrome Extension)
        # Extract Cookies
        cookies_raw = await page.context.cookies()
        cookies_clean = [
            {"name": c["name"], "domain": c["domain"], "secure": c["secure"]}
            for c in cookies_raw[:10] # Limit to 10
        ]
        
        # Extract External Scripts
        scripts = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('script'))
                .filter(s => s.src)
                .map(s => s.src)
                .slice(0, 5);
        }""")
        
        # Extract Text Snippet
        text_snippet = await page.evaluate("document.body.innerText.substring(0, 500)")
        
        # 3. Construct Payload for SafeLens AI
        payload = {
            "url": url,
            "cookies": cookies_clean,
            "scripts": scripts,
            "content_snippet": text_snippet.replace("\n", " ")
        }
        
        # 4. Send to AI Engine
        async with httpx.AsyncClient() as client:
            ai_start = time.time()
            response = await client.post(API_URL, json=payload, timeout=30.0)
            ai_latency = time.time() - ai_start
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "URL": url,
                    "Status": "Success",
                    "Risk Score": result["risk_score"],
                    "Risk Level": result["risk_level"],
                    "Trackers Found": len(scripts) + len(cookies_clean),
                    "AI Latency (s)": round(ai_latency, 2),
                    "Summary": result["summary"]
                }
            else:
                return {"URL": url, "Status": "API Error", "Error": response.text}

    except Exception as e:
        return {"URL": url, "Status": "Failed", "Error": str(e)[:50]}
    finally:
        await page.close()

async def main():
    print(f"🚀 Starting Benchmarking on {len(TARGET_URLS)} sites...")
    
    results = []
    
    async with async_playwright() as p:
        # Launch Browser (Headless = Invisible)
        browser = await p.chromium.launch(headless=True)
        
        for url in TARGET_URLS:
            data = await analyze_url(browser, url)
            results.append(data)
            # Print brief status
            if "Risk Score" in data:
                print(f"   -> Score: {data['Risk Score']} ({data['Risk Level']}) in {data['AI Latency (s)']}s")
            else:
                print(f"   -> Failed: {data.get('Error')}")
            await asyncio.sleep(2)  # Wait 2 seconds between sites to free RAM
        
        await browser.close()
        
    # 5. Save Report
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n✅ Benchmark Complete! Saved to {OUTPUT_FILE}")
    print("\n--- SUMMARY METRICS (For your Report) ---")
    if "AI Latency (s)" in df.columns:
        print(f"Average AI Latency: {df['AI Latency (s)'].mean():.2f} seconds")
        print(f"High Risk Sites Detected: {len(df[df['Risk Score'] > 60])}")

if __name__ == "__main__":
    asyncio.run(main())