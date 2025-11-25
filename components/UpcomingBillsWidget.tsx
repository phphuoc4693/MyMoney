
import React, { useMemo } from 'react';
import { RecurringBill, Transaction, TransactionType } from '../types';
import { CalendarClock, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

interface Props {
  bills: RecurringBill[];
  transactions: Transaction[];
  onOpenBill: (bill: RecurringBill) => void;
  isPrivacyMode?: boolean;
}

const UpcomingBillsWidget: React.FC<Props> = ({ bills, transactions, onOpenBill, isPrivacyMode = false }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const todayDate = new Date().getDate();

  // Filter logic: Unpaid bills that are Overdue OR Upcoming within 7 days
  const urgentBills = useMemo(() => {
      return bills.filter(bill => {
          // Check if paid
          const isPaid = transactions.some(t => 
            t.date.startsWith(currentMonth) && 
            t.type === TransactionType.EXPENSE &&
            t.note.toLowerCase().includes(bill.name.toLowerCase())
          );
          
          if (isPaid) return false;

          // Check if urgent (Overdue or Due within 7 days)
          const isOverdue = bill.dueDay < todayDate;
          const isUpcomingSoon = bill.dueDay >= todayDate && bill.dueDay <= todayDate + 7;

          return isOverdue || isUpcomingSoon;
      }).sort((a, b) => a.dueDay - b.dueDay);
  }, [bills, transactions]);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    return `${(val / 1000).toFixed(0)}k`;
  };

  if (urgentBills.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 text-red-500 rounded-lg animate-pulse">
                    <AlertTriangle size={16} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Hóa đơn cần trả</h3>
            </div>
            <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">{urgentBills.length}</span>
        </div>

        <div className="space-y-3">
            {urgentBills.slice(0, 3).map(bill => {
                const isOverdue = bill.dueDay < todayDate;
                return (
                    <div 
                        key={bill.id} 
                        onClick={() => onOpenBill(bill)}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer transition-all group/item"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border ${isOverdue ? 'bg-white border-red-200 text-red-500' : 'bg-white border-blue-200 text-blue-500'}`}>
                                <span className="text-[8px] font-bold uppercase leading-none">Ngày</span>
                                <span className="text-sm font-bold leading-none">{bill.dueDay}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{bill.name}</h4>
                                <p className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                    {isOverdue ? 'Đã quá hạn!' : 'Sắp tới hạn'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-800 text-sm">{formatCurrency(bill.amount)}</p>
                            <ChevronRight size={14} className="text-gray-300 ml-auto mt-1 group-hover/item:text-red-400 transition-colors" />
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default UpcomingBillsWidget;
