/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { CryptoHeroScene, SecurityVaultScene } from './components/QuantumScene';
import { YieldComparisonChart, SecurityFeaturesViz, TierBenefitCards, TVLGrowthChart } from './components/Diagrams';
import { AuthModal } from './components/Auth';
import UserDashboard from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { 
  ArrowRight, ShieldCheck, TrendingUp, Lock, Globe, Cpu, 
  Zap, CheckCircle, LogOut, LayoutGrid
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
            <main>
              <section className="py-32 border-t border-white/5 bg-exza-dark">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="p-8 glass-panel rounded-3xl border border-white/5 hover:border-exza-gold/20 transition-all group">
                        <div className="w-14 h-14 bg-exza-gold/10 rounded-2xl flex items-center justify-center text-exza-gold mb-6 group-hover:scale-110 transition-transform"><Lock size={28} /></div>
                        <h3 className="font-display text-2xl font-bold text-white mb-4">Node Ownership</h3>
                        <p className="text-stone-400 leading-relaxed">EXZA EARN ownership of cloud hashrate. Transfer or sell your nodes on the secondary market anytime.</p>
                    </div>
                    <div className="p-8 glass-panel rounded-3xl border border-white/5 hover:border-exza-gold/20 transition-all group">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform"><TrendingUp size={28} /></div>
                        <h3 className="font-display text-2xl font-bold text-white mb-4">Direct Payouts</h3>
                        <p className="text-stone-400 leading-relaxed">No manual claiming. Profits are settled into your account every 24 hours automatically.</p>
                    </div>
                    <div className="p-8 glass-panel rounded-3xl border border-white/5 hover:border-exza-gold/20 transition-all group">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform"><Globe size={28} /></div>
                        <h3 className="font-display text-2xl font-bold text-white mb-4">Scalable Team</h3>
                        <p className="text-stone-400 leading-relaxed">Leverage the network effect. Earn residual rewards on all node purchases within your 3-tier team.</p>
                    </div>
                  </div>
                </div>
              </section>
              <section id="yields" className="py-32 bg-exza-slate relative overflow-hidden">
                  <div className="container mx-auto px-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-20">
                          <div>
                              <div className="inline-block mb-4 text-exza-gold text-xs font-black tracking-widest uppercase">Performance</div>
                              <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">Elite EXZA EARN <br/><span className="text-exza-gold">Earning Power.</span></h2>
                              <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white font-medium"><div className="p-1 bg-exza-gold/20 rounded-full text-exza-gold"><CheckCircle size={16}/></div>Up to 2.2% Daily Yield</li>
                                <li className="flex items-center gap-3 text-white font-medium"><div className="p-1 bg-exza-gold/20 rounded-full text-exza-gold"><CheckCircle size={16}/></div>Low Withdrawal Fees (1.5%)</li>
                                <li className="flex items-center gap-3 text-white font-medium"><div className="p-1 bg-exza-gold/20 rounded-full text-exza-gold"><CheckCircle size={16}/></div>Full Node Liquidity</li>
                              </ul>
                          </div>
                          <div><YieldComparisonChart /></div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                          <div className="order-2 lg:order-1"><TVLGrowthChart /></div>
                          <div className="order-1 lg:order-2">
                              <div className="inline-block mb-4 text-emerald-500 text-xs font-black tracking-widest uppercase">Ecosystem Growth</div>
                              <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">Unprecedented <br/><span className="text-emerald-500">Capital Inflow.</span></h2>
                              <p className="text-stone-400 text-lg leading-relaxed mb-8">Institutional investors are rapidly migrating to EXZA EARN. Our Total Value Locked (TVL) has grown by over 400% in the last two quarters, demonstrating immense trust in our secure node infrastructure.</p>
                              <div className="flex items-center gap-6">
                                  <div>
                                      <p className="text-3xl font-display font-bold text-white">$58M+</p>
                                      <p className="text-xs text-stone-500 uppercase tracking-widest font-black">Current TVL</p>
                                  </div>
                                  <div className="w-px h-12 bg-white/10"></div>
                                  <div>
                                      <p className="text-3xl font-display font-bold text-emerald-400">+400%</p>
                                      <p className="text-xs text-stone-500 uppercase tracking-widest font-black">6-Month Growth</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>
              <section id="security" className="py-32 bg-exza-dark">
                <div className="container mx-auto px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-square glass-panel rounded-[3rem] overflow-hidden border border-white/5 flex items-center justify-center p-8"><SecurityVaultScene /></div>
                    <SecurityFeaturesViz />
                  </div>
                </div>
              </section>

              {/* Tiers */}
              <section id="tiers" className="py-32 bg-exza-slate relative">
                  <div className="container mx-auto px-6">
                      <div className="text-center mb-16">
                          <div className="inline-block mb-3 text-xs font-black tracking-widest text-exza-gold uppercase">Membership</div>
                          <h2 className="font-display text-4xl font-bold text-white mb-4 uppercase tracking-tighter">Tiered Benefits</h2>
                          <p className="text-stone-500 max-w-2xl mx-auto">Elevate your earning potential with our institutional tiers.</p>
                      </div>
                      <TierBenefitCards />
                  </div>
              </section>

              {/* Roadmap */}
              <section id="roadmap" className="py-32 bg-exza-dark relative">
                  <div className="container mx-auto px-6">
                      <div className="text-center mb-16">
                          <h2 className="font-display text-4xl font-bold text-white mb-4 uppercase tracking-tighter">Roadmap 2024</h2>
                          <div className="w-24 h-1 bg-exza-gold mx-auto rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {[
                              { q: "Q1", title: "Launch", items: ["Platform Launch", "Mobile Beta", "First Audit"] },
                              { q: "Q2", title: "Scale", items: ["Polygon Integration", "DeFi Partnerships", "Institutional Portal"] },
                              { q: "Q3", title: "Expand", items: ["Fiat On-ramp", "Insurance Expansion", "Solana Support"] },
                              { q: "Q4", title: "Future", items: ["Stock Tokenization", "Real Estate Portal", "Global Licenses"] }
                          ].map((step, idx) => (
                              <div key={idx} className="p-8 glass-panel rounded-2xl border border-white/5 hover:bg-white/5 transition-colors">
                                  <span className="text-exza-gold text-2xl font-display font-black mb-2 block">{step.q}</span>
                                  <h4 className="text-white font-bold mb-4">{step.title}</h4>
                                  <ul className="space-y-2">
                                      {step.items.map((item, i) => (
                                          <li key={i} className="text-stone-500 text-sm flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 bg-exza-gold rounded-full"></div> {item}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  </div>
              </section>

              {/* Business Model */}
              <section id="business-model" className="py-32 bg-exza-dark relative">
                  <div className="container mx-auto px-6">
                      <div className="text-center mb-16">
                          <div className="inline-block mb-3 text-xs font-black tracking-widest text-exza-gold uppercase">Transparency</div>
                          <h2 className="font-display text-4xl font-bold text-white mb-4 uppercase tracking-tighter">Business Model</h2>
                          <p className="text-stone-500 max-w-2xl mx-auto">How we generate sustainable, institutional-grade yields.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="glass-panel p-10 rounded-3xl border border-white/5">
                              <h3 className="text-2xl font-display font-bold text-white mb-6">Revenue Streams</h3>
                              <ul className="space-y-6">
                                  <li className="flex items-start gap-4">
                                      <div className="p-2 bg-exza-gold/10 rounded-lg text-exza-gold mt-1"><TrendingUp size={20} /></div>
                                      <div>
                                          <h4 className="text-white font-bold">Yield Spread</h4>
                                          <p className="text-stone-400 text-sm">Capitalizing on the difference between institutional and retail rates.</p>
                                      </div>
                                  </li>
                                  <li className="flex items-start gap-4">
                                      <div className="p-2 bg-exza-gold/10 rounded-lg text-exza-gold mt-1"><Zap size={20} /></div>
                                      <div>
                                          <h4 className="text-white font-bold">Trading Fees</h4>
                                          <p className="text-stone-400 text-sm">A nominal 0.1% fee on high-frequency institutional transactions.</p>
                                      </div>
                                  </li>
                                  <li className="flex items-start gap-4">
                                      <div className="p-2 bg-exza-gold/10 rounded-lg text-exza-gold mt-1"><ShieldCheck size={20} /></div>
                                      <div>
                                          <h4 className="text-white font-bold">Premium Features</h4>
                                          <p className="text-stone-400 text-sm">Advanced analytics and API access for institutional clients.</p>
                                      </div>
                                  </li>
                              </ul>
                          </div>
                          <div className="glass-panel p-10 rounded-3xl border border-white/5">
                              <h3 className="text-2xl font-display font-bold text-white mb-6">Transparency Promise</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                      <h4 className="text-exza-gold font-black text-xl mb-2">Monthly</h4>
                                      <p className="text-stone-400 text-sm">Comprehensive audit reports published to all members.</p>
                                  </div>
                                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                      <h4 className="text-exza-gold font-black text-xl mb-2">Quarterly</h4>
                                      <p className="text-stone-400 text-sm">Detailed financial disclosures and performance metrics.</p>
                                  </div>
                                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                      <h4 className="text-exza-gold font-black text-xl mb-2">Annual</h4>
                                      <p className="text-stone-400 text-sm">Third-party verification by top-tier accounting firms.</p>
                                  </div>
                                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                      <h4 className="text-exza-gold font-black text-xl mb-2">24/7</h4>
                                      <p className="text-stone-400 text-sm">Real-time wallet visibility and proof of reserves.</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Partnerships & About */}
              <section id="about" className="py-32 bg-exza-slate relative">
                  <div className="container mx-auto px-6">
                      <div className="mb-24">
                          <div className="text-center mb-12">
                              <h2 className="font-display text-3xl font-bold text-white mb-4 uppercase tracking-tighter">Strategic Alliances</h2>
                              <p className="text-stone-500">Backed by industry-leading infrastructure and security partners.</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                              {['Chainalysis', 'Fireblocks', 'CoinMarketCap', 'Binance Cloud', 'Ledger Enterprise'].map((partner, i) => (
                                  <div key={i} className="text-xl md:text-2xl font-display font-black text-white tracking-widest uppercase flex items-center gap-2">
                                      <ShieldCheck size={24} className="text-exza-gold" /> {partner}
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="text-center mb-16">
                          <h2 className="font-display text-4xl font-bold text-white mb-4 uppercase tracking-tighter">Leadership Team</h2>
                          <div className="w-24 h-1 bg-exza-gold mx-auto rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                          {[
                              { role: "CEO", desc: "Former Goldman Sachs MD (15+ years finance)" },
                              { role: "CTO", desc: "Ex-Google blockchain lead" },
                              { role: "CSO", desc: "Cybersecurity expert (ex-Palo Alto)" },
                              { role: "COO", desc: "Fintech serial entrepreneur" }
                          ].map((leader, idx) => (
                              <div key={idx} className="p-8 glass-panel rounded-2xl border border-white/5 text-center hover:border-exza-gold/30 transition-colors">
                                  <div className="w-16 h-16 mx-auto bg-exza-gold/10 rounded-full flex items-center justify-center text-exza-gold mb-4">
                                      <Lock size={28} />
                                  </div>
                                  <h4 className="text-white font-bold text-xl mb-2">{leader.role}</h4>
                                  <p className="text-stone-400 text-sm">{leader.desc}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </section>
            </main>
          </div>
        )}
        {view === 'dashboard' && currentUser && <UserDashboard user={currentUser} onUpdate={handleUpdateUser} onLogout={handleLogout} />}
        {view === 'admin' && currentUser?.email === 'admin@exza.com' && <AdminPanel onLogout={handleLogout} />}
      </div>
      <footer className="bg-exza-slate border-t border-white/5 py-24">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-exza-gold rounded-lg flex items-center justify-center text-exza-dark font-display font-black text-sm">E</div>
              <span className="font-display font-bold text-xl text-white">EXZA EARN</span>
          </div>
          <p className="text-sm text-stone-500 max-w-lg mx-auto mb-8">Empowering the next generation of digital asset owners through sustainable node ecosystems.</p>
          <div className="text-[10px] text-stone-600 uppercase font-black tracking-widest">&copy; 2024 EXZA EARN Platforms • Institutional Node Infrastructure</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
