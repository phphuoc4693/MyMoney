
import React, { useState } from 'react';
import { Debt, Transaction, TransactionType, Category } from '../types';
import { User, ArrowUpRight, ArrowDownLeft, Calendar, CheckCircle, Trash2, Plus } from 'lucide-react';

interface Props {
  debts: Debt[];
  onAddDebt: (debt: Omit<Debt, 'id' | 'isPaid'>) => void;
  onDeleteDebt: (id: string) => void;
  onSettleDebt: (debt: Debt) => void;
}

const DebtManager: React.FC<Props> = ({ debts, onAddDebt, onDeleteDebt, onSettleDebt }) => {
  const [activeTab, setActiveTab] = useState<'LEND' | 'BORROW'>('LEND');
  const [isAdding, setIsAdding] = useState(false);
  const [newDebt, setNewDebt] = useState({ person: '', amount: '', dueDate: '', note: '' });

  const filteredDebts = debts.filter(d => d.type === activeTab && !d.isPaid);
  const settledDebts = debts.filter(d => d.type === activeTab && d.isPaid);

  const totalActive = filteredDebts.reduce((sum, d) => sum + d.amount, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddDebt({
          person: newDebt.person,
          amount: parseFloat(newDebt.amount),
          type: activeTab,
          dueDate: newDebt.dueDate,
          note: newDebt.note
      });
      setIsAdding(false);
      setNewDebt({ person: '', amount: '', dueDate: '', note: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
          <div>
              <h2 className="text-2xl font-bold text-gray-800">Sổ Nợ</h2>
              <p className="text-sm text-gray-500">Ghi nhớ các khoản vay mượn</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
          >
              <Plus size={20} /> Thêm mới
          </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
          <button 
             onClick={() => setActiveTab('LEND')}
             className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'LEND' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
          >
              <ArrowUpRight size={18} /> Cần thu (Cho vay)
          </button>
          <button 
             onClick={() => setActiveTab('BORROW')}
             className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'BORROW' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}
          >
              <ArrowDownLeft size={18} /> Phải trả (Đi vay)
          </button>
      </div>

      {/* Summary */}
      <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col items-center justify-center ${activeTab === 'LEND' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-pink-600'}`}>
          <span className="text-sm font-medium opacity-90 mb-1">{activeTab === 'LEND' ? 'TỔNG TIỀN CẦN THU VỀ' : 'TỔNG TIỀN ĐANG NỢ'}</span>
          <span className="text-3xl font-bold">{formatCurrency(totalActive)}</span>
      </div>

      {/* Add Form */}
      {isAdding && (
           <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-800 mb-4">{activeTab === 'LEND' ? 'Tạo khoản cho vay mới' : 'Tạo khoản nợ mới'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{activeTab === 'LEND' ? 'Người vay' : 'Chủ nợ'}</label>
                      <input 
                        required
                        value={newDebt.person}
                        onChange={e => setNewDebt({...newDebt, person: e.target.value})}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Tên người..."
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền</label>
                        <input 
                            type="number"
                            required
                            value={newDebt.amount}
                            onChange={e => setNewDebt({...newDebt, amount: e.target.value})}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạn trả (Tùy chọn)</label>
                        <input 
                            type="date"
                            value={newDebt.dueDate}
                            onChange={e => setNewDebt({...newDebt, dueDate: e.target.value})}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú</label>
                      <input 
                        value={newDebt.note}
                        onChange={e => setNewDebt({...newDebt, note: e.target.value})}
                        className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Lý do..."
                      />
                  </div>
                  <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200">Hủy</button>
                      <button type="submit" className="flex-1 py-3 text-white bg-primary rounded-xl font-bold hover:bg-green-700">Lưu lại</button>
                  </div>
              </form>
          </div>
      )}

      {/* List */}
      <div className="space-y-3">
          {filteredDebts.map(debt => (
              <div key={debt.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${activeTab === 'LEND' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                          {debt.person.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <h4 className="font-bold text-gray-800">{debt.person}</h4>
                          <p className="text-xs text-gray-500">{debt.note || (activeTab === 'LEND' ? 'Cho vay' : 'Vay tiền')}</p>
                          {debt.dueDate && (
                              <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${new Date(debt.dueDate) < new Date() ? 'text-red-500' : 'text-blue-500'}`}>
                                  <Calendar size={12} /> {new Date(debt.dueDate).toLocaleDateString('vi-VN')}
                                  {new Date(debt.dueDate) < new Date() && <span>(Quá hạn)</span>}
                              </div>
                          )}
                      </div>
                  </div>
                  <div className="text-right">
                      <p className={`font-bold text-lg ${activeTab === 'LEND' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(debt.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onDeleteDebt(debt.id)}
                            className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                          <button 
                             onClick={() => onSettleDebt(debt)}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1 transition-colors shadow-sm ${activeTab === 'LEND' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                          >
                              <CheckCircle size={12} /> {activeTab === 'LEND' ? 'Đã thu' : 'Đã trả'}
                          </button>
                      </div>
                  </div>
              </div>
          ))}
          {filteredDebts.length === 0 && !isAdding && (
              <div className="text-center py-12 text-gray-400">
                  <User size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Không có khoản {activeTab === 'LEND' ? 'phải thu' : 'phải trả'} nào.</p>
              </div>
          )}
      </div>
      
      {/* Completed/History Section */}
      {settledDebts.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Lịch sử đã hoàn thành</h3>
              <div className="space-y-2 opacity-60">
                  {settledDebts.map(debt => (
                      <div key={debt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                           <span className="font-medium text-gray-600 line-through">{debt.person}</span>
                           <span className="font-bold text-gray-600 line-through">{formatCurrency(debt.amount)}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default DebtManager;
