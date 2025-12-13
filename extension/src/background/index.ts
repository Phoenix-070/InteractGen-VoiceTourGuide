
// Background Service Worker

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'NAVIGATE_TAB') {
        const url = message.url;
        if (url) {
            // Open a new tab so the tour session is not lost
            chrome.tabs.create({ url: url });
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: 'No URL provided' });
        }
    }
    // Return true to indicate asynchronous response (if needed)
    return true;
});

console.log("InteractGen Background Worker Loaded");
