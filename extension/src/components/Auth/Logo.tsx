import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Logo: React.FC<{ size?: number }> = ({ size = 32 }) => {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '20px'
            }}
        >
            <div style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                padding: '12px',
                borderRadius: '16px',
                display: 'flex',
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
            }}>
                <Sparkles size={size} color="white" strokeWidth={2} />
            </div>
            <h1 style={{
                marginTop: '12px',
                fontSize: '20px',
                fontWeight: '700',
                background: 'linear-gradient(90deg, #1F2937 0%, #4B5563 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
            }}>
                NaviBot
            </h1>
        </motion.div>
    );
};

export default Logo;
