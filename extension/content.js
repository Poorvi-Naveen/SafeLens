// extension/content.js
console.log("🛡️ SafeLens: Page scanning started");

// 1. Get all script tags
const scripts = Array.from(document.querySelectorAll("script"));
const externalScripts = scripts.filter(s => s.src).map(s => s.src);

// 2. Get Cookies 
const getCookies = () => {
    return document.cookie.split(';').map(c => {
        const [name, ...v] = c.trim().split('=');
        return { name: name, domain: window.location.hostname, secure: false }; 
    });
};

// 3. Prepare Data for your Python Brain
const pageData = {
    url: window.location.href,
    cookies: getCookies().slice(0, 5).map(c => ({ name: c.name, domain: c.domain })),
    scripts: externalScripts.slice(0, 5).map(url => {
      try { return new URL(url).hostname; } catch(e) { return "unknown"; }}),
    content_snippet: (document.querySelector('meta[name="description"]')?.content || document.title || "").substring(0, 200)
};

console.log("📤 Sending to AI:", pageData);

// 4. SEND TO BACKEND
fetch('http://127.0.0.1:8000/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pageData)
})
.then(response => response.json())
.then(data => {
    console.log("✅ AI Analysis Received:", data);
    
    // 1. INJECT THE NEW UI (Icon + Popup)
    injectMiniIcon(data);
    injectContextualAlert(data);
    
    // 2. VISUALS (Red Borders on Ads)
    highlightRisks();

    // 3. SEND TO SIDE PANEL
    chrome.runtime.sendMessage({
        action: "SAFE_LENS_UPDATE",
        payload: data
    });
})
.catch(error => {
    console.error("❌ Error connecting to SafeLens AI:", error);
});

// --- NEW UI FUNCTIONS ---

function injectMiniIcon(data) {
    if (document.getElementById("safelens-mini-icon")) return;

    const icon = document.createElement("div");
    icon.id = "safelens-mini-icon";
    icon.innerHTML = `
        <div class="sl-shield-mini">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5L2 3V5.5C2 7.5 3.6 9.36 6 10C8.4 9.36 10 7.5 10 5.5V3L6 1.5Z" fill="white"/>
            </svg>
        </div>
        <span class="sl-score-mini">${data.risk_score}</span>
    `;

    icon.onclick = () => {
        chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" });
    };

    document.body.appendChild(icon);
}

function injectContextualAlert(data) {
    // Only show alert if Risk is NOT Safe OR if we found trackers
    if (!data || !data.summary) {
        console.warn("SafeLens: Invalid data received for alert.");
        return;
    }
    if (data.risk_level === "Safe" && !data.summary.includes("Tracker")) return;
    
    if (document.getElementById("safelens-alert-card")) return;

    const shortSummary = data.summary.length > 80 
        ? data.summary.substring(0, 80) + '...' 
        : data.summary;
        
    const alertCard = document.createElement("aside");
    alertCard.id = "safelens-alert-card";
    
    alertCard.innerHTML = `
        <div class="sl-alert-header">
            <div class="sl-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F6FEB" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>
            <div class="sl-alert-content">
                <div class="sl-alert-title">
                    SafeLens Alert <span class="sl-alert-badge">Active</span>
                </div>
            </div>
        </div>
        <p class="sl-alert-message">
            ${data.summary.substring(0, 80)}${data.summary.length > 80 ? '...' : ''}
        </p>
        <div class="sl-alert-actions">
            <button id="sl-view-details-btn" class="sl-alert-btn">
                View Details
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                    <path d="M4.5 2L8.5 6L4.5 10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <span id="sl-dismiss-btn" class="sl-alert-dismiss">Dismiss</span>
        </div>
        <div class="sl-alert-progress"></div>
    `;

    document.body.appendChild(alertCard);

    // EVENT LISTENERS
    document.getElementById("sl-view-details-btn").onclick = () => {
        chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" });
        alertCard.remove(); 
    };

    document.getElementById("sl-dismiss-btn").onclick = () => {
        alertCard.remove();
    };

    // Auto Dismiss after 8 seconds
    setTimeout(() => {
        if(alertCard) alertCard.remove();
    }, 8000);
}

function highlightRisks() {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach(iframe => {
        const src = iframe.src.toLowerCase();
        if (src.includes("doubleclick") || src.includes("ads")) {
            iframe.style.border = "4px solid #e74c3c";
            iframe.style.position = "relative";
            iframe.style.boxSizing = "border-box";
        }
    });
}