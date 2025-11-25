
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import TransactionList from './TransactionList';
import { ArrowRight, TrendingDown, TrendingUp, History, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onViewAll: () => void;
  isPrivacyMode?: boolean;
}

const RecentTransactions: React.FC<Props> = ({ transactions, onDelete, onEdit, onViewAll, isPrivacyMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const recentTransactions = transactions.slice(0, 5);

  // --- Insights Logic ---
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todayExpense = transactions
    .filter(t => t.date.startsWith(today) && t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const yesterdayExpense = transactions
    .filter(t => t.date.startsWith(yesterday) && t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const diff = todayExpense - yesterdayExpense;
  const isSpendingMore = diff > 0;
  const percentDiff = yesterdayExpense > 0 ? Math.round((Math.abs(diff) / yesterdayExpense) * 100) : 100;

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formatCurrencyFull = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // --- Mini Chart Data (Last 7 transactions intensity) ---
  const chartData = useMemo(() => {
      const last7 = transactions.slice(0, 7).reverse();
      const maxVal = Math.max(...last7.map(t => t.amount), 1);
      return last7.map(t => ({
          val: t.amount,
          height: Math.max(15, (t.amount / maxVal) * 100), // Min 15% height
          type: t.type
      }));
  }, [transactions]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all duration-300">
      {/* Header - Always Visible */}
      <div 
        className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
             <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                <History size={18} />
             </div>
             <h3 className="font-bold text-gray-800">Giao dịch gần đây</h3>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onViewAll(); }}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline bg-green-50 px-3 py-1.5 rounded-full transition-colors"
            >
                Xem tất cả <ArrowRight size={14} />
            </button>
            <div className="text-gray-400 p-1 rounded-full hover:bg-gray-200">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
          <div className="animate-fade-in">
              {/* Insight Banner */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-50 bg-white">
                 {/* Today's Status */}
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isSpendingMore ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {isSpendingMore ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Chi tiêu hôm nay</p>
                        <div className="flex items-baseline gap-2">
                            <span className="font-bold text-gray-800 text-lg">{formatCurrencyFull(todayExpense)}</span>
                            {yesterdayExpense > 0 && (
                                <span className={`text-xs font-bold ${isSpendingMore ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {isSpendingMore ? '+' : '-'}{percentDiff}% vs hôm qua
                                </span>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Mini Intensity Chart */}
                 <div className="flex items-end justify-end gap-1.5 h-10 self-center opacity-80">
                     {chartData.map((d, i) => (
                         <div 
                            key={i} 
                            className={`w-1.5 rounded-t-sm transition-all hover:opacity-80 ${d.type === TransactionType.INCOME ? 'bg-emerald-400' : 'bg-red-400'}`}
                            style={{ height: `${d.height}%` }}
                            title={formatCurrency(d.val)}
                         ></div>
                     ))}
                 </div>
              </div>

              {/* Transaction List */}
              <div className="p-2">
                <TransactionList 
                    transactions={recentTransactions} 
                    onDelete={onDelete} 
                    onEdit={onEdit} 
                    isPrivacyMode={isPrivacyMode}
                    emptyMessage="Chưa có giao dịch nào gần đây."
                />
              </div>
              
              {recentTransactions.length > 0 && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
                      <p className="text-xs text-gray-400 italic">Hiển thị 5 giao dịch mới nhất</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default RecentTransactions;
