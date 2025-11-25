
import React from 'react';
import { RecurringBill, Category, Wallet } from '../types';
import { CalendarClock, CheckCircle2, X, CreditCard, AlertTriangle, Calendar } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bill: RecurringBill | null;
  onPay: (bill: RecurringBill, walletId: string) => void;
  wallets: Wallet[];
}

const BillDetailModal: React.FC<Props> = ({ isOpen, onClose, bill, onPay, wallets }) => {
  const [selectedWalletId, setSelectedWalletId] = React.useState<string>(wallets[0]?.id || '');

  if (!isOpen || !bill) return null;

  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(bill.dueDay);
  
  // Logic xác định trạng thái hiển thị
  const isOverdue = today.getDate() > bill.dueDay;
  const daysRemaining = bill.dueDay - today.getDate();

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const handlePay = () => {
      onPay(bill, selectedWalletId);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-8 text-white text-center relative ${isOverdue ? 'bg-red-500' : 'bg-violet-600'}`}>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <X size={20} />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <CalendarClock size={32} />
            </div>
            <h3 className="text-xl font-bold">{bill.name}</h3>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mt-1">{bill.category}</p>
            
            {isOverdue ? (
                <div className="inline-flex items-center gap-1 bg-red-700/50 px-3 py-1 rounded-full text-xs font-bold mt-3 border border-red-400">
                    <AlertTriangle size={12} /> Quá hạn {today.getDate() - bill.dueDay} ngày
                </div>
            ) : (
                 <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mt-3">
                    <Calendar size={12} /> Hạn: Ngày {bill.dueDay}
                </div>
            )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Số tiền cần thanh toán</p>
                <p className={`text-3xl font-bold ${isOverdue ? 'text-red-600' : 'text-violet-600'}`}>{formatCurrency(bill.amount)}</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nguồn tiền thanh toán</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <CreditCard size={18} />
                    </div>
                    <select
                        value={selectedWalletId}
                        onChange={(e) => setSelectedWalletId(e.target.value)}
                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none appearance-none font-medium text-gray-700"
                    >
                        {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.currentBalance)})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 flex gap-2 items-start border border-gray-100">
                <CheckCircle2 size={16} className="shrink-0 text-green-500 mt-0.5"/>
                <p>Hệ thống sẽ tự động tạo giao dịch chi tiêu và đánh dấu hóa đơn này là "Đã trả" trong tháng hiện tại.</p>
            </div>

            <button 
                onClick={handlePay}
                className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${isOverdue ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'}`}
            >
                Xác nhận thanh toán
            </button>
        </div>
      </div>
    </div>
  );
};

export default BillDetailModal;
