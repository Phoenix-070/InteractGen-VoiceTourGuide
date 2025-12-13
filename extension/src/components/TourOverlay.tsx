import React, { useState, useEffect, useRef } from 'react';
import { scanPage } from '../content/domScanner';
import { generateTour, sendChatMessage } from '../services/api';

// Simple type for SpeechRecognition (browser specific)
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

const TourOverlay: React.FC = () => {
    // Tour State
    const [status, setStatus] = useState<string>("Ready");
    const [tourData, setTourData] = useState<any>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Refs for highlighting
    const activeHighlightRef = useRef<HTMLElement | null>(null);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [userInput, setUserInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Safety Modal State
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: string, element: HTMLElement } | null>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Tour Execution Effect ---
    useEffect(() => {
        if (currentStepIndex >= 0 && tourData?.steps && currentStepIndex < tourData.steps.length) {
            executeStep(tourData.steps[currentStepIndex]);
        } else if (tourData && currentStepIndex >= tourData.steps.length) {
            setStatus("Tour Completed");
            setIsPlaying(false);
            clearHighlight();
        }
    }, [currentStepIndex, tourData]);

    const clearHighlight = () => {
        if (activeHighlightRef.current) {
            activeHighlightRef.current.style.outline = '';
            activeHighlightRef.current.style.backgroundColor = '';
            activeHighlightRef.current = null;
        }
    };

    const executeStep = (step: any) => {
        clearHighlight();
        setStatus(`Step ${currentStepIndex + 1}/${tourData.steps.length}`);

        // 1. Find Element
        const el = document.querySelector(step.element_selector) as HTMLElement;
        if (el) {
            // 2. Scroll
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 3. Highlight
            activeHighlightRef.current = el;
            el.style.outline = '4px solid #facc15'; // Yellow highlight
            el.style.backgroundColor = 'rgba(250, 204, 21, 0.2)';
        }

        // 4. Handle Action
        if (step.action === 'click' && el) {
            // Show safety modal
            setPendingAction({ type: 'click', element: el });
            setShowSafetyModal(true);
        } else {
            // For scroll or none, proceed
            performAction(step.action, el);
        }

        // 5. Speak
        speak(step.narrative, () => {
            // On end
            if (isPlaying && step.action !== 'click') {
                // Auto advance after a brief pause, but not for clicks
                setTimeout(() => {
                    setCurrentStepIndex(prev => prev + 1);
                }, 1500);
            }
        });
    };

    const performAction = (action: string, el: HTMLElement | null) => {
        if (action === 'click' && el) {
            el.click();
        }
        // Add other actions if needed
    };

    const confirmAction = () => {
        if (pendingAction) {
            performAction(pendingAction.type, pendingAction.element);
            setPendingAction(null);
            setShowSafetyModal(false);
            if (isPlaying) {
                setTimeout(() => {
                    setCurrentStepIndex(prev => prev + 1);
                }, 500);
            }
        }
    };

    const cancelAction = () => {
        setPendingAction(null);
        setShowSafetyModal(false);
        if (isPlaying) {
            setTimeout(() => {
                setCurrentStepIndex(prev => prev + 1);
            }, 500);
        }
    };

    // --- Tour Logic ---
    const handleStartTour = async () => {
        if (tourData && currentStepIndex === -1) {
            // Restart
            setCurrentStepIndex(0);
            setIsPlaying(true);
            return;
        }

        setStatus("Scanning Page...");
        try {
            const elements = scanPage();
            console.log(`Scanned ${elements.length} elements`);
            if (elements.length === 0) {
                setStatus("No elements found");
                return;
            }

            setStatus(`Generating Tour...`);
            const tour = await generateTour(document.title, elements);
            setTourData(tour);

            // Auto start
            setStatus(`Starting Tour...`);
            setCurrentStepIndex(0);
            setIsPlaying(true);

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || "Unknown"}`);
        }
    };

    const handleStopTour = () => {
        setIsPlaying(false);
        setCurrentStepIndex(-1);
        clearHighlight();
        window.speechSynthesis.cancel();
        setStatus("Ready");
    };

    const handleNext = () => {
        window.speechSynthesis.cancel();
        setCurrentStepIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        window.speechSynthesis.cancel();
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
    };

    // --- Voice Logic (STT) ---
    const startListening = () => {
        const { webkitSpeechRecognition } = window as unknown as IWindow;
        if (!webkitSpeechRecognition) {
            alert("Speech Recognition not supported in this browser.");
            return;
        }

        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript);
            handleSendMessage(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    // --- Chat Logic ---
    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Pause tour if chatting
        if (isPlaying) setIsPlaying(false);
        window.speechSynthesis.cancel();

        const newMessages: any[] = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setUserInput("");

        try {
            const elements = scanPage();
            const { text: responseText } = await sendChatMessage(text, document.title, elements);
            setMessages([...newMessages, { role: 'assistant', text: responseText }]);
            speak(responseText);

        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', text: "Sorry, I encountered an error." }]);
        }
    };

    const speak = (text: string, onEnd?: () => void) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 2147483647,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            color: '#333',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>InteractGen</h3>
                <span style={{ fontSize: '12px', color: '#666' }}>{status}</span>
            </div>

            {/* Current Step Display */}
            {currentStepIndex >= 0 && tourData?.steps?.[currentStepIndex] && (
                <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderBottom: '1px solid #eee' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic' }}>
                        "{tourData.steps[currentStepIndex].narrative}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                        <button onClick={handlePrev} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Prev</button>
                        <button onClick={() => setIsPlaying(!isPlaying)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>{isPlaying ? 'Pause' : 'Play'}</button>
                        <button onClick={handleNext} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
                    </div>
                </div>
            )}

            {/* Chat History */}
            <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                backgroundColor: '#fff',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {messages.length === 0 && currentStepIndex === -1 && (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '14px' }}>
                        👋 Click "Start Tour" or ask a question!
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.role === 'user' ? '#2563EB' : '#f1f3f4',
                        color: msg.role === 'user' ? 'white' : '#333',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        maxWidth: '80%',
                        fontSize: '14px',
                        lineHeight: '1.4'
                    }}>
                        {msg.text}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Controls */}
            <div style={{ padding: '12px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', marginBottom: '8px', gap: '8px' }}>
                    {currentStepIndex === -1 ? (
                        <button
                            onClick={handleStartTour}
                            style={{
                                flex: 1,
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            Start Tour
                        </button>
                    ) : (
                        <button
                            onClick={handleStopTour}
                            style={{
                                flex: 1,
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            Stop Tour
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                        placeholder="Ask a question..."
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '20px',
                            border: '1px solid #ddd',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                    <button
                        onClick={() => isListening ? setIsListening(false) : startListening()}
                        style={{
                            backgroundColor: isListening ? '#EF4444' : '#2563EB',
                            color: 'white',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {isListening ? '🛑' : '🎤'}
                    </button>
                    <button
                        onClick={() => handleSendMessage(userInput)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                    >
                        🚀
                    </button>
                </div>
            </div>

            {/* Safety Modal */}
            {showSafetyModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2147483648
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Confirm Action</h3>
                        <p style={{ margin: '0 0 20px 0', color: '#666' }}>
                            The tour wants to click on an element. This may navigate or interact with the page. Proceed?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={confirmAction}
                                style={{
                                    backgroundColor: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm
                            </button>
                            <button
                                onClick={cancelAction}
                                style={{
                                    backgroundColor: '#EF4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourOverlay;
