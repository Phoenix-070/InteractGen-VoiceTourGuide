import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, SkipForward, SkipBack, Mic, Square } from 'lucide-react';
import { scanPage } from '../content/domScanner';
import { generateTour, sendChatMessage } from '../services/api';
import VoiceOrb from './VoiceOrb';

// Simple type for SpeechRecognition (browser specific)
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface VoiceInterfaceProps {
    onClose: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onClose }) => {
    // Tour State
    const [status, setStatus] = useState<string>("Ready");
    const [tourData, setTourData] = useState<any>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Refs for highlighting
    const activeHighlightRef = useRef<HTMLElement | null>(null);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string, suggestions?: string[] }[]>([]);
    const [userInput, setUserInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [showChat, setShowChat] = useState(false); // Toggle chat view
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Safety Modal State
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: string, element: HTMLElement } | null>(null);

    // Derived Orb Mode
    const [orbMode, setOrbMode] = useState<'idle' | 'listening' | 'speaking' | 'processing'>('idle');

    useEffect(() => {
        if (isListening) setOrbMode('listening');
        else if (status.includes("Generating") || status.includes("Scanning")) setOrbMode('processing');
        else if (window.speechSynthesis.speaking) setOrbMode('speaking');
        else setOrbMode('idle');
    }, [isListening, status]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showChat]);

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
        } else if (step.action === 'navigate' && step.url) {
            // Handle Navigation
            if (chrome && chrome.runtime) {
                chrome.runtime.sendMessage({ type: 'NAVIGATE_TAB', url: step.url });
            } else {
                console.warn("Navigation requires Chrome Extension environment");
                window.location.href = step.url; // Fallback for local dev?
            }
        } else {
            // For scroll or none, proceed
            performAction(step.action, el);
        }

        // 5. Speak
        speak(step.narrative, () => {
            setOrbMode('idle');
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
            if (elements.length === 0) {
                setStatus("No elements found");
                return;
            }

            setStatus("Generating Tour...");
            const tour = await generateTour(document.title, elements);
            setTourData(tour);

            // Auto start
            setStatus("Starting Tour...");
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
        setOrbMode('listening');

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript);
            handleSendMessage(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
            setIsListening(false);
            setOrbMode('idle');
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
        setShowChat(true); // Auto show chat on message

        try {
            setOrbMode('processing');
            const elements = scanPage();
            const { text: responseText, suggestions } = await sendChatMessage(text, document.title, elements);
            setMessages([...newMessages, { role: 'assistant', text: responseText, suggestions }]);
            speak(responseText);

        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', text: "Sorry, I encountered an error." }]);
            setOrbMode('idle');
        }
    };

    const speak = (text: string, onEnd?: () => void) => {
        window.speechSynthesis.cancel();
        setOrbMode('speaking');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            setOrbMode('idle');
            if (onEnd) onEnd();
        };
        window.speechSynthesis.speak(utterance);
    };

    return (
        <motion.div
            layoutId="interactgen-container"
            initial={{ borderRadius: '28px', width: '56px', height: '56px' }}
            animate={{ width: '350px', height: showChat ? '500px' : '400px', borderRadius: '24px' }}
            exit={{ width: '56px', height: '56px', borderRadius: '50%' }}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
        >
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>InteractGen</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                    <X size={18} />
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>

                {/* Voice Orb Area - Always visible but shrinks if chat is open */}
                <motion.div
                    animate={{ scale: showChat ? 0.6 : 1, y: showChat ? -20 : 0 }}
                    style={{ flexShrink: 0 }}
                >
                    <VoiceOrb isActive={isListening || orbMode !== 'idle'} mode={orbMode} />
                </motion.div>

                {/* Status Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        marginTop: '16px',
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#333',
                        textAlign: 'center',
                        maxWidth: '80%'
                    }}
                >
                    {status === "Ready" ? (showChat ? "" : "How can I help you?") : status}
                </motion.p>

                {/* Step Narrative (if active) */}
                {currentStepIndex >= 0 && tourData?.steps?.[currentStepIndex] && !showChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '12px', padding: '0 20px', textAlign: 'center', fontSize: '14px', color: '#555' }}
                    >
                        "{tourData.steps[currentStepIndex].narrative}"
                    </motion.div>
                )}

                {/* Chat Messages (Overlay or Toggle) */}
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'absolute',
                            top: '60px',
                            bottom: '80px',
                            width: '100%',
                            padding: '0 16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 10%)'
                        }}
                    >
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                <div style={{
                                    backgroundColor: msg.role === 'user' ? '#3B82F6' : '#F3F4F6',
                                    color: msg.role === 'user' ? 'white' : '#1F2937',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.text}
                                </div>
                                {msg.suggestions && (
                                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {msg.suggestions.map((suggestion, sIdx) => (
                                            <button
                                                key={sIdx}
                                                onClick={() => handleSendMessage(suggestion)}
                                                style={{
                                                    backgroundColor: '#E0F2FE',
                                                    color: '#0284C7',
                                                    border: '1px solid #BAE6FD',
                                                    borderRadius: '12px',
                                                    padding: '4px 10px',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left'
                                                }}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </motion.div>
                )}
            </div>

            {/* Bottom Controls */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.5)' }}>

                {/* Tour Controls or Chat Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    {/* Input Field w/ Mic */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                            placeholder="Ask or say command..."
                            style={{
                                width: '100%',
                                padding: '10px 40px 10px 12px',
                                borderRadius: '20px',
                                border: '1px solid #E5E7EB',
                                outline: 'none',
                                fontSize: '14px',
                                backgroundColor: '#F9FAFB'
                            }}
                        />
                        <button
                            onClick={() => isListening ? setIsListening(false) : startListening()}
                            style={{
                                position: 'absolute',
                                right: '4px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                border: 'none',
                                background: isListening ? '#EF4444' : 'transparent',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isListening ? 'white' : '#6B7280'
                            }}
                        >
                            <Mic size={16} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    {status === "Ready" && !isPlaying && (
                        <button
                            onClick={handleStartTour}
                            style={{
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '10px 16px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Start Tour
                        </button>
                    )}

                    {isPlaying && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={handlePrev} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}><SkipBack size={14} /></button>
                            <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>
                                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button onClick={handleNext} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}><SkipForward size={14} /></button>
                            <button onClick={handleStopTour} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #ddd', background: '#FEE2E2', color: '#EF4444', cursor: 'pointer' }}><Square size={14} /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Safety Modal (Ported) */}
            {showSafetyModal && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        margin: '16px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Confirm click action?</p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button onClick={confirmAction} style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Yes</button>
                            <button onClick={cancelAction} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default VoiceInterface;
