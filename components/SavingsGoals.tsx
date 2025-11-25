
import React, { useState, useRef } from 'react';
import { SavingsGoal } from '../types';
import { Plus, Target, Trash2, Trophy, PiggyBank, Calendar, TrendingUp, Clock, CheckCircle2, Calculator, ArrowRight, ImageIcon, X, Minus } from 'lucide-react';

interface Props {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onDeleteGoal: (id: string) => void;
  onDeposit: (goalId: string, amount: number) => void;
  onWithdraw: (goalId: string, amount: number) => void;
}

const SavingsGoals: React.FC<Props> = ({ goals, onAddGoal, onDeleteGoal, onDeposit, onWithdraw }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState<{ name: string; targetAmount: string; deadline: string; image?: string }>({ name: '', targetAmount: '', deadline: '', image: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Transaction Modal State
  const [activeGoalAction, setActiveGoalAction] = useState<{ type: 'DEPOSIT' | 'WITHDRAW', goalId: string } | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      color: 'bg-blue-500',
      icon: 'PiggyBank',
      image: newGoal.image
    });
    setIsAdding(false);
    setNewGoal({ name: '', targetAmount: '', deadline: '', image: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewGoal(prev => ({ ...prev, image: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  }

  const handleTransactionSubmit = () => {
      if (!activeGoalAction || !transactionAmount) return;
      const amount = parseFloat(transactionAmount);
      if (isNaN(amount) || amount <= 0) return;

      if (activeGoalAction.type === 'DEPOSIT') {
          onDeposit(activeGoalAction.goalId, amount);
      } else {
          onWithdraw(activeGoalAction.goalId, amount);
      }
      setActiveGoalAction(null);
      setTransactionAmount('');
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- Motivational Logic ---
  const getMotivationMessage = (percent: number) => {
      if (percent >= 100) return "Tuyệt vời! Bạn đã cán đích!";
      if (percent >= 75) return "Sắp xong rồi, cố lên!";
      if (percent >= 50) return "Đã đi được nửa chặng đường!";
      if (percent >= 25) return "Khởi đầu rất thuận lợi!";
      return "Tích tiểu thành đại, bắt đầu ngay!";
  };

  const calculateDailySave = (target: number, current: number, deadlineStr: string) => {
      if (!deadlineStr) return null;
      const deadline = new Date(deadlineStr);
      const today = new Date();
      const diffTime = Math.abs(deadline.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return null;
      
      const remaining = target - current;
      if (remaining <= 0) return null;

      return {
          daily: remaining / diffDays,
          days: diffDays
      };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-3xl text-white shadow-lg shadow-pink-200">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Trophy size={32} className="text-yellow-300" />
            </div>
            <div>
                <h2 className="text-2xl font-bold">Mục tiêu Tiết kiệm</h2>
                <p className="text-pink-100 text-sm">Biến ước mơ thành hiện thực</p>
            </div>
        </div>
        <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-white text-pink-600 px-5 py-3 rounded-xl font-bold hover:bg-pink-50 transition-colors shadow-md"
        >
            <Plus size={20} /> Thêm mục tiêu
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-pink-100 mb-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <h3 className="font-bold text-gray-800 mb-4 relative z-10">Thiết lập mục tiêu mới</h3>
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tôi muốn tiết kiệm cho...</label>
                      <input 
                        required
                        value={newGoal.name}
                        onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none font-medium"
                        placeholder="Ví dụ: Mua iPhone 16, Du lịch Đà Lạt..."
                        autoFocus
                      />
                  </div>

                  {/* Image Upload */}
                  <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hình ảnh mục tiêu (Tùy chọn)</label>
                       <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-pink-400 transition-all overflow-hidden relative group"
                       >
                           {newGoal.image ? (
                               <>
                                <img src={newGoal.image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold text-sm">Thay đổi ảnh</div>
                               </>
                           ) : (
                               <div className="flex flex-col items-center text-gray-400">
                                   <ImageIcon size={32} className="mb-2" />
                                   <span className="text-xs">Bấm để tải ảnh lên</span>
                               </div>
                           )}
                           <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                       </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số tiền cần (VND)</label>
                        <div className="relative">
                            <input 
                                type="number"
                                required
                                value={newGoal.targetAmount}
                                onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                                className="w-full p-4 pl-12 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none font-bold text-lg"
                                placeholder="0"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₫</div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hạn chót (Rất quan trọng)</label>
                        <div className="relative">
                            <input 
                                type="date"
                                value={newGoal.deadline}
                                onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                                className="w-full p-4 pl-12 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none font-medium text-gray-700"
                            />
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                      </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3.5 text-gray-600 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                      <button type="submit" className="flex-1 py-3.5 text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl font-bold hover:shadow-lg hover:shadow-pink-200 transition-all">Tạo Mục Tiêu</button>
                  </div>
              </form>
          </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map(goal => {
            const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const isCompleted = percent >= 100;
            const plan = calculateDailySave(goal.targetAmount, goal.currentAmount, goal.deadline);
            const remaining = goal.targetAmount - goal.currentAmount;

            return (
                <div key={goal.id} className={`bg-white rounded-3xl border transition-all shadow-sm hover:shadow-md relative overflow-hidden group flex flex-col h-full ${isCompleted ? 'border-yellow-200' : 'border-gray-100'}`}>
                    
                    {/* Goal Image Cover */}
                    <div className="h-32 bg-gray-100 relative overflow-hidden">
                        {goal.image ? (
                            <>
                                <img src={goal.image} alt={goal.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </>
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                <Trophy className="text-white/50 w-24 h-24" />
                            </div>
                        )}
                        
                        {/* Title Overlay */}
                        <div className="absolute bottom-4 left-6 right-6 text-white z-10">
                            <h3 className={`font-bold text-xl line-clamp-1 ${!goal.image ? 'text-gray-800' : 'text-white'}`}>{goal.name}</h3>
                             <div className={`flex items-center gap-2 text-xs mt-1 ${!goal.image ? 'text-gray-500' : 'text-white/80'}`}>
                                {goal.deadline ? (
                                    <span className={`flex items-center gap-1 ${plan && plan.days < 7 && !isCompleted ? 'text-red-400 font-bold' : ''}`}>
                                        <Clock size={12} /> Còn {plan?.days || 0} ngày
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1"><Clock size={12} /> Không thời hạn</span>
                                )}
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button onClick={() => onDeleteGoal(goal.id)} className="absolute top-3 right-3 bg-black/30 hover:bg-red-500 text-white p-2 rounded-full backdrop-blur-md transition-colors z-20">
                             <Trash2 size={16} />
                        </button>

                        {/* Completed Badge */}
                         {isCompleted && (
                            <div className="absolute top-3 left-3 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                                <Trophy size={12} /> Hoàn thành
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                        {/* Amount & Progress */}
                        <div className="mb-6">
                             <div className="flex justify-between items-end mb-2">
                                 <div>
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-1">Đã tích lũy</p>
                                     <p className={`text-3xl font-bold ${isCompleted ? 'text-yellow-600' : 'text-gray-800'}`}>
                                         {formatCurrency(goal.currentAmount)}
                                     </p>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs text-gray-400 font-bold uppercase mb-1">Mục tiêu</p>
                                     <p className="text-sm font-bold text-gray-500">{formatCurrency(goal.targetAmount)}</p>
                                 </div>
                             </div>

                             <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isCompleted ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-pink-500 to-rose-400'}`}
                                    style={{ width: `${percent}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                             </div>
                             
                             <div className="flex justify-between mt-2 items-center">
                                 <span className={`text-xs font-bold ${isCompleted ? 'text-yellow-600' : 'text-pink-500'}`}>
                                     {getMotivationMessage(percent)}
                                 </span>
                                 <span className="text-xs font-bold text-gray-600">{percent.toFixed(2)}%</span>
                             </div>
                        </div>

                        {/* Smart Plan (Calculator) */}
                        {!isCompleted && remaining > 0 && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                {plan ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                                <Calculator size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Kế hoạch mỗi ngày</p>
                                                <p className="text-sm font-bold text-blue-600">Cần tiết kiệm {formatCurrency(plan.daily)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <TrendingUp size={16} />
                                        <span>Hãy đặt hạn chót để có kế hoạch cụ thể!</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="mt-auto flex gap-3">
                             <button 
                                onClick={() => setActiveGoalAction({ type: 'WITHDRAW', goalId: goal.id })}
                                disabled={goal.currentAmount <= 0}
                                className="flex-1 py-3 rounded-xl bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <Minus size={18} /> Rút
                             </button>
                             <button 
                                onClick={() => setActiveGoalAction({ type: 'DEPOSIT', goalId: goal.id })}
                                className={`flex-1 py-3 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-1 shadow-lg ${isCompleted ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-300'}`}
                             >
                                 <Plus size={18} /> Nạp
                             </button>
                        </div>
                    </div>
                </div>
            );
        })}
        
        {/* Empty State */}
        {goals.length === 0 && !isAdding && (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-pink-50 text-pink-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-700">Chưa có mục tiêu nào</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2 mb-6">Đặt mục tiêu (mua xe, du lịch...) giúp bạn có động lực tiết kiệm hơn gấp 3 lần.</p>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="text-pink-600 font-bold hover:bg-pink-50 px-4 py-2 rounded-xl transition-colors"
                >
                    + Tạo mục tiêu đầu tiên
                </button>
            </div>
        )}
      </div>

      {/* Transaction Modal (Deposit/Withdraw) */}
      {activeGoalAction && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6">
                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${activeGoalAction.type === 'DEPOSIT' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {activeGoalAction.type === 'DEPOSIT' ? <Plus size={24} /> : <Minus size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                        {activeGoalAction.type === 'DEPOSIT' ? 'Nạp tiền vào mục tiêu' : 'Rút tiền từ mục tiêu'}
                    </h3>
                  </div>
                  <div className="relative mb-6">
                    <input 
                        type="number" 
                        value={transactionAmount} 
                        onChange={(e) => setTransactionAmount(e.target.value)} 
                        className="w-full border-2 border-gray-200 rounded-2xl p-4 text-2xl font-bold text-center focus:border-primary focus:ring-0 outline-none transition-colors text-gray-800" 
                        placeholder="0" 
                        autoFocus 
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400 font-medium">VND</span>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => { setActiveGoalAction(null); setTransactionAmount(''); }} className="flex-1 py-3.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Hủy bỏ</button>
                      <button 
                        onClick={handleTransactionSubmit} 
                        className={`flex-1 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all ${activeGoalAction.type === 'DEPOSIT' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'}`}
                      >
                        Xác nhận
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SavingsGoals;
