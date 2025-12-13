import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, Loader2 } from 'lucide-react';
import Logo from './Logo';

interface SignUpProps {
    onSwitch: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '32px 24px', textAlign: 'center', fontFamily: '"Inter", sans-serif' }}
        >
            <Logo />

            <h2 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600', color: '#374151' }}>Create Account</h2>
            <p style={{ marginBottom: '24px', fontSize: '13px', color: '#6B7280' }}>Join NaviBot today</p>

            {error && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', border: '1px solid #FECACA' }}
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px',
                            border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px',
                            backgroundColor: '#F9FAFB', transition: 'all 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                        required
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px',
                            border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px',
                            backgroundColor: '#F9FAFB', transition: 'all 0.2s', boxSizing: 'border-box'
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                        required
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: '12px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white', border: 'none', borderRadius: '12px', cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                    }}
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Sign Up <UserPlus size={16} /></>}
                </motion.button>
            </form>

            <div style={{ marginTop: '24px', fontSize: '13px', color: '#6B7280' }}>
                Already have an account? <motion.span whileHover={{ scale: 1.05 }} onClick={onSwitch} style={{ color: '#10B981', cursor: 'pointer', fontWeight: '600', display: 'inline-block' }}>Sign in here</motion.span>
            </div>
        </motion.div>
    );
};

export default SignUp;
