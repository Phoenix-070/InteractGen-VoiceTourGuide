import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FloatingTriggerProps {
    onClick: () => void;
}

const FloatingTrigger: React.FC<FloatingTriggerProps> = ({ onClick }) => {
    return (
        <motion.button
            layoutId="interactgen-container"
            onClick={onClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#1f2937', // Dark gray
                border: '2px solid #374151',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2147483647,
                padding: 0,
            }}
        >
            <Sparkles size={28} color="#facc15" fill="#facc15" />
        </motion.button>
    );
};

export default FloatingTrigger;
