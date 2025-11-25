
import React, { useMemo, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import TransactionList from './TransactionList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string; // YYYY-MM
  onMonthChange: (delta: number) => void;
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

const CalendarView: React.FC<Props> = ({ 
    isOpen, onClose, currentMonth, onMonthChange, transactions, onDelete, onEdit 
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [year, month] = currentMonth.split('-').map(Number);

  // Calculate days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  // First day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // Adjust for Monday start (Mon = 0, ..., Sun = 6)
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Group transactions by date (day number)
  const dailyData = useMemo(() => {
    const data: Record<number, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      if (t.date.startsWith(currentMonth)) {
        const day = new Date(t.date).getDate();
        if (!data[day]) data[day] = { income: 0, expense: 0 };
        
        if (t.type === TransactionType.INCOME) {
          data[day].income += t.amount;
        } else {
          data[day].expense += t.amount;
        }
      }
    });
    return data;
  }, [transactions, currentMonth]);

  // Filter transactions for the selected day
  const selectedDateTransactions = useMemo(() => {
      if (!selectedDay) return [];
      return transactions.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear() === year && 
                 d.getMonth() + 1 === month && 
                 d.getDate() === selectedDay;
      });
  }, [transactions, selectedDay, year, month]);

  const formatCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            {selectedDay ? (
                <button 
                    onClick={() => setSelectedDay(null)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </button>
            ) : null}
            
            <h2 className="text-xl font-bold text-gray-800">
                {selectedDay ? `Chi tiết ngày ${selectedDay}` : 'Lịch Giao Dịch'}
            </h2>

            {!selectedDay && (
                <div className="flex items-center bg-gray-100 rounded-full p-1 ml-2">
                    <button onClick={() => onMonthChange(-1)} className="p-1 hover:bg-white rounded-full transition-all"><ChevronLeft size={16}/></button>
                    <span className="text-xs font-bold px-2">Tháng {month}/{year}</span>
                    <button onClick={() => onMonthChange(1)} className="p-1 hover:bg-white rounded-full transition-all"><ChevronRight size={16}/></button>
                </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 bg-gray-50">
            {selectedDay ? (
                // DETAIL VIEW
                <div className="p-4">
                     <TransactionList 
                        transactions={selectedDateTransactions}
                        onDelete={onDelete}
                        onEdit={(t) => {
                            onEdit(t);
                            // Optional: Close calendar or stay? Let's keep calendar open but maybe modal covers it
                        }}
                        emptyMessage="Không có giao dịch nào trong ngày này."
                     />
                </div>
            ) : (
                // CALENDAR GRID VIEW
                <div className="p-4">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                        <div key={d} className="text-xs font-bold text-gray-400 uppercase py-2">{d}</div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                        {/* Empty cells for offset */}
                        {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-transparent rounded-lg"></div>
                        ))}

                        {/* Actual Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const hasData = dailyData[day];
                        const isToday = 
                            new Date().getDate() === day && 
                            new Date().getMonth() + 1 === month && 
                            new Date().getFullYear() === year;

                        return (
                            <button 
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`aspect-square rounded-xl border flex flex-col p-1 relative transition-all hover:scale-[0.98] active:scale-95 text-left ${
                                    isToday ? 'border-primary bg-green-50 shadow-sm' : 'border-gray-200 bg-white shadow-sm hover:border-primary/50'
                                }`}
                            >
                            <span className={`text-xs font-bold mb-auto ${isToday ? 'text-primary' : 'text-gray-600'}`}>{day}</span>
                            
                            {hasData && (
                                <div className="flex flex-col items-end gap-0.5 mt-1 w-full">
                                    {hasData.income > 0 && (
                                        <span className="text-[10px] font-bold text-emerald-600 leading-tight bg-emerald-50 px-1 rounded-sm w-full text-right truncate">
                                            +{formatCompact(hasData.income)}
                                        </span>
                                    )}
                                    {hasData.expense > 0 && (
                                        <span className="text-[10px] font-bold text-red-500 leading-tight bg-red-50 px-1 rounded-sm w-full text-right truncate">
                                            -{formatCompact(hasData.expense)}
                                        </span>
                                    )}
                                </div>
                            )}
                            </button>
                        );
                        })}
                    </div>

                     {/* Legend */}
                    <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Thu nhập
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div> Chi tiêu
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
