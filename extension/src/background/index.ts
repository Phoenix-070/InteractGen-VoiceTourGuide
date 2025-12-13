
// Background Service Worker

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'NAVIGATE_TAB') {
        const url = message.url;
        if (url) {
            // Update the current tab to the new URL
            if (sender.tab && sender.tab.id) {
                chrome.tabs.update(sender.tab.id, { url: url });
            } else {
                // Fallback if no sender tab (unlikely for content script)
                chrome.tabs.create({ url: url });
            }
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'No URL provided' });
        }
    }
    // Return true to indicate asynchronous response (if needed)
    return true;
});

console.log("InteractGen Background Worker Loaded");
