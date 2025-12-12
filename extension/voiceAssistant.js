/**
 * Voice Assistant - Core logic for voice navigation, DOM scanning, and guided tours
 * This is a standalone, client-side implementation with no backend dependencies
 */

(function() {
    'use strict';

    class VoiceAssistant {
        constructor() {
            this.state = {
                mode: 'idle', // 'idle', 'listening', 'inTour'
                sections: new Map(), // keyword -> element mapping
                tourSteps: [],
                currentTourStep: 0,
                isActive: false
            };

            this.recognition = null;
            this.synth = window.speechSynthesis;
            this.container = null;
            this.overlay = null;

            this.initSpeechRecognition();
            this.createUI();
            this.scanDOM();
        }

        /**
         * Initialize Web Speech API for speech recognition
         */
        initSpeechRecognition() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                this.showError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim().toLowerCase();
                this.handleCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    this.showError('Microphone access denied. Please allow microphone access.');
                } else if (event.error === 'no-speech') {
                    this.speak('I didn\'t hear anything. Please try again.');
                }
                this.setState({ mode: 'idle' });
            };

            this.recognition.onend = () => {
                if (this.state.mode === 'listening') {
                    this.setState({ mode: 'idle' });
                }
            };
        }

        /**
         * Scan the DOM to build a map of navigable sections
         * Maps keywords like "pricing", "contact", "features" to DOM elements
         */
        scanDOM() {
            const sections = new Map();
            
            // Common keywords to look for
            const keywords = [
                'home', 'about', 'features', 'pricing', 'contact', 'sign up', 'login', 
                'products', 'services', 'blog', 'news', 'support', 'help', 'faq',
                'buy', 'shop', 'cart', 'checkout', 'menu', 'navigation', 'nav'
            ];

            // Scan headings (h1, h2, h3)
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                const text = el.textContent.trim().toLowerCase();
                const id = el.id.toLowerCase();
                const className = el.className.toLowerCase();
                
                keywords.forEach(keyword => {
                    if (text.includes(keyword) || id.includes(keyword) || className.includes(keyword)) {
                        if (!sections.has(keyword)) {
                            sections.set(keyword, el);
                        }
                    }
                });
            });

            // Scan links and buttons
            document.querySelectorAll('a, button, [role="button"]').forEach(el => {
                const text = el.textContent.trim().toLowerCase();
                const id = el.id.toLowerCase();
                const className = el.className.toLowerCase();
                const href = (el.href || '').toLowerCase();
                
                keywords.forEach(keyword => {
                    if (text.includes(keyword) || id.includes(keyword) || className.includes(keyword) || href.includes(keyword)) {
                        if (!sections.has(keyword)) {
                            sections.set(keyword, el);
                        }
                    }
                });
            });

            // Scan sections with IDs or data attributes
            document.querySelectorAll('section, [id], [data-section]').forEach(el => {
                const id = el.id.toLowerCase();
                const dataSection = (el.getAttribute('data-section') || '').toLowerCase();
                
                keywords.forEach(keyword => {
                    if (id.includes(keyword) || dataSection.includes(keyword)) {
                        if (!sections.has(keyword)) {
                            sections.set(keyword, el);
                        }
                    }
                });
            });

            this.state.sections = sections;
            console.log(`Scanned DOM: Found ${sections.size} navigable sections`, sections);
        }

        /**
         * Parse and execute voice commands
         */
        handleCommand(transcript) {
            console.log('Command received:', transcript);
            
            const lowerTranscript = transcript.toLowerCase();

            // Tour commands
            if (lowerTranscript.includes('give me a tour') || lowerTranscript.includes('start tour') || lowerTranscript.includes('show me around')) {
                this.startTour();
                return;
            }

            if (lowerTranscript.includes('next') && this.state.mode === 'inTour') {
                this.nextTourStep();
                return;
            }

            if (lowerTranscript.includes('previous') || lowerTranscript.includes('back') && this.state.mode === 'inTour') {
                this.previousTourStep();
                return;
            }

            if (lowerTranscript.includes('stop tour') || lowerTranscript.includes('end tour')) {
                this.endTour();
                return;
            }

            // Navigation commands - "go to [section]"
            const goToMatch = lowerTranscript.match(/go to (.+)|navigate to (.+)|show me (.+)|take me to (.+)/);
            if (goToMatch) {
                const target = (goToMatch[1] || goToMatch[2] || goToMatch[3] || goToMatch[4]).trim();
                this.navigateToSection(target);
                return;
            }

            // Scroll commands
            if (lowerTranscript.includes('scroll down')) {
                this.scrollPage('down');
                return;
            }

            if (lowerTranscript.includes('scroll up')) {
                this.scrollPage('up');
                return;
            }

            if (lowerTranscript.includes('scroll to top') || lowerTranscript.includes('go to top')) {
                this.scrollPage('top');
                return;
            }

            if (lowerTranscript.includes('scroll to bottom') || lowerTranscript.includes('go to bottom')) {
                this.scrollPage('bottom');
                return;
            }

            // Explain page
            if (lowerTranscript.includes('explain') || lowerTranscript.includes('what is this') || lowerTranscript.includes('tell me about')) {
                this.explainPage();
                return;
            }

            // Help
            if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do')) {
                this.showHelp();
                return;
            }

            // Default: try to find and navigate to the mentioned section
            this.navigateToSection(lowerTranscript);
        }

        /**
         * Navigate to a section by keyword
         */
        navigateToSection(keyword) {
            // Try exact match first
            let element = this.state.sections.get(keyword);
            
            // Try partial matches
            if (!element) {
                for (const [sectionKey, sectionEl] of this.state.sections.entries()) {
                    if (sectionKey.includes(keyword) || keyword.includes(sectionKey)) {
                        element = sectionEl;
                        break;
                    }
                }
            }

            if (element) {
                this.scrollToElement(element);
                this.highlightElement(element, 2000);
                this.speak(`Navigated to ${this.getElementDescription(element)}`);
            } else {
                this.speak(`I couldn't find a section called "${keyword}". Try saying "give me a tour" to see available sections.`);
            }
        }

        /**
         * Start a guided tour of the page
         */
        startTour() {
            this.scanDOM(); // Refresh sections
            
            // Build tour steps from detected sections and important elements
            const steps = [];
            
            // Add main sections
            for (const [keyword, element] of this.state.sections.entries()) {
                if (this.isElementVisible(element)) {
                    steps.push({
                        element: element,
                        keyword: keyword,
                        description: this.getElementDescription(element)
                    });
                }
            }

            // Add important headings if we don't have many sections
            if (steps.length < 3) {
                document.querySelectorAll('h1, h2').forEach((el, idx) => {
                    if (idx < 5 && this.isElementVisible(el) && !steps.some(s => s.element === el)) {
                        steps.push({
                            element: el,
                            keyword: el.textContent.trim().substring(0, 20),
                            description: el.textContent.trim()
                        });
                    }
                });
            }

            if (steps.length === 0) {
                this.speak('I couldn\'t find any sections to tour. This page might be too simple or the content is loaded dynamically.');
                return;
            }

            this.state.tourSteps = steps;
            this.state.currentTourStep = 0;
            this.setState({ mode: 'inTour' });
            
            this.showTourOverlay();
            this.showTourStep(0);
            this.speak(`Starting tour with ${steps.length} stops. Say "next" to continue or "stop tour" to end.`);
        }

        /**
         * Show a specific tour step
         */
        showTourStep(stepIndex) {
            if (stepIndex < 0 || stepIndex >= this.state.tourSteps.length) {
                return;
            }

            const step = this.state.tourSteps[stepIndex];
            this.state.currentTourStep = stepIndex;

            this.scrollToElement(step.element);
            this.highlightElement(step.element, 5000);
            
            const description = `Step ${stepIndex + 1} of ${this.state.tourSteps.length}: ${step.description}`;
            this.updateTourOverlay(description, stepIndex);
            this.speak(description);
        }

        nextTourStep() {
            if (this.state.currentTourStep < this.state.tourSteps.length - 1) {
                this.showTourStep(this.state.currentTourStep + 1);
            } else {
                this.speak('You\'ve reached the end of the tour.');
                this.endTour();
            }
        }

        previousTourStep() {
            if (this.state.currentTourStep > 0) {
                this.showTourStep(this.state.currentTourStep - 1);
            } else {
                this.speak('You\'re already at the beginning of the tour.');
            }
        }

        endTour() {
            this.setState({ mode: 'idle' });
            this.hideTourOverlay();
            this.removeHighlight();
            this.speak('Tour ended.');
        }

        /**
         * Scroll the page
         */
        scrollPage(direction) {
            const scrollAmount = window.innerHeight * 0.8;
            let targetScroll = window.scrollY;

            switch(direction) {
                case 'down':
                    targetScroll += scrollAmount;
                    break;
                case 'up':
                    targetScroll -= scrollAmount;
                    break;
                case 'top':
                    targetScroll = 0;
                    break;
                case 'bottom':
                    targetScroll = document.documentElement.scrollHeight;
                    break;
            }

            window.scrollTo({
                top: Math.max(0, Math.min(targetScroll, document.documentElement.scrollHeight - window.innerHeight)),
                behavior: 'smooth'
            });

            this.speak(`Scrolled ${direction}`);
        }

        /**
         * Explain the current page
         */
        explainPage() {
            const title = document.title;
            const headings = Array.from(document.querySelectorAll('h1, h2')).slice(0, 5)
                .map(h => h.textContent.trim())
                .filter(t => t.length > 0)
                .join(', ');

            const explanation = `This page is titled "${title}". ${headings ? `Main sections include: ${headings}.` : ''} Say "give me a tour" for a detailed walkthrough.`;
            
            this.speak(explanation);
        }

        /**
         * Show help instructions
         */
        showHelp() {
            const helpText = 'I can help you navigate this page. Try saying: "Give me a tour", "Go to pricing", "Scroll down", "Explain this page", or "Next" and "Previous" during a tour.';
            this.speak(helpText);
            this.showInstructions();
        }

        /**
         * Scroll to an element smoothly
         */
        scrollToElement(element) {
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offset = 100; // Offset from top
            
            window.scrollTo({
                top: elementPosition - offset,
                behavior: 'smooth'
            });
        }

        /**
         * Highlight an element temporarily
         */
        highlightElement(element, duration = 2000) {
            this.removeHighlight();
            
            const highlight = document.createElement('div');
            highlight.className = 'voice-nav-highlight';
            highlight.id = 'voice-nav-highlight';
            
            const rect = element.getBoundingClientRect();
            highlight.style.cssText = `
                position: absolute;
                left: ${rect.left + window.scrollX}px;
                top: ${rect.top + window.scrollY}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 3px solid #3b82f6;
                border-radius: 4px;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
                pointer-events: none;
                z-index: 2147483646;
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(highlight);
            
            setTimeout(() => {
                highlight.style.opacity = '0';
                setTimeout(() => highlight.remove(), 300);
            }, duration);
        }

        removeHighlight() {
            const existing = document.getElementById('voice-nav-highlight');
            if (existing) {
                existing.remove();
            }
        }

        /**
         * Create the main UI container
         */
        createUI() {
            this.container = document.createElement('div');
            this.container.id = 'voice-nav-container';
            this.container.className = 'voice-nav-container';
            document.body.appendChild(this.container);
        }

        /**
         * Show tour overlay
         */
        showTourOverlay() {
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.id = 'voice-nav-tour-overlay';
                this.overlay.className = 'voice-nav-tour-overlay';
                
                // Dim background
                const dimmer = document.createElement('div');
                dimmer.className = 'voice-nav-dimmer';
                this.overlay.appendChild(dimmer);

                // Tour info panel
                const panel = document.createElement('div');
                panel.className = 'voice-nav-tour-panel';
                panel.innerHTML = `
                    <div class="voice-nav-tour-header">
                        <h3>Guided Tour</h3>
                        <button class="voice-nav-close" aria-label="Close tour">×</button>
                    </div>
                    <div class="voice-nav-tour-content">
                        <p id="voice-nav-tour-description"></p>
                        <div class="voice-nav-tour-controls">
                            <button id="voice-nav-tour-prev">← Previous</button>
                            <button id="voice-nav-tour-next">Next →</button>
                            <button id="voice-nav-tour-stop">Stop Tour</button>
                        </div>
                    </div>
                `;
                this.overlay.appendChild(panel);

                // Event listeners
                panel.querySelector('.voice-nav-close').addEventListener('click', () => this.endTour());
                panel.querySelector('#voice-nav-tour-stop').addEventListener('click', () => this.endTour());
                panel.querySelector('#voice-nav-tour-prev').addEventListener('click', () => this.previousTourStep());
                panel.querySelector('#voice-nav-tour-next').addEventListener('click', () => this.nextTourStep());

                document.body.appendChild(this.overlay);
            }
            this.overlay.style.display = 'block';
        }

        hideTourOverlay() {
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
        }

        updateTourOverlay(description, stepIndex) {
            if (this.overlay) {
                const descEl = this.overlay.querySelector('#voice-nav-tour-description');
                if (descEl) {
                    descEl.textContent = description;
                }
                
                const prevBtn = this.overlay.querySelector('#voice-nav-tour-prev');
                const nextBtn = this.overlay.querySelector('#voice-nav-tour-next');
                
                if (prevBtn) prevBtn.disabled = stepIndex === 0;
                if (nextBtn) nextBtn.disabled = stepIndex >= this.state.tourSteps.length - 1;
            }
        }

        /**
         * Show instructions tooltip
         */
        showInstructions() {
            const instructions = document.createElement('div');
            instructions.id = 'voice-nav-instructions';
            instructions.className = 'voice-nav-instructions';
            instructions.innerHTML = `
                <h4>Voice Commands</h4>
                <ul>
                    <li>"Give me a tour" - Start guided tour</li>
                    <li>"Go to [section]" - Navigate to section</li>
                    <li>"Scroll down/up" - Scroll page</li>
                    <li>"Next/Previous" - Tour navigation</li>
                    <li>"Explain this page" - Page summary</li>
                </ul>
                <button class="voice-nav-close-instructions">Got it</button>
            `;
            
            instructions.querySelector('.voice-nav-close-instructions').addEventListener('click', () => {
                instructions.remove();
            });
            
            document.body.appendChild(instructions);
            
            setTimeout(() => {
                if (instructions.parentNode) {
                    instructions.style.opacity = '0';
                    setTimeout(() => instructions.remove(), 300);
                }
            }, 10000);
        }

        /**
         * Start listening for voice commands
         */
        startListening() {
            if (!this.recognition) {
                this.showError('Speech recognition is not available.');
                return;
            }

            if (this.state.mode === 'listening') {
                this.stopListening();
                return;
            }

            try {
                this.setState({ mode: 'listening' });
                this.recognition.start();
                this.speak('Listening...');
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.setState({ mode: 'idle' });
            }
        }

        stopListening() {
            if (this.recognition && this.state.mode === 'listening') {
                this.recognition.stop();
                this.setState({ mode: 'idle' });
            }
        }

        /**
         * Speak text using Web Speech API
         */
        speak(text) {
            this.synth.cancel(); // Cancel any ongoing speech
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            this.synth.speak(utterance);
        }

        /**
         * Toggle assistant on/off
         */
        toggle() {
            if (!this.state.isActive) {
                this.state.isActive = true;
                this.showInstructions();
                this.startListening();
            } else {
                this.state.isActive = false;
                this.stopListening();
                this.endTour();
            }
        }

        /**
         * Utility methods
         */
        setState(updates) {
            Object.assign(this.state, updates);
            this.updateUI();
        }

        updateUI() {
            const button = document.getElementById('voice-nav-button');
            if (button) {
                if (this.state.mode === 'listening') {
                    button.classList.add('listening');
                    button.innerHTML = '🔴';
                } else {
                    button.classList.remove('listening');
                    button.innerHTML = '🎤';
                }
            }
        }

        isElementVisible(element) {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && 
                   element.offsetParent !== null &&
                   window.getComputedStyle(element).visibility !== 'hidden' &&
                   window.getComputedStyle(element).display !== 'none';
        }

        getElementDescription(element) {
            const text = element.textContent.trim().substring(0, 100);
            const tagName = element.tagName.toLowerCase();
            
            if (text) {
                return `${tagName}: ${text}`;
            }
            return `${tagName} element`;
        }

        showError(message) {
            const error = document.createElement('div');
            error.className = 'voice-nav-error';
            error.textContent = message;
            document.body.appendChild(error);
            
            setTimeout(() => {
                error.style.opacity = '0';
                setTimeout(() => error.remove(), 300);
            }, 5000);
        }
    }

    // Export to window for content script access
    window.VoiceAssistant = VoiceAssistant;
})();

