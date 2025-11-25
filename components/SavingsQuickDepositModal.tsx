
import React, { useState, useEffect } from 'react';
import { SavingsGoal, Wallet } from '../types';
import { PiggyBank, X, CreditCard, TrendingUp, Calendar, Calculator } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onDeposit: (goalId: string, amount: number, walletId: string) => void;
  wallets: Wallet[];
}

const SavingsQuickDepositModal: React.FC<Props> = ({ isOpen, onClose, goal, onDeposit, wallets }) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
      if (wallets.length > 0) setSelectedWalletId(wallets[0].id);
  }, [wallets]);

  useEffect(() => {
      if (goal && goal.deadline) {
          // Calculate suggested daily amount
          const deadlineDate = new Date(goal.deadline);
          const today = new Date();
          const diffTime = Math.max(0, deadlineDate.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const remaining = goal.targetAmount - goal.currentAmount;
          
          if (remaining > 0) {
             const daily = diffDays <= 0 ? remaining : remaining / diffDays;
             setAmount(Math.ceil(daily).toString());
          } else {
             setAmount('0');
          }
      }
  }, [goal]);

  if (!isOpen || !goal) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleDeposit = () => {
      const val = parseFloat(amount);
      if (val > 0) {
          onDeposit(goal.id, val, selectedWalletId);
          onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-8 bg-gradient-to-br from-pink-500 to-rose-500 text-white text-center relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <X size={20} />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner">
                <PiggyBank size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold">{goal.name}</h3>
            <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mt-2 border border-white/10">
                <TrendingUp size={12} /> Mục tiêu: {formatCurrency(goal.targetAmount)}
            </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-pink-200"></div>
                <p className="text-xs text-pink-500 font-bold uppercase mb-1 flex items-center justify-center gap-1">
                    <Calculator size={12} /> Cần tiết kiệm hôm nay
                </p>
                <div className="relative">
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent text-3xl font-bold text-pink-600 text-center outline-none border-b border-pink-200 focus:border-pink-500 pb-1 transition-colors"
                        autoFocus
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Đây là số tiền gợi ý để bạn đạt mục tiêu đúng hạn.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Trích từ nguồn tiền</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <CreditCard size={18} />
                    </div>
                    <select
                        value={selectedWalletId}
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none appearance-none font-medium text-gray-700"
                    >
                        {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.currentBalance)})</option>
                        ))}
                    </select>
                </div>
            </div>

            <button 
                onClick={handleDeposit}
                className="w-full py-3.5 text-white font-bold rounded-xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600"
            >
                Nạp tiền ngay
            </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsQuickDepositModal;
