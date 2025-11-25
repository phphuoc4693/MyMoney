
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Store, Package, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownLeft, BarChart3, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import TransactionList from './TransactionList';

interface Props {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  isPrivacyMode?: boolean;
}

const BusinessManager: React.FC<Props> = ({ transactions, onAddTransaction, onEditTransaction, onDeleteTransaction, isPrivacyMode = false }) => {
  const [timeRange, setTimeRange] = useState<number>(6); // Months

  // Filter Business Transactions
  const businessTrans = useMemo(() => {
      return transactions.filter(t => 
          t.category === Category.SELLING || 
          t.category === Category.BUSINESS_COST
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Calculate Stats
  const stats = useMemo(() => {
      const revenue = businessTrans
        .filter(t => t.category === Category.SELLING)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const cost = businessTrans
        .filter(t => t.category === Category.BUSINESS_COST)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const profit = revenue - cost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return { revenue, cost, profit, margin };
  }, [businessTrans]);

  // Chart Data
  const chartData = useMemo(() => {
      const data: any[] = [];
      const today = new Date();
      
      for (let i = timeRange - 1; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthKey = d.toISOString().slice(0, 7);
          const monthLabel = `T${d.getMonth() + 1}`;

          const monthly = businessTrans.filter(t => t.date.startsWith(monthKey));
          const rev = monthly.filter(t => t.category === Category.SELLING).reduce((sum, t) => sum + t.amount, 0);
          const cst = monthly.filter(t => t.category === Category.BUSINESS_COST).reduce((sum, t) => sum + t.amount, 0);

          data.push({
              name: monthLabel,
              DoanhThu: rev,
              ChiPhi: cst,
              LoiNhuan: rev - cst
          });
      }
      return data;
  }, [businessTrans, timeRange]);

  const formatCurrency = (val: number) => {
      if (isPrivacyMode) return '******';
      if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(2)} tỷ`;
      if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)} tr`;
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatCurrencyFull = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-200">
                  <Store size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-gray-800">Quản Lý Kinh Doanh</h2>
                  <p className="text-sm text-gray-500">Theo dõi hiệu quả bán hàng</p>
              </div>
          </div>
          <div className="flex gap-2">
                <button 
                    onClick={() => onAddTransaction({
                        amount: 0,
                        type: TransactionType.INCOME,
                        category: Category.SELLING,
                        note: 'Doanh thu bán hàng',
                        date: new Date().toISOString()
                    })}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-colors text-sm"
                >
                    <TrendingUp size={16} /> Nhập Thu
                </button>
                <button 
                    onClick={() => onAddTransaction({
                        amount: 0,
                        type: TransactionType.EXPENSE,
                        category: Category.BUSINESS_COST,
                        note: 'Chi phí nhập hàng/vận hành',
                        date: new Date().toISOString()
                    })}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold shadow-md hover:bg-red-600 transition-colors text-sm"
                >
                    <Package size={16} /> Nhập Chi
                </button>
          </div>
      </div>

      {/* P&L Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <ArrowUpRight size={20} />
                  <span className="text-xs font-bold uppercase">Tổng Doanh Thu</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatCurrencyFull(stats.revenue)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-red-500">
                  <ArrowDownLeft size={20} />
                  <span className="text-xs font-bold uppercase">Tổng Chi Phí (Vốn)</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{formatCurrencyFull(stats.cost)}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 p-5 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2 text-violet-200">
                  <DollarSign size={20} />
                  <span className="text-xs font-bold uppercase">Lợi Nhuận Ròng</span>
              </div>
              <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold">{formatCurrencyFull(stats.profit)}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stats.margin > 20 ? 'bg-emerald-400 text-emerald-900' : stats.margin > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-red-400 text-red-900'}`}>
                      Margin: {stats.margin.toFixed(1)}%
                  </span>
              </div>
          </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 size={18} /> Hiệu quả kinh doanh</h3>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[3, 6, 12].map(range => (
                          <button 
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeRange === range ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}
                          >
                              {range} Tháng
                          </button>
                      ))}
                  </div>
              </div>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={formatCurrency} />
                          <Tooltip 
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => formatCurrencyFull(value)}
                          />
                          <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#10B981" radius={[4,4,0,0]} barSize={20} />
                          <Bar dataKey="ChiPhi" name="Chi Phí" fill="#EF4444" radius={[4,4,0,0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Calendar size={18} /> Giao dịch gần đây</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                  <TransactionList 
                    transactions={businessTrans.slice(0, 10)}
                    onDelete={onDeleteTransaction}
                    onEdit={onEditTransaction}
                    isPrivacyMode={isPrivacyMode}
                    emptyMessage="Chưa có giao dịch kinh doanh."
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

export default BusinessManager;
