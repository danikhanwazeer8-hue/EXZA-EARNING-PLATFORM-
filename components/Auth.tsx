/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ShieldCheck, ArrowRight, ShieldAlert, Fingerprint, KeyRound } from 'lucide-react';
import { UserData } from '../App';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserData) => void;
}

export const AuthModal: React.FC<AuthProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [otpSessionData, setOtpSessionData] = useState<{hash: string, expires: number} | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-init admin
  useEffect(() => {
    const savedUsers = JSON.parse(localStorage.getItem('exza_users') || '[]');
    if (!savedUsers.find((u: any) => u.email === 'admin@exza.com')) {
      savedUsers.push({
        username: 'System Admin',
        email: 'admin@exza.com',
        password: 'admin123',
        tier: 'Platinum',
        balance: 1000000,
        referralCode: 'ADMIN-CORE',
        referrals: 150,
        referralEarnings: 0,
        nodes: [],
        transactions: []
      });
      localStorage.setItem('exza_users', JSON.stringify(savedUsers));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const savedUsers = JSON.parse(localStorage.getItem('exza_users') || '[]');
      
      if (isLogin) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // STRICT LOGIN CHECK
        const user = savedUsers.find((u: any) => 
          u.email.toLowerCase() === formData.email.toLowerCase() && 
          u.password === formData.password
        );
        
        if (user) {
          const { password, ...safeUser } = user;
          localStorage.setItem('exza_current_user', JSON.stringify(safeUser));
          onAuthSuccess(safeUser as UserData);
          onClose();
        } else {
          setError('Invalid institutional credentials.');
        }
      } else {
        // REGISTRATION FLOW
        if (step === 'details') {
          if (savedUsers.some((u: any) => u.email.toLowerCase() === formData.email.toLowerCase())) {
            setError('Credentials already exist in the node network.');
            setLoading(false);
            return;
          }

          // Send OTP
          const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
          });

          const data = await response.json();
          if (response.ok) {
            setOtpSessionData({ hash: data.hash, expires: data.expires });
            setStep('otp');
            setError('');
          } else {
            setError(data.error || 'Failed to send verification code.');
          }
        } else if (step === 'otp') {
          // Verify OTP
          const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: formData.email, 
              otp,
              hash: otpSessionData?.hash,
              expires: otpSessionData?.expires
            })
          });

          const data = await response.json();
          if (response.ok) {
            // Create user
            const newUser: UserData = {
              username: formData.username,
              email: formData.email,
              tier: 'Basic',
              balance: 0,
              referralCode: `EXZA-${Math.random().toString(36).substring(7).toUpperCase()}`,
              referrals: 0,
              referralEarnings: 0,
              nodes: [],
              transactions: []
            };

            const storageUser = { ...newUser, password: formData.password };
            savedUsers.push(storageUser);
            localStorage.setItem('exza_users', JSON.stringify(savedUsers));
            
            // Reset and switch to login
            setStep('details');
            setOtp('');
            setOtpSessionData(null);
            setIsLogin(true);
            setError('Account verified and created. Please sign in.');
          } else {
            setError(data.error || 'Invalid verification code.');
          }
        }
      }
    } catch (err) {
      setError('Internal security protocol failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-exza-dark/95 backdrop-blur-md" />
          
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md glass-panel rounded-[2.5rem] border border-exza-gold/20 p-8 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
               <div>
                  <h2 className="text-3xl font-display font-bold text-white">
                    {isLogin ? 'Sign In' : (step === 'otp' ? 'Verify Email' : 'Join Network')}
                  </h2>
                  <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest mt-1">
                    {step === 'otp' ? 'Enter the code sent to your email' : 'Institutional Auth Platform'}
                  </p>
               </div>
               <div className="p-3 bg-exza-gold/10 rounded-2xl text-exza-gold">
                  <Fingerprint size={24} />
               </div>
            </div>

            {error && (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`mb-6 p-4 border rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase ${error.includes('created') || error.includes('sent') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <ShieldAlert size={16} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(!isLogin && step === 'otp') ? (
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                  <input required type="text" placeholder="6-Digit Code" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-exza-gold/50 tracking-[0.5em] font-mono text-center" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} />
                </div>
              ) : (
                <>
                  {!isLogin && (
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                      <input required type="text" placeholder="Username" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-exza-gold/50" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                    <input required type="email" placeholder="Institutional Email" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-exza-gold/50" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" size={18} />
                    <input required type="password" placeholder="AES-256 Key" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-exza-gold/50" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </>
              )}

              <button disabled={loading} type="submit" className="w-full py-5 bg-exza-gold text-exza-dark rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-exza-gold/10 flex items-center justify-center gap-2">
                {loading ? <RefreshCw className="animate-spin" size={20}/> : (isLogin ? 'OPEN PORTAL' : (step === 'otp' ? 'VERIFY & JOIN' : 'INITIALIZE ACCOUNT'))}
                {!loading && <ShieldCheck size={18}/>}
              </button>
            </form>

            <button onClick={() => { setIsLogin(!isLogin); setStep('details'); setError(''); }} className="mt-8 w-full text-xs text-stone-500 hover:text-white uppercase font-black tracking-widest transition-all">
               {isLogin ? "Registration required? Join now" : "Returning member? Sign in"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
