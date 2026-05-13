/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Eye, CheckCircle, BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- TVL GROWTH CHART ---
export const TVLGrowthChart: React.FC = () => {
    const data = [
        { name: 'Jan', tvl: 12 },
        { name: 'Feb', tvl: 18 },
        { name: 'Mar', tvl: 25 },
        { name: 'Apr', tvl: 32 },
        { name: 'May', tvl: 42 },
        { name: 'Jun', tvl: 58 },
    ];

    return (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative h-[400px] flex flex-col">
            <h3 className="text-white font-display font-bold text-xl mb-2 flex items-center gap-2">
                <Activity className="text-emerald-500" size={20} /> Total Value Locked (TVL)
            </h3>
            <p className="text-stone-500 text-sm mb-8">Platform growth over the last 6 months (in Millions USD)</p>
            
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#78716c" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}M`} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0A0A0B', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '12px' }}
                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                            formatter={(value: number) => [`$${value}M`, 'TVL']}
                        />
                        <Area type="monotone" dataKey="tvl" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTvl)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- YIELD COMPARISON CHART ---
export const YieldComparisonChart: React.FC = () => {
    const data = [
        { name: "Trad. Bank", value: 0.1, color: "bg-stone-700" },
        { name: "Exza Earn", value: 12.5, color: "bg-exza-gold" },
        { name: "Top Competitor", value: 8.2, color: "bg-stone-500" }
    ];

    return (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
            <h3 className="text-white font-display font-bold text-xl mb-2 flex items-center gap-2">
                <BarChart3 className="text-exza-gold" size={20} /> Competitive Advantage
            </h3>
            <p className="text-stone-500 text-sm mb-8">Average annual percentage yield for Stablecoins (USDT/USDC)</p>
            
            <div className="space-y-6">
                {data.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className={`text-xs font-bold uppercase tracking-widest ${item.name === 'Exza Earn' ? 'text-exza-gold' : 'text-stone-400'}`}>
                                {item.name}
                            </span>
                            <span className={`text-lg font-display font-bold ${item.name === 'Exza Earn' ? 'text-white' : 'text-stone-500'}`}>
                                {item.value}% APY
                            </span>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(item.value / 15) * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.2 }}
                                className={`h-full ${item.color} rounded-full relative`}
                            >
                                {item.name === 'Exza Earn' && (
                                    <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-10 p-4 bg-exza-gold/5 rounded-2xl border border-exza-gold/10 flex items-center justify-between">
                <div>
                    <span className="text-[10px] text-exza-gold uppercase font-black block">Yield Forecast</span>
                    <span className="text-white font-bold text-sm">$10,000 earns $1,250/year</span>
                </div>
                <TrendingUp className="text-exza-gold" size={24} />
            </div>
        </div>
    );
};

// --- SECURITY FEATURES VISUALIZER ---
export const SecurityFeaturesViz: React.FC = () => {
    const features = [
        { icon: Shield, title: "256-Bit Encryption", desc: "Military grade data protection." },
        { icon: Eye, title: "Real-Time Monitoring", desc: "24/7 automated risk management." },
        { icon: CheckCircle, title: "KYC/AML Compliant", desc: "Global regulatory alignment." }
    ];

    return (
        <div className="space-y-4">
            {features.map((f, idx) => (
                <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 glass-panel rounded-2xl border border-white/5 flex items-start gap-5 group hover:border-exza-gold/30 transition-all cursor-default"
                >
                    <div className="w-12 h-12 rounded-xl bg-exza-gold/10 flex items-center justify-center text-exza-gold group-hover:scale-110 transition-transform">
                        <f.icon size={24} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">{f.title}</h4>
                        <p className="text-stone-500 text-sm">{f.desc}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// --- TIER BENEFIT CARDS ---
export const TierBenefitCards: React.FC = () => {
    const tiers = [
        { name: "BASIC", min: "$100", apy: "Standard", color: "text-stone-400" },
        { name: "GOLD", min: "$50,000", apy: "+1.5% APY", color: "text-exza-gold", featured: true },
        { name: "PLATINUM", min: "$250,000", apy: "+2.5% APY", color: "text-white" }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tiers.map((tier, idx) => (
                <div 
                    key={idx} 
                    className={`relative p-8 glass-panel rounded-[2rem] border transition-all duration-500 ${tier.featured ? 'border-exza-gold ring-4 ring-exza-gold/10 scale-105 z-10' : 'border-white/5 hover:border-white/20'}`}
                >
                    {tier.featured && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-exza-gold text-exza-dark px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                            MOST POPULAR
                        </div>
                    )}
                    <div className={`text-xs font-black tracking-[0.3em] mb-4 ${tier.color}`}>{tier.name} MEMBER</div>
                    <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-white text-4xl font-display font-bold">{tier.min}</span>
                        <span className="text-stone-500 text-xs">MINIMUM</span>
                    </div>
                    
                    <ul className="space-y-4 mb-10">
                        <li className="flex items-center gap-3 text-stone-400 text-sm">
                            <CheckCircle size={14} className="text-exza-gold" /> Standard Yield Optimization
                        </li>
                        <li className="flex items-center gap-3 text-stone-400 text-sm font-bold">
                            <CheckCircle size={14} className="text-exza-gold" /> {tier.apy} Boost
                        </li>
                        <li className="flex items-center gap-3 text-stone-400 text-sm">
                            <CheckCircle size={14} className="text-exza-gold" /> No Withdrawal Fees
                        </li>
                        {tier.name === 'PLATINUM' && (
                            <li className="flex items-center gap-3 text-stone-400 text-sm italic">
                                <CheckCircle size={14} className="text-exza-gold" /> Dedicated Account Manager
                            </li>
                        )}
                    </ul>
                    
                    <button className={`w-full py-4 rounded-xl font-bold transition-all ${tier.featured ? 'bg-exza-gold text-exza-dark hover:shadow-[0_0_20px_rgba(197,160,89,0.4)]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                        SELECT TIER
                    </button>
                </div>
            ))}
        </div>
    );
};
