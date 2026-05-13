/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, DollarSign, Activity, Settings, 
  Pause, Play, AlertTriangle, ShieldCheck, 
  Trash2, Database, X, Save, CheckCircle2, 
  XCircle, Image as ImageIcon, ArrowUpRight, 
  ArrowDownLeft, Clock, Eye, Copy, ExternalLink, HardDrive,
  LogOut, Power, Wallet, Lock
} from 'lucide-react';
import { UserData, Transaction } from '../App';

interface ExtendedUserData extends UserData {
  password?: string;
  status?: 'Verified' | 'Pending' | 'Suspended';
}

interface PendingTx extends Transaction {
  userEmail: string;
  username: string;
}

export const AdminPanel: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'settings'>('users');
  const [systemActive, setSystemActive] = useState(true);
  const [users, setUsers] = useState<ExtendedUserData[]>([]);
  const [editingUser, setEditingUser] = useState<ExtendedUserData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [stats, setStats] = useState({
    tvl: 0,
    payouts: 0,
    users: 0,
    nodes: 0
  });

  const loadData = useCallback(() => {
    const savedUsers = JSON.parse(localStorage.getItem('exza_users') || '[]');
    setUsers(savedUsers);

    const totalBalance = savedUsers.reduce((acc: number, u: ExtendedUserData) => acc + (u.balance || 0), 0);
    const totalExzaValue = savedUsers.reduce((acc: number, u: ExtendedUserData) => 
      acc + ((u.nodes || []).reduce((nAcc: number, n: any) => nAcc + n.price, 0) || 0), 0);
    const totalNodes = savedUsers.reduce((acc: number, u: ExtendedUserData) => acc + ((u.nodes || []).length || 0), 0);
    const totalEarnings = savedUsers.reduce((acc: number, u: ExtendedUserData) => acc + (u.referralEarnings || 0), 0);

    setStats({
      tvl: totalBalance + totalExzaValue,
      payouts: totalEarnings,
      users: savedUsers.length,
      nodes: totalNodes
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allTxs = useMemo(() => {
    const txs: PendingTx[] = [];
    users.forEach(u => {
      (u.transactions || []).forEach(tx => {
        txs.push({ ...tx, userEmail: u.email, username: u.username });
      });
    });
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [users]);

  const handleTransactionAction = (txId: string, userEmail: string, action: 'APPROVE' | 'REJECT') => {
    const updatedUsers = users.map(u => {
      if (u.email === userEmail) {
        const updatedTxs = (u.transactions || []).map(tx => {
          if (tx.id === txId) {
            let finalStatus: 'COMPLETED' | 'FAILED' = action === 'APPROVE' ? 'COMPLETED' : 'FAILED';
            if (tx.type === 'DEPOSIT' && action === 'APPROVE') {
              u.balance += tx.amount;
            } else if (tx.type === 'WITHDRAWAL' && action === 'APPROVE') {
              if (u.balance >= tx.amount) {
                u.balance -= tx.amount;
              } else {
                finalStatus = 'FAILED';
                alert(`Cannot approve: User ${u.email} has insufficient balance.`);
              }
            }
            return { ...tx, status: finalStatus };
          }
          return tx;
        });
        return { ...u, transactions: updatedTxs };
      }
      return u;
    });

    localStorage.setItem('exza_users', JSON.stringify(updatedUsers));
    
    // Refresh admin view
    loadData();
    
    // Sync active session if admin is modifying themselves (rare) or just for data consistency
    const currentUserStr = localStorage.getItem('exza_current_user');
    if (currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      const target = updatedUsers.find(u => u.email === currentUser.email);
      if (target) {
        const { password, ...safeUser } = target;
        localStorage.setItem('exza_current_user', JSON.stringify(safeUser));
      }
    }
  };

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    alert("System: Wallet address copied to clipboard.");
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-exza-gold/20 rounded-2xl flex items-center justify-center text-exza-gold border border-exza-gold/30 shadow-2xl shadow-exza-gold/10">
              <ShieldCheck size={32} />
           </div>
           <div>
             <h2 className="text-4xl font-display font-bold text-white mb-2">Institutional Overlord</h2>
             <div className="flex items-center gap-4">
                <p className="text-stone-500 text-[10px] tracking-[0.3em] font-black uppercase">Root Command Access // v4.2.1-SECURE</p>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Encrypted DB Sync: Active
                </div>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSystemActive(!systemActive)}
            className={`px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border ${systemActive ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'}`}
          >
            {systemActive ? <><Pause size={14}/> Maintenance Lockdown</> : <><Play size={14}/> Resume Operations</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Network TVL', value: `$${stats.tvl.toLocaleString()}`, icon: Database, color: 'text-blue-500' },
          { label: 'Settled Payouts', value: `$${stats.payouts.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Active Miners', value: stats.users, icon: Users, color: 'text-purple-500' },
          { label: 'Computing Nodes', value: stats.nodes, icon: HardDrive, color: 'text-exza-gold' }
        ].map((s, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><s.icon size={80}/></div>
            <div className={`p-3 w-fit bg-white/5 rounded-xl ${s.color} mb-4 relative z-10`}><s.icon size={24}/></div>
            <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] relative z-10">{s.label}</p>
            <p className="text-3xl font-display font-bold text-white relative z-10">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
        <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-exza-gold text-exza-dark shadow-lg shadow-exza-gold/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>Miners Directory</button>
        <button onClick={() => setActiveTab('transactions')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'transactions' ? 'bg-exza-gold text-exza-dark shadow-lg shadow-exza-gold/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>
          Settlement Hub
          {allTxs.filter(t => t.status === 'PENDING').length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-exza-dark font-black">{allTxs.filter(t => t.status === 'PENDING').length}</span>}
        </button>
        <button onClick={() => setActiveTab('settings')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-exza-gold text-exza-dark shadow-lg shadow-exza-gold/20' : 'text-stone-500 hover:text-white hover:bg-white/5'}`}>System Settings</button>
      </div>

      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
           <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-stone-500">
                <tr>
                  <th className="px-8 py-5">Node Identity</th>
                  <th className="px-8 py-5">Wallet Assets</th>
                  <th className="px-8 py-5">Node Cluster</th>
                  <th className="px-8 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.email} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-exza-gold/10 text-exza-gold flex items-center justify-center font-display font-bold border border-exza-gold/20 group-hover:scale-110 transition-transform">
                             {u.username.charAt(0)}
                          </div>
                          <div>
                             <p className="text-white font-bold">{u.username}</p>
                             <p className="text-[10px] font-mono text-stone-600">{u.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-white font-display font-bold">${u.balance.toLocaleString()}</p>
                       <p className="text-[8px] text-stone-600 uppercase font-black">Liquid Assets</p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-stone-400 font-bold">{u.nodes?.length || 0} Nodes Deployed</p>
                       <p className="text-[8px] text-stone-600 uppercase font-black">{u.tier} Tier Protocol</p>
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase">Operational</span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-stone-500">
                <tr>
                  <th className="px-8 py-5">Miner Account</th>
                  <th className="px-8 py-5">Asset Transfer</th>
                  <th className="px-8 py-5">Wallet Address (Crucial)</th>
                  <th className="px-8 py-5">Verification Artifact</th>
                  <th className="px-8 py-5 text-right">System Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                       <div className="flex flex-col items-center gap-4 opacity-30">
                          <ShieldCheck size={60} />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">All Node Settlements Fully Synchronized</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  allTxs.map(tx => (
                    <tr key={tx.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                             {tx.type === 'DEPOSIT' ? <ArrowUpRight size={16}/> : <ArrowDownLeft size={16}/>}
                          </div>
                          <div>
                            <p className="text-white font-bold">{tx.username}</p>
                            <p className="text-[10px] text-stone-600 font-mono italic">{tx.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className={`font-display font-bold ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-blue-400'}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString()} USDT
                        </p>
                        <p className="text-[8px] text-stone-600 font-black uppercase tracking-widest">{tx.type} Request • {new Date(tx.date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-white/80 group-hover:border-exza-gold/30 transition-all">
                              {tx.address}
                           </div>
                           <button onClick={() => copyToClipboard(tx.address)} className="p-2 hover:bg-exza-gold/20 text-exza-gold rounded-lg transition-all" title="Copy Address"><Copy size={16}/></button>
                        </div>
                        <p className="text-[8px] text-stone-700 font-black uppercase mt-1 tracking-widest">
                          {tx.type === 'DEPOSIT' ? 'Sender Origin' : 'Recipient Destination'}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        {tx.screenshot ? (
                          <button 
                            onClick={() => setSelectedScreenshot(tx.screenshot!)}
                            className="flex items-center gap-3 px-4 py-2 bg-exza-gold/10 border border-exza-gold/20 text-exza-gold hover:bg-exza-gold hover:text-exza-dark transition-all rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            <ImageIcon size={14}/> View Evidence <Eye size={14}/>
                          </button>
                        ) : (
                          <span className="text-[9px] text-stone-700 italic bg-white/5 px-4 py-2 rounded-xl">No Image Provided</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {tx.status === 'PENDING' ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleTransactionAction(tx.id, tx.userEmail, 'APPROVE')} className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all border border-emerald-500/20" title="Finalize Request"><CheckCircle2 size={18}/></button>
                            <button onClick={() => handleTransactionAction(tx.id, tx.userEmail, 'REJECT')} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/20" title="Abort Request"><XCircle size={18}/></button>
                          </div>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {tx.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 flex items-center justify-between bg-gradient-to-r from-exza-dark to-stone-900">
             <div>
               <h3 className="text-2xl font-display font-bold text-white">Admin Control Center</h3>
               <p className="text-stone-400 text-sm">Manage global platform parameters and security.</p>
             </div>
             <div className="w-16 h-16 bg-exza-gold/10 rounded-full flex items-center justify-center border border-exza-gold/20 text-exza-gold">
               <Settings size={32} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Config */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Power className="text-exza-gold" size={20} /> Platform Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">Maintenance Mode</p>
                    <p className="text-stone-500 text-xs mt-1">Pause all user deposits and withdrawals.</p>
                  </div>
                  <div className="w-10 h-6 bg-stone-700 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-stone-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">New Registrations</p>
                    <p className="text-stone-500 text-xs mt-1">Allow new users to create accounts.</p>
                  </div>
                  <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Config */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2"><Wallet className="text-blue-500" size={20} /> Financial Parameters</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">Global Withdrawal Fee</p>
                    <p className="text-stone-500 text-xs mt-1">Current fee applied to all withdrawals.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-400 font-bold font-display">1.5%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">Official Deposit Address</p>
                    <p className="text-stone-500 text-xs mt-1">Master wallet for incoming funds.</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-colors">Update</button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Security Config */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
              <h4 className="text-white font-bold mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" size={20} /> Admin Security</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">Admin 2FA</p>
                    <p className="text-stone-500 text-xs mt-1">Require 2FA for admin login.</p>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors">Enable</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">Change Admin Password</p>
                    <p className="text-stone-500 text-xs mt-1">Update master credentials.</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/10 transition-colors">Update</button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20">
                  <LogOut size={24} />
                </div>
                <h4 className="text-red-400 font-bold mb-2">Terminate Session</h4>
                <p className="text-stone-400 text-sm mb-6">Securely log out of your elevated access session on this device.</p>
                <button onClick={onLogout} className="w-full px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
                  <LogOut size={16}/> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Viewer Overlay */}
      <AnimatePresence>
        {selectedScreenshot && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedScreenshot(null)} className="absolute inset-0 bg-exza-dark/98 backdrop-blur-2xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-[2.5rem] border border-exza-gold/20 shadow-2xl p-2 bg-exza-slate">
              <button onClick={() => setSelectedScreenshot(null)} className="absolute top-6 right-6 p-3 bg-black/60 text-white rounded-full hover:bg-exza-gold hover:text-exza-dark transition-all z-10 border border-white/10"><X size={24}/></button>
              <div className="w-full h-full overflow-auto rounded-3xl">
                 <img src={selectedScreenshot} alt="Institutional Artifact" className="w-full h-auto object-contain" />
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black uppercase text-exza-gold tracking-[0.3em]">Institutional Verification Evidence v4.0</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
