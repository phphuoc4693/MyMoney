
import React, { useState, useMemo } from 'react';
import { RecurringBill, Transaction, Category, TransactionType } from '../types';
import { CalendarClock, CheckCircle2, Circle, Plus, Trash2, Zap, Clock, AlertTriangle, Check, ArrowRight, Calendar, Edit2, X } from 'lucide-react';

interface Props {
  bills: RecurringBill[];
  transactions: Transaction[]; // Needed to check if paid this month
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onDeleteBill: (id: string) => void;
  onPayBill: (bill: RecurringBill) => void;
  onUpdateBill: (id: string, bill: Partial<RecurringBill>) => void;
}

const RecurringBills: React.FC<Props> = ({ bills, transactions, onAddBill, onDeleteBill, onPayBill, onUpdateBill }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newBill, setNewBill] = useState({ name: '', amount: '', day: '1', category: Category.BILLS });
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const todayDate = new Date().getDate();

  // --- HELPERS ---
  const isPaidThisMonth = (billName: string) => {
      return transactions.some(t => 
          t.date.startsWith(currentMonth) && 
          t.type === TransactionType.EXPENSE &&
          t.note.toLowerCase().includes(billName.toLowerCase())
      );
  };

  const getStatus = (bill: RecurringBill) => {
      if (isPaidThisMonth(bill.name)) return 'PAID';
      if (bill.dueDay < todayDate) return 'OVERDUE';
      if (bill.dueDay === todayDate) return 'TODAY';
      return 'UPCOMING';
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const billData = {
        name: newBill.name,
        amount: parseFloat(newBill.amount),
        dueDay: parseInt(newBill.day),
        category: newBill.category
    };

    if (editingBill) {
        onUpdateBill(editingBill.id, billData);
        setEditingBill(null);
    } else {
        onAddBill(billData);
    }
    
    setIsAdding(false);
    setNewBill({ name: '', amount: '', day: '1', category: Category.BILLS });
  };

  const openEdit = (bill: RecurringBill) => {
      setNewBill({
          name: bill.name,
          amount: bill.amount.toString(),
          day: bill.dueDay.toString(),
          category: bill.category as Category
      });
      setEditingBill(bill);
      setIsAdding(true);
  };

  // --- CALCULATED DATA ---
  const processedBills = useMemo(() => {
      let sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);
      
      if (filter === 'PAID') sorted = sorted.filter(b => isPaidThisMonth(b.name));
      if (filter === 'UNPAID') sorted = sorted.filter(b => !isPaidThisMonth(b.name));

      return sorted;
  }, [bills, transactions, filter]);

  const stats = useMemo(() => {
      let total = 0;
      let paid = 0;
      let remaining = 0;
      let overdueCount = 0;

      bills.forEach(b => {
          total += b.amount;
          if (isPaidThisMonth(b.name)) {
              paid += b.amount;
          } else {
              remaining += b.amount;
              if (b.dueDay < todayDate) overdueCount++;
          }
      });
      return { total, paid, remaining, overdueCount };
  }, [bills, transactions]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div>
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><CalendarClock size={22}/> Quản lý Hóa đơn</h2>
                    <p className="text-violet-100 text-sm">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                </div>
                <div className="flex items-end gap-4 mt-6">
                    <div>
                        <p className="text-xs text-violet-200 font-bold uppercase mb-1">Tổng dự kiến</p>
                        <p className="text-3xl font-bold">{formatCurrency(stats.total)}</p>
                    </div>
                    <div className="h-8 w-px bg-white/20"></div>
                    <div>
                        <p className="text-xs text-violet-200 font-bold uppercase mb-1">Còn phải trả</p>
                        <p className="text-xl font-bold text-white/90">{formatCurrency(stats.remaining)}</p>
                    </div>
                </div>
                {stats.overdueCount > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-1">
                        <AlertTriangle size={12} /> {stats.overdueCount} Quá hạn
                    </div>
                )}
           </div>

           <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-3 relative">
                   <CheckCircle2 size={32} />
                   <div className="absolute inset-0 border-4 border-green-100 rounded-full"></div>
                   <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-green-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${stats.total > 0 ? (stats.paid / stats.total) * 100 : 0}, 100`}
                        />
                    </svg>
               </div>
               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tiến độ thanh toán</p>
               <p className="text-lg font-bold text-gray-800">{stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0}%</p>
           </div>
      </div>

      {/* Timeline Visualizer */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Calendar size={14} /> Dòng thời gian</h3>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                  const billOnDay = bills.find(b => b.dueDay === day);
                  const isToday = day === todayDate;
                  const status = billOnDay ? getStatus(billOnDay) : null;
                  
                  let dotColor = 'bg-gray-200';
                  if (status === 'PAID') dotColor = 'bg-green-500';
                  else if (status === 'OVERDUE') dotColor = 'bg-red-500';
                  else if (status === 'TODAY') dotColor = 'bg-orange-500';
                  else if (status === 'UPCOMING') dotColor = 'bg-blue-500';

                  return (
                      <div key={day} className={`min-w-[36px] flex flex-col items-center gap-2 group ${isToday ? 'bg-blue-50 rounded-lg py-1' : ''}`}>
                          <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{day}</span>
                          <div className={`w-2 h-2 rounded-full ${billOnDay ? dotColor : 'bg-gray-100'} transition-all group-hover:scale-125`} title={billOnDay?.name}></div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
          <div className="flex bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setFilter('ALL')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Tất cả</button>
              <button onClick={() => setFilter('UNPAID')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'UNPAID' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}>Chưa trả</button>
              <button onClick={() => setFilter('PAID')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'PAID' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}>Đã trả</button>
          </div>
          <button 
            onClick={() => { setEditingBill(null); setIsAdding(true); setNewBill({ name: '', amount: '', day: '1', category: Category.BILLS }); }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors text-xs"
          >
              <Plus size={16} /> Thêm hóa đơn
          </button>
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-800 text-lg">{editingBill ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn định kỳ'}</h3>
                      <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={18}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên hóa đơn</label>
                            <input 
                                required
                                value={newBill.name}
                                onChange={e => setNewBill({...newBill, name: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                                placeholder="VD: Netflix..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền dự kiến</label>
                            <input 
                                type="number"
                                required
                                value={newBill.amount}
                                onChange={e => setNewBill({...newBill, amount: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày trả hàng tháng</label>
                            <select 
                                value={newBill.day}
                                onChange={e => setNewBill({...newBill, day: e.target.value})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                            >
                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                    <option key={d} value={d}>Ngày {d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Danh mục</label>
                             <select
                                value={newBill.category}
                                onChange={e => setNewBill({...newBill, category: e.target.value as Category})}
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 outline-none"
                            >
                                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3.5 text-white bg-violet-600 rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all mt-2">
                          {editingBill ? 'Cập nhật' : 'Lưu Hóa Đơn'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Bill List */}
      <div className="space-y-3">
          {processedBills.map(bill => {
              const status = getStatus(bill);
              const isPaid = status === 'PAID';
              
              let statusColor = 'text-gray-500';
              let statusText = 'Sắp tới';
              let cardBorder = 'border-gray-100';
              let iconBg = 'bg-gray-100 text-gray-400';

              if (status === 'OVERDUE') {
                  statusColor = 'text-red-500';
                  statusText = 'Quá hạn';
                  cardBorder = 'border-red-200 bg-red-50/10';
                  iconBg = 'bg-red-100 text-red-500';
              } else if (status === 'TODAY') {
                  statusColor = 'text-orange-500';
                  statusText = 'Hôm nay';
                  cardBorder = 'border-orange-200 bg-orange-50/10';
                  iconBg = 'bg-orange-100 text-orange-500';
              } else if (status === 'PAID') {
                  statusColor = 'text-green-600';
                  statusText = 'Đã thanh toán';
                  cardBorder = 'border-green-200 bg-green-50/10';
                  iconBg = 'bg-green-100 text-green-600';
              }

              return (
                  <div key={bill.id} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between group transition-all ${cardBorder}`}>
                      <div className="flex items-center gap-4" onClick={() => openEdit(bill)}>
                          <div className={`p-3 rounded-full ${iconBg}`}>
                                {isPaid ? <CheckCircle2 size={24} /> : status === 'OVERDUE' ? <AlertTriangle size={24} /> : <Clock size={24} />}
                          </div>
                          <div className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                  <h4 className={`font-bold text-lg ${isPaid ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{bill.name}</h4>
                                  {status === 'OVERDUE' && <span className="px-2 py-0.5 bg-red-100 text-red-500 text-[10px] font-bold rounded-full">Gấp</span>}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                  <span className={`font-semibold ${isPaid ? 'text-gray-400' : 'text-violet-600'}`}>{formatCurrency(bill.amount)}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className={`font-medium text-xs ${statusColor}`}>{statusText} (Ngày {bill.dueDay})</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-2">
                          {!isPaid && (
                              <button 
                                onClick={() => onPayBill(bill)}
                                className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl shadow-md shadow-violet-200 hover:bg-violet-700 transition-colors flex items-center gap-1"
                              >
                                <Zap size={16} /> <span className="hidden sm:inline">Trả ngay</span>
                              </button>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openEdit(bill)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit2 size={18} />
                             </button>
                             <button onClick={() => onDeleteBill(bill.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={18} />
                             </button>
                          </div>
                      </div>
                  </div>
              )
          })}
          
          {processedBills.length === 0 && !isAdding && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                <CalendarClock size={48} className="mx-auto mb-3 opacity-50" />
                <p>Không có hóa đơn nào phù hợp.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default RecurringBills;
