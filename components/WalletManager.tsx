
import React, { useState, useMemo } from 'react';
import { Wallet, Transaction, TransactionType } from '../types';
import { Plus, CreditCard, Wallet as WalletIcon, Landmark, Smartphone, Trash2, X, ArrowRightLeft, Scale, History, TrendingUp, TrendingDown, Copy, Check, Settings, Search } from 'lucide-react';
import TransactionList from './TransactionList';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  wallets: Wallet[];
  transactions: Transaction[];
  onAddWallet: (wallet: Wallet) => void;
  onUpdateWallet: (id: string, data: Partial<Wallet>) => void;
  onDeleteWallet: (id: string) => void;
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  isPrivacyMode?: boolean;
}

const WalletManager: React.FC<Props> = ({ 
    wallets, 
    transactions, 
    onAddWallet, 
    onUpdateWallet, 
    onDeleteWallet,
    onAddTransaction,
    isPrivacyMode = false
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local search for detail view
  const [detailSearch, setDetailSearch] = useState('');

  // State for forms
  const [newWallet, setNewWallet] = useState<Partial<Wallet>>({
      name: '', type: 'BANK', initialBalance: 0, color: 'from-blue-600 to-blue-800', creditLimit: 0
  });
  const [transferData, setTransferData] = useState({ fromId: '', toId: '', amount: '', note: '', fee: '0' });
  const [adjustData, setAdjustData] = useState({ walletId: '', actualBalance: '' });

  // --- HELPERS ---
  const calculateBalance = (wallet: Wallet) => {
      const walletTrans = transactions.filter(t => t.walletId === wallet.id);
      const income = walletTrans.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = walletTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      return wallet.initialBalance + income - expense;
  };

  const formatCurrency = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  const getIcon = (type: string) => {
      switch (type) {
          case 'CASH': return <WalletIcon className="text-white opacity-90" size={24} />;
          case 'BANK': return <Landmark className="text-white opacity-90" size={24} />;
          case 'CREDIT': return <CreditCard className="text-white opacity-90" size={24} />;
          case 'E-WALLET': return <Smartphone className="text-white opacity-90" size={24} />;
          default: return <WalletIcon className="text-white opacity-90" size={24} />;
      }
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
  };

  // --- TOTAL WEALTH ---
  const totalWealth = useMemo(() => {
      // Exclude Credit Card debt from "Wealth" usually, but if balance is negative it reduces wealth
      return wallets.reduce((sum, w) => sum + calculateBalance(w), 0);
  }, [wallets, transactions]);

  // --- CHART DATA GENERATOR ---
  const getBalanceHistory = (walletId: string) => {
      const wallet = wallets.find(w => w.id === walletId);
      if (!wallet) return [];
      
      // Create last 6 months data points
      const data = [];
      let runningBalance = wallet.initialBalance; // This is simplified; ideally should backtrack from current
      
      // Better approach: Calculate current, then reverse-engineer or just sum up to date
      const walletTrans = transactions
        .filter(t => t.walletId === walletId)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Aggregate by month
      const today = new Date();
      for(let i=5; i>=0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = d.toISOString().slice(0, 7);
          
          // Filter transactions up to end of this month
          const upToThisMonth = walletTrans.filter(t => t.date < new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString());
          
          const inc = upToThisMonth.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
          const exp = upToThisMonth.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
          
          data.push({
              name: `T${d.getMonth() + 1}`,
              value: wallet.initialBalance + inc - exp
          });
      }
      return data;
  };

  // --- ACTIONS ---
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newWallet.name) {
          onAddWallet({
              id: Date.now().toString(),
              name: newWallet.name,
              type: newWallet.type as any,
              initialBalance: Number(newWallet.initialBalance),
              currentBalance: Number(newWallet.initialBalance),
              creditLimit: Number(newWallet.creditLimit) || 0,
              color: newWallet.color || 'from-gray-700 to-gray-900',
              bankName: newWallet.bankName,
              accountNumber: newWallet.accountNumber,
              description: newWallet.description
          });
          setIsAdding(false);
          setNewWallet({ name: '', type: 'BANK', initialBalance: 0, color: 'from-blue-600 to-blue-800', creditLimit: 0 });
      }
  };

  const handleTransfer = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(transferData.amount);
      const fee = parseFloat(transferData.fee) || 0;
      if (!amount || !transferData.fromId || !transferData.toId || transferData.fromId === transferData.toId) return;

      const sourceWallet = wallets.find(w => w.id === transferData.fromId)?.name || 'Ví nguồn';
      const destWallet = wallets.find(w => w.id === transferData.toId)?.name || 'Ví đích';

      // 1. Money OUT from Source
      onAddTransaction({
          amount: amount,
          type: TransactionType.EXPENSE,
          category: 'Chuyển đi',
          note: `Chuyển đến ${destWallet}: ${transferData.note}`,
          date: new Date().toISOString(),
          walletId: transferData.fromId
      });

      // 2. Fee (if any)
      if (fee > 0) {
          onAddTransaction({
              amount: fee,
              type: TransactionType.EXPENSE,
              category: 'Phí giao dịch',
              note: `Phí chuyển tiền đến ${destWallet}`,
              date: new Date().toISOString(),
              walletId: transferData.fromId
          });
      }

      // 3. Money IN to Dest
      onAddTransaction({
          amount: amount,
          type: TransactionType.INCOME,
          category: 'Nhận tiền',
          note: `Nhận từ ${sourceWallet}: ${transferData.note}`,
          date: new Date().toISOString(),
          walletId: transferData.toId
      });

      setIsTransferring(false);
      setTransferData({ fromId: '', toId: '', amount: '', note: '', fee: '0' });
  };

  const handleAdjustBalance = (e: React.FormEvent) => {
      e.preventDefault();
      const targetWallet = wallets.find(w => w.id === adjustData.walletId);
      if (!targetWallet) return;

      const currentBal = calculateBalance(targetWallet);
      const newBal = parseFloat(adjustData.actualBalance);
      const diff = newBal - currentBal;

      if (diff === 0) {
          setIsAdjusting(false);
          return;
      }

      onAddTransaction({
          amount: Math.abs(diff),
          type: diff > 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
          category: 'Điều chỉnh số dư',
          note: 'Cân bằng số dư thực tế',
          date: new Date().toISOString(),
          walletId: targetWallet.id
      });

      setIsAdjusting(false);
      setAdjustData({ walletId: '', actualBalance: '' });
  };

  // --- RENDER DETAIL MODAL ---
  const renderDetailModal = () => {
      if (!selectedWallet) return null;
      const balance = calculateBalance(selectedWallet);
      const chartData = getBalanceHistory(selectedWallet.id);
      
      // Filter transactions
      const walletTrans = transactions
        .filter(t => t.walletId === selectedWallet.id)
        .filter(t => detailSearch ? t.note.toLowerCase().includes(detailSearch.toLowerCase()) || t.amount.toString().includes(detailSearch) : true)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Monthly stats
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthTrans = walletTrans.filter(t => t.date.startsWith(currentMonth));
      const incomeMonth = monthTrans.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expenseMonth = monthTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

      const isCredit = selectedWallet.type === 'CREDIT';
      const creditLimit = selectedWallet.creditLimit || 0;
      const availableCredit = creditLimit + balance; // Balance is usually negative or 0 for credit cards
      const creditUsage = creditLimit > 0 ? (Math.abs(balance) / creditLimit) * 100 : 0;

      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-gray-50 w-full max-w-3xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                  {/* Detail Header */}
                  <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shrink-0 z-10">
                      <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl bg-gradient-to-br ${selectedWallet.color} text-white shadow-md`}>
                               {getIcon(selectedWallet.type)}
                           </div>
                           <div>
                               <h3 className="font-bold text-gray-800">{selectedWallet.name}</h3>
                               <p className="text-xs text-gray-500">{selectedWallet.bankName} • {selectedWallet.type}</p>
                           </div>
                      </div>
                      <div className="flex items-center gap-2">
                           <button 
                                onClick={() => {
                                    if(confirm("Bạn có chắc muốn xóa ví này?")) {
                                        onDeleteWallet(selectedWallet.id);
                                        setSelectedWallet(null);
                                    }
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Xóa ví"
                           >
                               <Trash2 size={20} />
                           </button>
                           <button onClick={() => setSelectedWallet(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {/* Main Card Visualization */}
                      <div className="p-6 bg-white mb-2">
                          <div className={`w-full aspect-[1.586/1] max-w-md mx-auto rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${selectedWallet.color} relative overflow-hidden transition-transform hover:scale-[1.01]`}>
                               {/* Chip */}
                               <div className="w-12 h-9 bg-yellow-200/30 backdrop-blur-sm rounded-md border border-yellow-200/40 mb-8 relative">
                                   <div className="absolute top-1/2 left-0 w-full h-px bg-yellow-500/30"></div>
                                   <div className="absolute left-1/2 top-0 h-full w-px bg-yellow-500/30"></div>
                               </div>
                               
                               {/* Icon/Logo Watermark */}
                               <div className="absolute top-6 right-6 opacity-80">
                                   {getIcon(selectedWallet.type)}
                               </div>
                               
                               {/* Balance */}
                               <div className="mb-8">
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">
                                        {isCredit ? 'Dư nợ hiện tại' : 'Số dư khả dụng'}
                                    </p>
                                    <p className="text-3xl font-bold tracking-tight text-white shadow-black drop-shadow-md">
                                        {formatCurrency(balance)}
                                    </p>
                               </div>

                               {/* Footer Info */}
                               <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">{selectedWallet.bankName}</p>
                                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleCopy(selectedWallet.accountNumber || '')}>
                                            <p className="text-white/90 font-mono tracking-widest text-sm shadow-black drop-shadow-sm">
                                                {selectedWallet.accountNumber || '•••• •••• •••• 8888'}
                                            </p>
                                            {selectedWallet.accountNumber && (
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12}/></span>
                                            )}
                                            {copiedId === selectedWallet.accountNumber && <span className="text-[10px] bg-white/20 px-1 rounded">Copied</span>}
                                        </div>
                                    </div>
                                    {/* Simulated Visa/Mastercard Logo */}
                                    <div className="flex -space-x-3 opacity-90">
                                         <div className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-sm"></div>
                                         <div className="w-8 h-8 rounded-full bg-orange-400/80 backdrop-blur-sm"></div>
                                    </div>
                               </div>
                          </div>

                          {/* Credit Card Specifics */}
                          {isCredit && (
                              <div className="max-w-md mx-auto mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                   <div className="flex justify-between text-sm mb-2">
                                       <span className="text-gray-500">Hạn mức: <strong className="text-gray-800">{formatCurrency(creditLimit)}</strong></span>
                                       <span className="text-gray-500">Khả dụng: <strong className="text-emerald-600">{formatCurrency(availableCredit)}</strong></span>
                                   </div>
                                   <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                       <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${creditUsage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(creditUsage, 100)}%` }}
                                       ></div>
                                   </div>
                                   <p className="text-xs text-right text-gray-400 mt-1">Đã dùng {creditUsage.toFixed(1)}%</p>
                              </div>
                          )}
                      </div>

                      {/* Quick Actions */}
                      <div className="p-4 bg-white mb-2 flex justify-center gap-4">
                            <button 
                                onClick={() => { setTransferData({ ...transferData, fromId: selectedWallet.id }); setIsTransferring(true); }}
                                className="flex flex-col items-center gap-2 w-20"
                            >
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-colors"><ArrowRightLeft size={20}/></div>
                                <span className="text-xs font-bold text-gray-600">Chuyển tiền</span>
                            </button>
                            <button 
                                onClick={() => { setAdjustData({ walletId: selectedWallet.id, actualBalance: balance.toString() }); setIsAdjusting(true); }}
                                className="flex flex-col items-center gap-2 w-20"
                            >
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-colors"><Scale size={20}/></div>
                                <span className="text-xs font-bold text-gray-600">Điều chỉnh</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 w-20 opacity-50 cursor-not-allowed">
                                <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center"><Settings size={20}/></div>
                                <span className="text-xs font-bold text-gray-600">Cài đặt</span>
                            </button>
                      </div>

                      {/* Stats & Chart */}
                      <div className="p-6 bg-white mb-2">
                           <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Xu hướng số dư (6 tháng)</h4>
                           <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                           </div>
                           <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                               <div>
                                   <p className="text-xs text-gray-500 mb-1">Thu nhập tháng này</p>
                                   <p className="text-lg font-bold text-emerald-600">+{formatCurrency(incomeMonth)}</p>
                               </div>
                               <div className="text-right">
                                   <p className="text-xs text-gray-500 mb-1">Chi tiêu tháng này</p>
                                   <p className="text-lg font-bold text-red-500">-{formatCurrency(expenseMonth)}</p>
                               </div>
                           </div>
                      </div>

                      {/* History List */}
                      <div className="p-4 bg-white min-h-[300px]">
                           <div className="flex items-center justify-between mb-4">
                               <h4 className="font-bold text-gray-800 flex items-center gap-2"><History size={16}/> Lịch sử giao dịch</h4>
                               <div className="relative">
                                   <input 
                                      value={detailSearch}
                                      onChange={(e) => setDetailSearch(e.target.value)}
                                      className="pl-8 pr-3 py-1.5 bg-gray-100 rounded-lg text-xs border-none outline-none w-40 transition-all focus:w-52 focus:bg-white focus:ring-1 focus:ring-indigo-200"
                                      placeholder="Tìm kiếm..."
                                   />
                                   <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                               </div>
                           </div>
                           <TransactionList 
                              transactions={walletTrans}
                              onDelete={() => {}} 
                              onEdit={() => {}} 
                              isPrivacyMode={isPrivacyMode}
                              emptyMessage="Chưa có giao dịch nào."
                           />
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header & Total Wealth */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="relative z-10">
             <div className="flex justify-between items-start">
                 <div>
                     <h2 className="text-2xl font-bold flex items-center gap-2 mb-2 opacity-90"><WalletIcon size={24} /> Tài Sản Tổng</h2>
                     <p className="text-gray-400 text-sm">Tổng hợp tất cả các nguồn tiền</p>
                 </div>
                 <button onClick={() => setIsAdding(true)} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-bold backdrop-blur-md">
                     <Plus size={18}/> Thêm ví mới
                 </button>
             </div>
             <div className="mt-8">
                 <p className="text-xs font-bold text-blue-300 uppercase mb-2 tracking-widest">Tổng số dư khả dụng</p>
                 <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                     {formatCurrency(totalWealth)}
                 </h1>
             </div>
          </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setIsTransferring(true)} className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all min-w-fit text-gray-700 font-bold text-sm">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ArrowRightLeft size={18} /></div>
              Chuyển tiền
          </button>
          <button onClick={() => setIsAdjusting(true)} className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all min-w-fit text-gray-700 font-bold text-sm">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Scale size={18} /></div>
              Điều chỉnh số dư
          </button>
      </div>

      {/* Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(wallet => {
              const balance = calculateBalance(wallet);
              return (
                  <div 
                    key={wallet.id} 
                    onClick={() => setSelectedWallet(wallet)}
                    className={`relative w-full aspect-[1.586/1] rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br ${wallet.color} overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl border border-white/10`}
                  >
                      {/* Chip & Signal */}
                      <div className="flex justify-between items-start mb-8">
                           <div className="w-10 h-8 bg-yellow-200/30 backdrop-blur-sm rounded border border-yellow-200/40 relative">
                               <div className="absolute top-1/2 left-0 w-full h-px bg-yellow-500/30"></div>
                               <div className="absolute left-1/2 top-0 h-full w-px bg-yellow-500/30"></div>
                           </div>
                           <div className="opacity-80">
                               {getIcon(wallet.type)}
                           </div>
                      </div>

                      {/* Number */}
                      <div className="mb-6">
                          <p className="font-mono text-lg tracking-widest opacity-90 shadow-black drop-shadow-sm truncate">
                              {wallet.accountNumber ? wallet.accountNumber.replace(/.(?=.{4})/g, '•') : '•••• •••• •••• 8888'}
                          </p>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[9px] uppercase font-bold opacity-70 mb-0.5">
                                  {wallet.type === 'CREDIT' ? 'Available Limit' : 'Current Balance'}
                              </p>
                              <p className="text-xl font-bold">{formatCurrency(wallet.type === 'CREDIT' ? (wallet.creditLimit || 0) + balance : balance)}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs font-bold opacity-80 mb-1">{wallet.bankName || wallet.name}</p>
                              {/* Fake Logo */}
                              <div className="flex justify-end -space-x-2 opacity-80">
                                  <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-md"></div>
                                  <div className="w-6 h-6 rounded-full bg-white/50 backdrop-blur-md"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}
          
          {/* Add New Button Card */}
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full aspect-[1.586/1] rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-green-50/30 transition-all"
          >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                  <Plus size={24} />
              </div>
              <span className="font-bold text-sm">Thêm ví mới</span>
          </button>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Add Wallet Modal */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Thêm Tài Khoản Mới</h3>
                      <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên ví / Tài khoản</label>
                          <input required value={newWallet.name} onChange={e => setNewWallet({...newWallet, name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary" placeholder="VD: Vietcombank, Tiền mặt..." />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại tài khoản</label>
                          <div className="grid grid-cols-2 gap-2">
                                {['CASH', 'BANK', 'E-WALLET', 'CREDIT'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setNewWallet({...newWallet, type: t as any})}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-2 ${newWallet.type === t ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {t === 'CASH' && <WalletIcon size={20}/>}
                                        {t === 'BANK' && <Landmark size={20}/>}
                                        {t === 'E-WALLET' && <Smartphone size={20}/>}
                                        {t === 'CREDIT' && <CreditCard size={20}/>}
                                        {t === 'CASH' ? 'Tiền mặt' : t === 'BANK' ? 'Ngân hàng' : t === 'CREDIT' ? 'Thẻ tín dụng' : 'Ví điện tử'}
                                    </button>
                                ))}
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số dư ban đầu</label>
                              <input type="number" value={newWallet.initialBalance} onChange={e => setNewWallet({...newWallet, initialBalance: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary" />
                          </div>
                          {newWallet.type === 'CREDIT' && (
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạn mức tín dụng</label>
                                  <input type="number" value={newWallet.creditLimit} onChange={e => setNewWallet({...newWallet, creditLimit: Number(e.target.value)})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary" />
                              </div>
                          )}
                      </div>

                      {newWallet.type !== 'CASH' && (
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên ngân hàng</label>
                                  <input value={newWallet.bankName || ''} onChange={e => setNewWallet({...newWallet, bankName: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="VCB" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tài khoản</label>
                                  <input value={newWallet.accountNumber || ''} onChange={e => setNewWallet({...newWallet, accountNumber: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none" placeholder="Last 4 digits" />
                              </div>
                          </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Màu thẻ (Giao diện)</label>
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                              {[
                                  'from-gray-700 to-gray-900',
                                  'from-blue-600 to-blue-800',
                                  'from-emerald-500 to-teal-700',
                                  'from-red-500 to-rose-700',
                                  'from-purple-600 to-indigo-800',
                                  'from-orange-500 to-red-600',
                                  'from-pink-500 to-fuchsia-700',
                                  'from-cyan-500 to-blue-600'
                              ].map(color => (
                                  <button 
                                    key={color}
                                    type="button"
                                    onClick={() => setNewWallet({...newWallet, color})}
                                    className={`w-10 h-10 shrink-0 rounded-full bg-gradient-to-br ${color} ${newWallet.color === color ? 'ring-4 ring-offset-2 ring-gray-200 scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                                  />
                              ))}
                          </div>
                      </div>
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors mt-2">
                          Hoàn tất
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* 2. Transfer Modal */}
      {isTransferring && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2"><ArrowRightLeft size={20} /> Chuyển tiền nội bộ</h3>
                        <button onClick={() => setIsTransferring(false)} className="p-1 hover:bg-white/20 rounded-full"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleTransfer} className="p-6 space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
                             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 rounded-full border border-gray-100 shadow-sm z-10 text-gray-400">
                                 <ArrowRightLeft size={16} />
                             </div>
                             <div className="space-y-4">
                                 <div>
                                     <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Nguồn tiền</label>
                                     <select required value={transferData.fromId} onChange={e => setTransferData({...transferData, fromId: e.target.value})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-bold">
                                        <option value="">Chọn ví nguồn</option>
                                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrency(calculateBalance(w))})</option>)}
                                    </select>
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-400 uppercase mb-1 block text-right">Đích đến</label>
                                     <select required value={transferData.toId} onChange={e => setTransferData({...transferData, toId: e.target.value})} className="w-full p-2 bg-white rounded-lg border border-gray-200 text-sm font-bold text-right" dir="rtl">
                                        <option value="">Chọn ví đích</option>
                                        {wallets.filter(w => w.id !== transferData.fromId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                 </div>
                             </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền chuyển</label>
                            <input type="number" required value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-2xl font-bold text-indigo-600 outline-none focus:border-indigo-500 text-center" placeholder="0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phí giao dịch (Nếu có)</label>
                                <input type="number" value={transferData.fee} onChange={e => setTransferData({...transferData, fee: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm" placeholder="0" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
                                <input value={transferData.note} onChange={e => setTransferData({...transferData, note: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none text-sm" placeholder="Lý do chuyển..." />
                            </div>
                        </div>
                        
                        <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors mt-2 flex items-center justify-center gap-2">
                            <Check size={18} /> Xác nhận chuyển
                        </button>
                    </form>
               </div>
           </div>
      )}

      {/* 3. Adjust Balance Modal */}
      {isAdjusting && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                    <div className="bg-blue-500 px-6 py-4 flex justify-between items-center text-white">
                        <h3 className="font-bold flex items-center gap-2"><Scale size={20} /> Điều chỉnh số dư</h3>
                        <button onClick={() => setIsAdjusting(false)} className="p-1 hover:bg-white/20 rounded-full"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleAdjustBalance} className="p-6 space-y-4">
                         <select required value={adjustData.walletId} onChange={e => setAdjustData({...adjustData, walletId: e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm font-bold mb-2">
                            <option value="">Chọn ví cần điều chỉnh</option>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số dư thực tế hiện tại (VND)</label>
                            <input type="number" required value={adjustData.actualBalance} onChange={e => setAdjustData({...adjustData, actualBalance: e.target.value})} className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 text-2xl font-bold text-blue-600 outline-none focus:border-blue-500" placeholder="0" autoFocus />
                            <p className="text-xs text-gray-400 mt-2">Hệ thống sẽ tự động tạo giao dịch chênh lệch để khớp với số dư này.</p>
                        </div>
                        <button type="submit" className="w-full py-3.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-colors mt-2">
                            Cập nhật số dư
                        </button>
                    </form>
                </div>
           </div>
      )}

      {/* Render Detail Modal if Selected */}
      {selectedWallet && renderDetailModal()}

    </div>
  );
};

export default WalletManager;
