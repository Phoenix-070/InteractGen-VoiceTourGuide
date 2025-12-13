import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingTrigger from './FloatingTrigger';
import VoiceInterface from './VoiceInterface';
import { AuthProvider, useAuth } from '../context/AuthContext';
import SignIn from './Auth/SignIn';
import SignUp from './Auth/SignUp';

const FloatingContent: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, loading } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);

    if (loading) return null; // Or a spinner

    if (!user && isOpen) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{
                    position: 'fixed', bottom: '20px', right: '20px',
                    width: '320px', background: 'white', borderRadius: '24px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', zIndex: 2147483647,
                    fontFamily: '"Inter", sans-serif', overflow: 'hidden'
                }}
            >
                {isSignUp ? (
                    <SignUp onSwitch={() => setIsSignUp(false)} />
                ) : (
                    <SignIn onSwitch={() => setIsSignUp(true)} />
                )}
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        border: 'none', background: '#F3F4F6', borderRadius: '50%',
                        width: '24px', height: '24px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6B7280'
                    }}
                >×</button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {!isOpen ? (
                <FloatingTrigger key="trigger" onClick={() => setIsOpen(true)} />
            ) : (
                <VoiceInterface key="interface" onClose={() => setIsOpen(false)} />
            )}
        </AnimatePresence>
    );
};

const FloatingInterface: React.FC = () => {
    return (
        <AuthProvider>
            <FloatingContent />
        </AuthProvider>
    );
};

export default FloatingInterface;
