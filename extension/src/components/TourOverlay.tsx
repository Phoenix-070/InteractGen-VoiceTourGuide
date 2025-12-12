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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [tourData, setTourData] = useState<any>(null);

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [userInput, setUserInput] = useState("");
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- Tour Logic ---
    const handleStartTour = async () => {
        setStatus("Scanning Page...");
        try {
            const elements = scanPage();
            console.log(`Scanned ${elements.length} elements`);
            if (elements.length === 0) {
                setStatus("No elements found");
                return;
            }

            setStatus(`Generating Tour (${elements.length} els)...`);

            const tour = await generateTour(document.title, elements);
            setTourData(tour);
            setStatus(`Ready to guide! (${tour.steps?.length || 0} steps)`);

            console.log("Tour Generated:", tour);
            // Auto-speak first step?
            // speak(tour.steps[0].narrative);

        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || "Unknown"}`);
        }
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
            handleSendMessage(transcript); // Auto-send on voice end?
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

        // Add User Message
        const newMessages: any[] = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setUserInput(""); // Clear input if it was manual

        try {
            // Get Context
            const elements = scanPage();

            // Call Backend
            const responseText = await sendChatMessage(text, document.title, elements);

            // Add Assistant Message
            setMessages([...newMessages, { role: 'assistant', text: responseText }]);

            // Speak Response
            speak(responseText);

        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'assistant', text: "Sorry, I encountered an error." }]);
        }
    };

    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
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
            zIndex: 2147483647, // Max Z
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
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '14px' }}>
                        👋 Hi! Ask me anything about this page.
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
                {/* Tour Controls (Mini) */}
                <div style={{ display: 'flex', marginBottom: '8px', gap: '8px' }}>
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
                </div>

                {/* Input Area */}
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
                        title="Voice Input"
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
        </div>
    );
};

export default TourOverlay;
