/**
 * Popup Script - Controls the extension state
 */

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('status');
    const speechApiEl = document.getElementById('speech-api');
    const toggleBtn = document.getElementById('toggle-btn');
    
    // Check Speech API availability
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        speechApiEl.textContent = 'Available';
        speechApiEl.classList.add('active');
    } else {
        speechApiEl.textContent = 'Not Available';
        speechApiEl.classList.add('inactive');
        toggleBtn.disabled = true;
        toggleBtn.textContent = 'Speech API Not Supported';
    }
    
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            // Check if assistant is active (we'll use a simple approach)
            // In a real implementation, you might use chrome.storage to track state
            updateUI();
        }
    });
    
    // Toggle button handler
    toggleBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                // Inject script to toggle assistant
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        if (window.voiceAssistant) {
                            window.voiceAssistant.toggle();
                        } else {
                            // Trigger button click to initialize
                            const button = document.getElementById('voice-nav-button');
                            if (button) {
                                button.click();
                            }
                        }
                    }
                });
                
                // Update UI after a short delay
                setTimeout(updateUI, 500);
            }
        });
    });
    
    function updateUI() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => {
                        return {
                            exists: !!window.voiceAssistant,
                            isActive: window.voiceAssistant?.state?.isActive || false,
                            mode: window.voiceAssistant?.state?.mode || 'idle'
                        };
                    }
                }, (results) => {
                    if (results && results[0] && results[0].result) {
                        const state = results[0].result;
                        if (state.exists && state.isActive) {
                            statusEl.textContent = 'Active';
                            statusEl.classList.add('active');
                            statusEl.classList.remove('inactive');
                            toggleBtn.textContent = 'Disable Assistant';
                            toggleBtn.className = 'toggle-button disable';
                        } else {
                            statusEl.textContent = 'Inactive';
                            statusEl.classList.add('inactive');
                            statusEl.classList.remove('active');
                            toggleBtn.textContent = 'Enable Assistant';
                            toggleBtn.className = 'toggle-button enable';
                        }
                    }
                });
            }
        });
    }
    
    // Initial update
    updateUI();
});

