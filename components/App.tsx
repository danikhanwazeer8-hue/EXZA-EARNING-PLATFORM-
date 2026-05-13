
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { CryptoHeroScene, SecurityVaultScene } from './components/QuantumScene';
import { YieldComparisonChart, TierBenefitCards, SecurityFeaturesViz } from './components/Diagrams';
import { AuthModal } from './components/Auth';
import { UserDashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { 
  ArrowRight, Menu, X, ShieldCheck, TrendingUp, Lock, Globe, Cpu, 
  BarChart3, Zap, CheckCircle, LogOut, LayoutGrid
} from 'lucide-react';

const MetricCard = ({ label, value, subtext }: { label: string, value: string, subtext: string }) => (
  <div className="flex flex-col p-6 glass-panel rounded-2xl border border-exza-gold/10 hover:border-exza-gold/30 transition-all duration-300">
    <span className="text-exza-gold text-xs font-bold tracking-widest uppercase mb-1">{label}</span>
    <span className="text-3xl font-display font-bold text-white mb-2">{value}</span>
    <span className="text-stone-500 text-sm">{subtext}</span>
  </div>
);

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  date: string;
  address: string;
  screenshot?: string;
}

export interface UserData {
  username: string;
  email: string;
  tier: string;
  balance: number;
  referralCode: string;
  referrals: number;
  referralEarnings: number;
  referredBy?: string;
  nodes: any[];
  transactions: Transaction[];
}

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [view, setView] = useState<'landing' | 'dashboard' | 'admin'>('landing');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const savedUser = localStorage.getItem('exza_current_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (!u.transactions) u.transactions = [];
        setCurrentUser(u);
        setView(u.email === 'admin@exza.com' ? 'admin' : 'dashboard');
      } catch (e) {
        console.error("Session corruption detected", e);
        localStorage.removeItem('exza_current_user');
      }
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthSuccess = (user: UserData) => {
    setCurrentUser(user);
    setView(user.email === 'admin@exza.com' ? 'admin' : 'dashboard');
  };

  const handleUpdateUser = (updatedUser: UserData) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('exza_current_user', JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem('exza_users') || '[]');
    const idx = users.findIndex((u: any) => u.email === updatedUser.email);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
      localStorage.setItem('exza_users', JSON.stringify(users));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('exza_current_user');
    setCurrentUser(null);
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-exza-dark text-stone-300 selection:bg-exza-gold selection:text-exza-dark font-sans">
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || view !== 'landing' ? 'bg-exza-dark/80 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-exza-gold rounded-xl flex items-center justify-center text-exza-dark font-display font-black text-xl shadow-[0_0_20px_rgba(197,160,89,0.3)]">E</div>
            <span className="font-display font-bold text-2xl tracking-tighter text-white">
              EXZA<span className="text-exza-gold">EARN</span>
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-xs font-bold tracking-[0.15em] uppercase text-stone-400">
            {currentUser ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView(currentUser.email === 'admin@exza.com' ? 'admin' : 'dashboard')}
                  className="flex flex-col items-end group"
                >
                  <span className="text-white font-black text-[10px] tracking-widest flex items-center gap-1 group-hover:text-exza-gold">
                    <LayoutGrid size={12}/> PORTAL
                  </span>
                  <span className="text-stone-500 text-[9px]">{currentUser.tier} Tier</span>
                </button>
                <button onClick={handleLogout} className="p-2.5 bg-white/5 text-stone-400 rounded-full hover:bg-white/10 transition-all border border-white/10"><LogOut size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="px-6 py-2.5 bg-exza-gold text-exza-dark rounded-full hover:bg-white transition-all shadow-lg font-black flex items-center gap-2">START EARNING <Zap size={14} fill="currentColor" /></button>
            )}
          </div>
        </div>
      </nav>
      <div className="pt-20">
        {view === 'landing' && (
          <div className="animate-fade-in">
            <header className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
              <CryptoHeroScene />
              <div className="relative z-10 container mx-auto px-6 text-center">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 border border-exza-gold/20 text-exza-gold text-[10px] tracking-[0.3em] uppercase font-black rounded-full backdrop-blur-md bg-exza-gold/5">
                  <ShieldCheck size={12} /> Institutional Grade Security
                </div>
                <h1 className="font-display text-6xl md:text-8xl lg:text-[10rem] font-bold leading-[0.85] mb-8 text-white tracking-tighter">QUANTUM <br/><span className="gold-gradient italic">EARNINGS</span></h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-stone-400 font-light leading-relaxed mb-12">Automated node deployments with fixed 30-day operational cycles and principal protection.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button onClick={() => currentUser ? setView('dashboard') : setIsAuthOpen(true)} className="px-10 py-5 bg-exza-gold text-exza-dark rounded-full font-black text-lg hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(197,160,89,0.3)]">{currentUser ? 'DASHBOARD' : 'OPEN ACCOUNT'} <ArrowRight size={20} /></button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-24">
                  <MetricCard label="Total Nodes" value="12,450" subtext="Global Hashrate" />
                  <MetricCard label="TVL Secured" value="$42M+" subtext="Locked in Contracts" />
                  <MetricCard label="ROI Speed" value="(30)" subtext="Fixed Interval (Days)" />
                  <MetricCard label="Status" value="Online" subtext="No Downtime" />
                </div>
              </div>
            </header>
          </div>
        )}
        {view === 'dashboard' && currentUser && <UserDashboard user={currentUser} onUpdate={handleUpdateUser} onLogout={handleLogout} />}
        {view === 'admin' && currentUser?.email === 'admin@exza.com' && <AdminPanel />}
      </div>
    </div>
  );
};

export default App;
