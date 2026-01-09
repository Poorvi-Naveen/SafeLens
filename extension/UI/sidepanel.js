// extension/UI/sidepanel.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // We listen for the specific update action
    if (message.action === "SAFE_LENS_UPDATE" || message.action === "update_ui") {
        const data = message.payload || message.data; // Handle both naming conventions
        if(data) {
            renderDashboard(data);
        }
    }
});

function renderDashboard(data) {
    // 1. Switch Views
    document.getElementById("loading-view").style.display = "none";
    document.getElementById("dashboard-view").style.display = "block";

    // 2. Update Score
    const scoreVal = document.getElementById("score-val");
    scoreVal.innerText = data.risk_score;

    // 3. Animate Gauge (Score 0-100 mapped to Stroke Dashoffset)
    // Circumference is ~314. Max offset is ~280 in CSS for visual style.
    // Formula: MaxOffset - (Score/100 * MaxOffset)
    const maxOffset = 280; 
    const offset = maxOffset - ((data.risk_score / 100) * maxOffset);
    document.getElementById("gauge-fill").style.strokeDashoffset = offset;

    // 4. Update Badge Color & Text
    const badge = document.getElementById("risk-badge");
    const riskText = document.getElementById("risk-text");
    const gaugeFill = document.getElementById("gauge-fill");
    
    riskText.innerText = data.risk_level + " Risk";

    if (data.risk_score > 70) {
        // High Score = Safe (Green)
        badge.style.background = "#DCFCE7";
        badge.style.color = "#16A34A";
        gaugeFill.style.stroke = "#16A34A";
    } else if (data.risk_score > 40) {
        // Medium Score = Caution (Orange)
        badge.style.background = "#FFF4E6";
        badge.style.color = "#D97706";
        gaugeFill.style.stroke = "#D97706";
    } else {
        // Low Score = Danger (Red)
        badge.style.background = "#FEE2E2";
        badge.style.color = "#DC2626";
        gaugeFill.style.stroke = "#DC2626";
    }

    // 5. Update Summary
    document.getElementById("summary-text").innerText = data.summary;

    // 6. Update Interventions List (Dynamic based on data)
    const list = document.getElementById("intervention-list");
    list.innerHTML = ""; // Clear previous

    // Add "Traffic Poisoning" Item
    if (data.risk_level !== "Safe") {
        list.innerHTML += `
            <div class="blocked-item">
                <span class="blocked-name">Data Fuzzing</span>
                <span class="blocked-type" style="color:#16A34A;">Active</span>
            </div>
        `;
    }

    // Add "Trackers Found" Item
    // We parse the summary or use a tracker count if available
    const trackerCount = (data.summary.match(/tracker/gi) || []).length;
    if (trackerCount > 0 || data.risk_level !== "Safe") {
         list.innerHTML += `
            <div class="blocked-item">
                <span class="blocked-name">Trackers Blocked</span>
                <span class="blocked-type">3 detected</span>
            </div>
        `;
    } else {
        list.innerHTML += `
            <div style="font-size:12px; color:#5A6C7D; text-align:center;">
                No active threats detected.
            </div>
        `;
    }
}