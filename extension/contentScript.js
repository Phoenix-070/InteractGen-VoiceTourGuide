/**
 * Content Script - Injects the floating button and initializes the voice assistant
 * This script runs on all pages and creates a minimal, non-intrusive UI
 */

(function() {
    'use strict';

    // Prevent multiple injections
    if (window.voiceAssistantInjected) {
        return;
    }
    window.voiceAssistantInjected = true;

    // Create and inject the floating button
    function createFloatingButton() {
        const button = document.createElement('div');
        button.id = 'voice-nav-button';
        button.className = 'voice-nav-button';
        button.innerHTML = '🎤';
        button.setAttribute('aria-label', 'Voice Navigation Assistant');
        button.setAttribute('title', 'Click to activate voice navigation');
        
        // Make it draggable
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        
        button.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            isDragging = true;
            initialX = e.clientX - button.offsetLeft;
            initialY = e.clientY - button.offsetTop;
            button.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            // Keep button within viewport
            const maxX = window.innerWidth - button.offsetWidth;
            const maxY = window.innerHeight - button.offsetHeight;
            currentX = Math.max(0, Math.min(currentX, maxX));
            currentY = Math.max(0, Math.min(currentY, maxY));
            
            button.style.left = currentX + 'px';
            button.style.top = currentY + 'px';
            button.style.right = 'auto';
            button.style.bottom = 'auto';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                button.style.cursor = 'pointer';
            }
        });

        // Click handler - initialize assistant
        let assistantInitialized = false;
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!assistantInitialized) {
                // Inject voice assistant script
                const script = document.createElement('script');
                script.src = chrome.runtime.getURL('voiceAssistant.js');
                script.onload = function() {
                    this.remove();
                    // Small delay to ensure class is loaded
                    setTimeout(() => {
                        if (window.VoiceAssistant) {
                            window.voiceAssistant = new window.VoiceAssistant();
                            assistantInitialized = true;
                            // Show instructions and start listening
                            if (window.voiceAssistant) {
                                window.voiceAssistant.showInstructions();
                                window.voiceAssistant.startListening();
                            }
                        }
                    }, 100);
                };
                (document.head || document.documentElement).appendChild(script);
            } else {
                // Toggle assistant
                if (window.voiceAssistant) {
                    window.voiceAssistant.toggle();
                }
            }
        });

        // Add hover tooltip
        let tooltip = null;
        button.addEventListener('mouseenter', () => {
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'voice-nav-tooltip';
                tooltip.textContent = 'Voice Navigation';
                document.body.appendChild(tooltip);
                
                const rect = button.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
            }
        });

        button.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        });

        document.body.appendChild(button);
        return button;
    }

    // Initialize when DOM is ready
    if (document.body) {
        createFloatingButton();
    } else {
        document.addEventListener('DOMContentLoaded', createFloatingButton);
    }

    // Handle dynamic page changes (SPAs)
    const observer = new MutationObserver(() => {
        if (!document.getElementById('voice-nav-button') && document.body) {
            createFloatingButton();
        }
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
})();

