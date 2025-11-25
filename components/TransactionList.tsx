import React from 'react';
import { Transaction, TransactionType } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';
import { Trash2, Edit2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  emptyMessage?: string;
  isPrivacyMode?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
    transactions, 
    onDelete, 
    onEdit, 
    emptyMessage = "Chưa có giao dịch nào trong tháng này.",
    isPrivacyMode = false
}) => {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date.split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatCurrency = (amount: number) => {
    if (isPrivacyMode) return '******';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' }).format(date);
  };

  if (transactions.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <Trash2 size={40} className="text-gray-300" />
          </div>
          <p className="font-medium text-center px-4">{emptyMessage}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {sortedDates.map(date => {
        const dailyTotal = groupedTransactions[date].reduce((sum, t) => 
          t.type === TransactionType.INCOME ? sum + t.amount : sum - t.amount, 0
        );

        return (
          <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <span className="font-semibold text-gray-500 text-sm uppercase tracking-wide">{formatDate(date)}</span>
              <span className={`text-sm font-bold ${dailyTotal >= 0 ? 'text-primary' : 'text-gray-800'}`}>
                {dailyTotal > 0 ? '+' : ''}{formatCurrency(dailyTotal)}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {groupedTransactions[date].map(t => {
                const Icon = CATEGORY_ICONS[t.category] || CATEGORY_ICONS['Khác'];
                const colorClass = CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Khác'];

                return (
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => onEdit(t)}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${colorClass} bg-opacity-50`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{t.category}</h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{t.note}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-primary' : 'text-gray-900'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                         >
                            <Edit2 size={14} />
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
