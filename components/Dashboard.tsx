/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, TrendingUp, Cpu, Award, Star, X, 
  ArrowUpRight, Bot, MessageSquare, Clock, ShieldCheck, 
  Check, LogOut, User as UserIcon, Copy, Network, Users, Crown, Lock
} from 'lucide-react';
import { UserData } from '../App';
import { GoogleGenAI } from "@google/genai";

const EXZA_EARN_PACKAGES = [
  { id: 1, name: 'Core Node', price: 50, ratio: '1.0x', dailyPct: 1.0, color: 'from-stone-500 to-stone-400', icon: Cpu },
  { id: 2, name: 'Silver Node', price: 100, ratio: '1.2x', dailyPct: 1.2, color: 'from-blue-400 to-cyan-500', icon: Star },
  { id: 3, name: 'Gold Node', price: 250, ratio: '1.5x', dailyPct: 1.5, color: 'from-amber-400 to-exza-gold', icon: Award },
  { id: 4, name: 'Platinum Node', price: 500, ratio: '1.8x', dailyPct: 1.8, color: 'from-indigo-500 to-purple-600', icon: ShieldCheck },
  { id: 5, name: 'Diamond Node', price: 1000, ratio: '2.0x', dailyPct: 2.0, color: 'from-rose-500 to-pink-600', icon: Star },
];

const NODE_DURATION_DAYS = 30;

export default function UserDashboard({ user, onUpdate, onLogout }: { user: UserData; onUpdate: (user: UserData) => void; onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMinting, setIsMinting] = useState(false);
  const [liveProfit, setLiveProfit] = useState<number>(0);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Wallet State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  const TRC20_WALLET = "TA3ivK6DMeKbsdsUPnApcd6fU8pLF778jf";
  const BEP20_WALLET = "0x3a1eddc8b626b83247de8edf85e1f850b5ef02b5";

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Address copied to clipboard!");
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'DEPOSIT' as const,
      amount,
      status: 'PENDING' as const,
      date: new Date().toISOString(),
      address: depositAddress,
      screenshot: depositScreenshot || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80'
    };
    onUpdate({
      ...user,
      transactions: [newTx, ...(user.transactions || [])]
    });
    setDepositAmount('');
    setDepositAddress('');
    setDepositScreenshot('');
    alert('Deposit request submitted for review.');
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > user.balance) {
      alert('Insufficient balance.');
      return;
    }
    const newTx = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'WITHDRAWAL' as const,
      amount,
      status: 'PENDING' as const,
      date: new Date().toISOString(),
      address: withdrawAddress
    };
    onUpdate({
      ...user,
      transactions: [newTx, ...(user.transactions || [])]
    });
    setWithdrawAmount('');
    setWithdrawAddress('');
    alert('Withdrawal request submitted for review.');
  };

  // --- NODE EXPIRY MONITOR (RESTORED & IMPROVED) ---
  useEffect(() => {
    const checkExpirations = () => {
      const now = Date.now();
      let hasExpired = false;
      let totalRefund = 0;
      const nodes = user.nodes || [];
      
      const updatedNodes = nodes.filter(node => {
        const purchaseTime = new Date(node.purchaseDate).getTime();
        const ageInDays = (now - purchaseTime) / (1000 * 60 * 60 * 24);
        
        if (ageInDays >= NODE_DURATION_DAYS) {
          hasExpired = true;
          totalRefund += node.price;
          return false;
        }
        return true;
      });

      if (hasExpired) {
        onUpdate({
          ...user,
          balance: user.balance + totalRefund,
          nodes: updatedNodes
        });
      }
    };

    const interval = setInterval(checkExpirations, 10000); 
    return () => clearInterval(interval);
  }, [user, onUpdate]);

  const dailyTotal = useMemo(() => {
    return user.nodes?.reduce((acc, curr) => acc + (curr.price * curr.dailyPct / 100), 0) || 0;
  }, [user.nodes]);

  useEffect(() => {
    if (dailyTotal <= 0) return;
    const increment = dailyTotal / 86400;
    const interval = setInterval(() => {
      setLiveProfit(prev => prev + increment);
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyTotal]);

  const handleMint = async (pkg: typeof EXZA_EARN_PACKAGES[0]) => {
    if (user.balance < pkg.price) {
      alert(`Insufficient balance. You need $${pkg.price} USDT.`);
      return;
    }
    
    setIsMinting(true);
    await new Promise(r => setTimeout(r, 1500));
    
    onUpdate({
      ...user,
      balance: user.balance - pkg.price,
      nodes: [...(user.nodes || []), { 
        ...pkg, 
        purchaseDate: new Date().toISOString(), 
        status: 'Active' 
      }]
    });
    setIsMinting(false);
  };

  // --- GEMINI AI CHATBOT (RESTORED WITH SECURITY CONTEXT) ---
  const handleAiChat = async () => {
    if (!aiMessage.trim()) return;
    
    const prompt = aiMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);
    setAiMessage('');
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are the EXZA EARN Quantum AI Support. Act as a financial expert and advisor.
          Platform Integrity Rules:
          - User: ${user.username}
          - Current Wallet: $${user.balance} USDT
          - Active Infrastructure: ${user.nodes?.length || 0} Nodes
          
          Technical Context:
          - Each node has a mandatory 30-day operation cycle.
          - Upon 30-day expiry, the node is decommissioned and 100% of the principal (cost) is refunded to the user balance.
          - Withdrawals processed via institutional audit within 24 hours.
          - Security: AES-256 encryption.
          
          Response Style: Direct, high-tech, reassuring, and professional financial expert. Always refer to balance as "Liquid Capital" or "USDT Assets".`
        }
      });
      
      const text = response.text || "Decryption error in Quantum module. Re-establishing link...";
      setChatHistory(prev => [...prev, { role: 'bot', text }]);
    } catch (e) {
      console.error("Quantum Link Failure:", e);
      setChatHistory(prev => [...prev, { role: 'bot', text: "Quantum connection interrupted. Please ensure your protocol key (API_KEY) is valid in the server configuration." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(NODE_DURATION_DAYS - diff));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Floating AI Chatbot Bubble */}
      <div className="fixed bottom-8 right-8 z-[200]">
        <AnimatePresence>
          {isAiOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="absolute bottom-20 right-0 w-80 h-[450px] glass-panel rounded-[2rem] border border-exza-gold/30 shadow-2xl flex flex-col overflow-hidden">
               <div className="p-4 bg-exza-gold text-exza-dark font-black text-[10px] uppercase tracking-widest flex justify-between items-center">
                  <div className="flex items-center gap-2"><Bot size={14}/> Quantum AI Support</div>
                  <button onClick={() => setIsAiOpen(false)}><X size={14}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-[10px] bg-white/5 p-3 rounded-xl border border-white/10 italic text-stone-400">
                    Portfolio authenticated. Analyzing node metrics for {user.username}...
                  </div>
                  {chatHistory.map((chat, i) => (
                    <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] ${chat.role === 'user' ? 'bg-exza-gold text-exza-dark font-bold' : 'bg-white/5 text-stone-300 border border-white/10'}`}>
                          {chat.text}
                       </div>
                    </div>
                  ))}
                  {isAiLoading && <div className="text-exza-gold animate-pulse text-[10px] uppercase font-black px-2">Synchronizing with Node Cluster...</div>}
               </div>
               <div className="p-3 border-t border-white/10 bg-black/20">
                  <div className="flex gap-2">
                    <input 
                      value={aiMessage} 
                      onChange={e => setAiMessage(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleAiChat()} 
                      placeholder="Ask Quantum AI..." 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] outline-none focus:border-exza-gold/50 text-white" 
                    />
                    <button onClick={handleAiChat} className="p-2 bg-exza-gold text-exza-dark rounded-xl hover:scale-105 transition-transform">
                      <ArrowUpRight size={14}/>
                    </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsAiOpen(!isAiOpen)} className="w-14 h-14 bg-exza-gold text-exza-dark rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all shadow-exza-gold/20">
           {isAiOpen ? <X size={24}/> : <MessageSquare size={24}/>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-6 rounded-3xl border border-exza-gold/20 bg-gradient-to-br from-exza-dark to-stone-900 shadow-xl">
          <Wallet className="text-exza-gold mb-4" size={24} />
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Available USDT</p>
          <p className="text-3xl font-display font-bold text-white">${user.balance.toLocaleString()}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
          <TrendingUp className="text-emerald-500 mb-4" size={24} />
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Cycle Yields</p>
          <p className="text-3xl font-display font-bold text-emerald-400">+${liveProfit.toFixed(6)}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
          <Cpu className="text-blue-500 mb-4" size={24} />
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Active Nodes</p>
          <p className="text-3xl font-display font-bold text-white">{user.nodes?.length || 0}</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5">
          <Award className="text-purple-500 mb-4" size={24} />
          <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Network Tier</p>
          <p className="text-3xl font-display font-bold text-white">{user.tier}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
        {['overview', 'marketplace', 'wallet', 'network', 'settings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-exza-gold text-exza-dark shadow-lg' : 'text-stone-500 hover:text-white'}`}>{tab}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'network' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div>
                  <Users className="text-exza-gold mb-4" size={24} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Total Referrals</p>
                </div>
                <p className="text-3xl font-display font-bold text-white mt-4">{user.referrals || 0}</p>
              </div>
              <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div>
                  <TrendingUp className="text-emerald-500 mb-4" size={24} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Network Earnings</p>
                </div>
                <p className="text-3xl font-display font-bold text-emerald-400">${(user.referralEarnings || 0).toLocaleString()}</p>
              </div>
              <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between">
                <div>
                  <Network className="text-blue-500 mb-4" size={24} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-stone-500">Your Referral Code</p>
                </div>
                <div className="mt-4 flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <code className="text-white font-mono text-sm">{user.referralCode}</code>
                  <button onClick={() => copyToClipboard(user.referralCode)} className="text-stone-400 hover:text-white transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <Network className="text-exza-gold" size={20} /> Commission Structure
              </h3>
              
              <div className="space-y-4">
                {/* Tier 1 */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold flex items-center gap-2">Tier 1 (Direct Referrals)</h4>
                    <p className="text-stone-500 text-sm">Standard commission on direct invites.</p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="flex items-baseline gap-2 md:justify-end">
                      <p className="text-3xl font-display font-bold text-emerald-400">5%</p>
                      {user.tier === 'Diamond' && <span className="text-exza-gold font-bold text-xl">+2%</span>}
                    </div>
                    {user.tier === 'Diamond' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-exza-gold font-black uppercase tracking-widest bg-exza-gold/10 px-2 py-1 rounded-md mt-1 border border-exza-gold/20">
                        <Crown size={12} /> Legacy Bonus Active
                      </span>
                    ) : (
                      <span className="inline-block text-[10px] text-stone-500 font-black uppercase tracking-widest mt-1">
                        Diamond Tier unlocks +2% Legacy Bonus
                      </span>
                    )}
                  </div>
                </div>

                {/* Tier 2 */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold">Tier 2 (Indirect)</h4>
                    <p className="text-stone-500 text-sm">Commission on your referrals' invites.</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-display font-bold text-emerald-400">3%</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md mt-1 border border-amber-500/20">
                      <Lock size={12} /> Requires Gold NFT Tier
                    </span>
                  </div>
                </div>

                {/* Tier 3 */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold">Tier 3 (Extended)</h4>
                    <p className="text-stone-500 text-sm">Commission on deep network growth.</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-3xl font-display font-bold text-emerald-400">1%</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-md mt-1 border border-amber-500/20">
                      <Lock size={12} /> Requires Gold NFT Tier
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-exza-dark to-exza-slate">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-display font-bold text-white flex items-center gap-2"><Cpu className="text-exza-gold" size={20} /> Active Node Infrastructure</h3>
                <span className="text-[9px] font-black text-stone-500 uppercase">Fixed 30-Day Cycles</span>
              </div>
              
              {!user.nodes || user.nodes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                   <p className="text-stone-600 font-bold uppercase text-xs">No Active Deployments</p>
                   <button onClick={() => setActiveTab('marketplace')} className="mt-4 text-exza-gold text-[10px] font-black uppercase hover:underline">Deploy First Node</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.nodes.map((node, i) => {
                    const daysLeft = getDaysRemaining(node.purchaseDate);
                    const progress = ((NODE_DURATION_DAYS - daysLeft) / NODE_DURATION_DAYS) * 100;
                    const NodeIcon = EXZA_EARN_PACKAGES.find(p => p.id === node.id)?.icon || Cpu;
                    return (
                      <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-3 rounded-xl bg-gradient-to-br ${node.color} text-white`}><NodeIcon size={20}/></div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-exza-gold uppercase tracking-widest">{node.ratio} Power</p>
                              <p className="text-[8px] text-stone-500 flex items-center gap-1 justify-end mt-1"><Clock size={10}/> {daysLeft}D Left</p>
                           </div>
                        </div>
                        <h4 className="text-white font-bold mb-4">{node.name}</h4>
                        <div className="w-full h-1 bg-white/5 rounded-full mb-4">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-exza-gold" />
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[8px] uppercase text-stone-500">Daily Payout</p>
                              <p className="text-emerald-400 font-display font-bold">${(node.price * node.dailyPct / 100).toFixed(2)}</p>
                           </div>
                           <div className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase">Hashing</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'marketplace' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {EXZA_EARN_PACKAGES.map((pkg) => (
              <div key={pkg.id} className="glass-panel rounded-3xl border border-white/10 overflow-hidden group hover:border-exza-gold/50 transition-all flex flex-col">
                <div className={`h-24 bg-gradient-to-br ${pkg.color} p-4 flex flex-col justify-end`}>
                   <h4 className="text-white font-bold text-sm uppercase tracking-widest">{pkg.name}</h4>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px]"><span className="text-stone-500">Price</span><span className="text-white font-bold">${pkg.price} USDT</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-stone-500">Daily</span><span className="text-emerald-400 font-bold">{pkg.dailyPct}% Rate</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-stone-500">Cycle</span><span className="text-white font-bold">30 Days</span></div>
                   </div>
                   <button disabled={isMinting} onClick={() => handleMint(pkg)} className="w-full py-4 bg-exza-gold text-exza-dark rounded-xl font-black text-[10px] uppercase shadow-lg shadow-exza-gold/10 hover:scale-[1.02] transition-transform">
                      {isMinting ? 'Initializing...' : `Deploy $${pkg.price}`}
                   </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'wallet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Section */}
              <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2"><ArrowUpRight className="text-emerald-500" /> Deposit USDT</h3>
                
                {/* Official Wallet Address Display */}
                <div className="mb-6 space-y-4">
                  <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">USDT Deposit Address (TRC20)</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-emerald-400 font-mono text-sm break-all">{TRC20_WALLET}</code>
                      <button onClick={() => copyToClipboard(TRC20_WALLET)} className="p-2 bg-white/5 hover:bg-emerald-500/20 text-stone-400 hover:text-emerald-400 rounded-xl transition-all">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 bg-black/40 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">USDT Deposit Address (BEP20)</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-emerald-400 font-mono text-sm break-all">{BEP20_WALLET}</code>
                      <button onClick={() => copyToClipboard(BEP20_WALLET)} className="p-2 bg-white/5 hover:bg-emerald-500/20 text-stone-400 hover:text-emerald-400 rounded-xl transition-all">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={16} />
                    <p className="text-[10px] text-emerald-500/80 uppercase font-black tracking-widest leading-relaxed">
                      Send only USDT (TRC20 or BEP20) to these addresses. After sending, fill out the form below to verify your deposit.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Amount Sent (USDT)</label>
                    <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Sender Wallet Address</label>
                    <input type="text" value={depositAddress} onChange={e => setDepositAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50" placeholder="0x..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Screenshot URL (Optional)</label>
                    <input type="text" value={depositScreenshot} onChange={e => setDepositScreenshot(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50" placeholder="https://..." />
                  </div>
                  <button onClick={handleDeposit} className="w-full py-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Submit Deposit</button>
                </div>
              </div>

              {/* Withdraw Section */}
              <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2"><ArrowUpRight className="text-blue-500 rotate-180" /> Withdraw USDT</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Amount (USDT)</label>
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 block mb-2">Destination Wallet Address</label>
                    <input type="text" value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50" placeholder="0x..." />
                  </div>
                  <button onClick={handleWithdraw} className="w-full py-4 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all mt-auto">Submit Withdrawal</button>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <h3 className="text-xl font-display font-bold text-white mb-6">Transaction History</h3>
              {(!user.transactions || user.transactions.length === 0) ? (
                <p className="text-stone-500 text-sm text-center py-8">No transactions found.</p>
              ) : (
                <div className="space-y-4">
                  {user.transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {tx.type === 'DEPOSIT' ? <ArrowUpRight size={20} /> : <ArrowUpRight size={20} className="rotate-180" />}
                        </div>
                        <div>
                          <p className="text-white font-bold">{tx.type}</p>
                          <p className="text-[10px] text-stone-500 font-mono">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-display font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'text-emerald-500' : tx.status === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto space-y-6">
              <div className="glass-panel p-12 rounded-[3rem] text-center border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-exza-gold/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-exza-dark rounded-full flex items-center justify-center text-exza-gold mx-auto mb-6 border-4 border-exza-gold/20 shadow-xl"><UserIcon size={40} /></div>
                  <h3 className="text-3xl font-display font-bold text-white mb-2">{user.username}</h3>
                  <p className="text-stone-400 text-sm font-mono mb-2">{user.email}</p>
                  <span className="inline-block px-3 py-1 bg-exza-gold/10 text-exza-gold text-[10px] font-black uppercase tracking-widest rounded-full border border-exza-gold/20">
                    {user.tier} Tier
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                  <h4 className="text-white font-bold mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={20} /> Security Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-white font-bold text-sm">Two-Factor Authentication</p>
                        <p className="text-stone-500 text-xs mt-1">Secure your account with 2FA.</p>
                      </div>
                      <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors">Enable</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-white font-bold text-sm">Change Password</p>
                        <p className="text-stone-500 text-xs mt-1">Update your login credentials.</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-colors">Update</button>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                  <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Bot className="text-blue-500" size={20} /> Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-white font-bold text-sm">Email Notifications</p>
                        <p className="text-stone-500 text-xs mt-1">Receive yield & deposit alerts.</p>
                      </div>
                      <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div>
                        <p className="text-white font-bold text-sm">Active Sessions</p>
                        <p className="text-stone-500 text-xs mt-1">Manage connected devices.</p>
                      </div>
                      <button className="px-4 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-colors">Manage</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-red-400 font-bold">Session Management</h4>
                    <p className="text-stone-400 text-sm mt-1">Securely log out of your current session on this device.</p>
                  </div>
                  <button onClick={onLogout} className="w-full md:w-auto px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                    <LogOut size={16}/> Terminate Session
                  </button>
                </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
