import React from 'react';
import { motion } from 'framer-motion';

interface VoiceOrbProps {
    isActive: boolean; // e.g., creates more intense animation if true
    mode?: 'listening' | 'speaking' | 'processing' | 'idle';
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ mode = 'idle' }) => {
    // diverse colors for siri-like feel
    const variants = {
        idle: {
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
            transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const }
        },
        listening: {
            scale: [1, 1.2, 0.9, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const }
        },
        speaking: {
            scale: [1, 1.5, 1.2, 1.4, 1],
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ["50%", "40%", "50%", "40%", "50%"],
            transition: { repeat: Infinity, duration: 1, ease: "linear" as const }
        },
        processing: {
            scale: [1, 1.1, 1],
            rotate: [0, 360],
            transition: { repeat: Infinity, duration: 1, ease: "linear" as const }
        }
    };

    const getGradient = () => {
        switch (mode) {
            case 'listening': return 'conic-gradient(from 0deg, #ff0080, #7928ca, #ff0080)'; // Magenta/Purple
            case 'speaking': return 'conic-gradient(from 0deg, #00dfd8, #007cf0, #00dfd8)'; // Cyan/Blue
            case 'processing': return 'conic-gradient(from 0deg, #facc15, #f59e0b, #facc15)'; // Yellow/Amber
            default: return 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)'; // Indigo/Purple/Pink
        }
    };

    return (
        <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer Glow */}
            <motion.div
                animate={mode}
                variants={variants}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: getGradient(),
                    filter: 'blur(20px)',
                    opacity: 0.6
                }}
            />

            {/* Inner Core */}
            <motion.div
                animate={mode}
                variants={variants}
                style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    borderRadius: '50%',
                    background: getGradient(),
                    filter: 'blur(5px)',
                    zIndex: 2
                }}
            />

            {/* White Center */}
            <div style={{
                position: 'absolute',
                width: '40%',
                height: '40%',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                zIndex: 3,
                boxShadow: '0 0 10px rgba(255,255,255,0.8)'
            }} />
        </div>
    );
};

export default VoiceOrb;
