import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import FloatingTrigger from './FloatingTrigger';
import VoiceInterface from './VoiceInterface';

const FloatingInterface: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

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

export default FloatingInterface;
