chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
chrome.runtime.onInstalled.addListener(() => {

  console.log(" SafeLens installed and running");
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: "init" })
        .then(data => {
          console.log("✅ AI Analysis Received:", data);
          
          // DIRECTLY CALL THE UI FUNCTION INSTEAD OF SENDING MESSAGE
          applyVisualInjections(data); 
          
          // OPTIONAL: Still send to Sidepanel if needed
          chrome.runtime.sendMessage({
            action: "update_sidepanel",
            data: data
          });
        })
        .catch(() => {
          // Tab might not have the content script loaded
        });
    });
  });

});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    // Logic to Open Side Panel
    if (message.action === "OPEN_SIDEPANEL") {
        if (sender.tab && sender.tab.id) {
            // This requires Chrome 114+
            chrome.sidePanel.open({ tabId: sender.tab.id });
        }
    }

    // Logic to Update Side Panel (Pass-through)
    if (message.action === "SAFE_LENS_UPDATE") {
        // You can store data in local storage if you want it to persist
        // chrome.storage.local.set({ latestAnalysis: message.payload });
    }
});