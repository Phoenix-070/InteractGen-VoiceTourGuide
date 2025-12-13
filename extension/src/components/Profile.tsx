import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, ArrowLeft, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Auth/Logo';

interface ProfileProps {
    onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed", error);
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                boxSizing: 'border-box'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', color: '#4B5563', padding: '0'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: '600', color: '#111' }}>
                    Profile
                </h2>
                <div style={{ width: '20px' }} /> {/* Spacer for balance */}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Logo size={24} />

                <div style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: '#F9FAFB',
                    borderRadius: '16px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid #E5E7EB'
                }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', background: '#E5E7EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                    }}>
                        <UserCircle size={32} color="#9CA3AF" />
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>Signed in as</p>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', wordBreak: 'break-all', textAlign: 'center' }}>
                        {user?.email}
                    </p>
                </div>
            </div>

            <button
                onClick={handleLogout}
                disabled={isLoading}
                style={{
                    marginTop: 'auto',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                }}
            >
                <LogOut size={18} />
                {isLoading ? 'Signing Out...' : 'Sign Out'}
            </button>
        </motion.div>
    );
};

export default Profile;
