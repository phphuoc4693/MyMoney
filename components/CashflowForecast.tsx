
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, RecurringBill, Category } from '../types';
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Leaf, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, ComposedChart, Line } from 'recharts';

interface Props {
  transactions: Transaction[];
  recurringBills: RecurringBill[];
  budget: number;
  isPrivacyMode?: boolean;
}

type Scenario = 'SAVER' | 'AVERAGE' | 'SPENDER';

const CashflowForecast: React.FC<Props> = ({ transactions, recurringBills, budget, isPrivacyMode = false }) => {
  const [scenario, setScenario] = useState<Scenario>('AVERAGE');

  const analysis = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysRemaining = daysInMonth - currentDay;

    // 1. Current Status
    const expenseTrans = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const currentTotalExpense = expenseTrans.reduce((sum, t) => sum + t.amount, 0);

    // 2. Calculate Variable Spending (Non-Bills) Avg
    // We exclude known bill categories to get "daily lifestyle spending"
    const variableExpenses = expenseTrans.filter(t => 
        t.category !== Category.BILLS && 
        t.category !== Category.HOUSING && 
        t.category !== Category.INSURANCE
    );
    
    const variableSum = variableExpenses.reduce((sum, t) => sum + t.amount, 0);
    const avgDailyVariable = currentDay > 0 ? variableSum / currentDay : 0;

    // 3. Remaining Bills (Fixed Cost)
    const remainingBills = recurringBills.filter(b => {
         // Check if paid this month
         const isPaid = transactions.some(t => 
             t.type === TransactionType.EXPENSE &&
             t.note.toLowerCase().includes(b.name.toLowerCase()) && 
             t.date.startsWith(today.toISOString().slice(0,7))
         );
         return !isPaid && b.dueDay > currentDay;
    });
    
    const remainingBillsTotal = remainingBills.reduce((sum, b) => sum + b.amount, 0);

    // 4. Safe-to-Spend Logic
    // Formula: (Budget - Current - Future Bills) / Days Left
    const remainingBudget = budget - currentTotalExpense;
    const trueDisposable = remainingBudget - remainingBillsTotal;
    const safeDailySpend = daysRemaining > 0 ? Math.max(0, trueDisposable / daysRemaining) : 0;

    // 5. Generate Chart Data (Past + Future)
    const chartData = [];
    let cumulativeExpense = 0;

    // Past Days
    for (let d = 1; d <= currentDay; d++) {
        const dayExpenses = expenseTrans
            .filter(t => new Date(t.date).getDate() === d)
            .reduce((sum, t) => sum + t.amount, 0);
        cumulativeExpense += dayExpenses;
        chartData.push({
            day: d,
            actual: cumulativeExpense,
            projected: null,
            limit: budget,
            isToday: d === currentDay
        });
    }

    // Future Days
    let projectedCumulative = cumulativeExpense;
    
    // Scenario Multiplier
    let multiplier = 1;
    if (scenario === 'SAVER') multiplier = 0.8; // Save 20% on variable
    if (scenario === 'SPENDER') multiplier = 1.2; // Spend 20% more

    for (let d = currentDay + 1; d <= daysInMonth; d++) {
        // Add Bills due on this day
        const billsDue = remainingBills.filter(b => b.dueDay === d).reduce((sum, b) => sum + b.amount, 0);
        
        // Add Variable Spend
        projectedCumulative += billsDue + (avgDailyVariable * multiplier);
        
        chartData.push({
            day: d,
            actual: null,
            projected: projectedCumulative,
            limit: budget,
            isToday: false
        });
    }

    const finalProjection = chartData[chartData.length - 1].projected || 0;
    const savingsPotential = Math.max(0, budget - finalProjection);
    const status = finalProjection > budget ? 'DANGER' : finalProjection > budget * 0.9 ? 'WARNING' : 'SAFE';

    return {
        chartData,
        safeDailySpend,
        finalProjection,
        savingsPotential,
        status,
        daysRemaining,
        remainingBillsTotal,
        trueDisposable,
        currentDay
    };
  }, [transactions, recurringBills, budget, scenario]);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formatCurrencyFull = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${analysis.status === 'DANGER' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <TrendingUp size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-sm">Dự báo dòng tiền</h3>
                    <p className="text-[10px] text-gray-500">Còn {analysis.daysRemaining} ngày trong tháng</p>
                </div>
            </div>
            
            {/* Scenario Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setScenario('SAVER')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${scenario === 'SAVER' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Tiết kiệm</button>
                <button onClick={() => setScenario('AVERAGE')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${scenario === 'AVERAGE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Hiện tại</button>
                <button onClick={() => setScenario('SPENDER')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${scenario === 'SPENDER' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Xả láng</button>
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 p-5 bg-gradient-to-b from-white to-gray-50">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                    <Target size={12} /> Định mức an toàn
                </p>
                <p className={`text-xl font-bold ${analysis.safeDailySpend > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    {formatCurrencyFull(analysis.safeDailySpend)}
                    <span className="text-xs text-gray-400 font-medium ml-1">/ngày</span>
                </p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                    <Leaf size={12} /> Tiềm năng tiết kiệm
                </p>
                <p className={`text-xl font-bold ${analysis.savingsPotential > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {formatCurrencyFull(analysis.savingsPotential)}
                </p>
            </div>
        </div>

        {/* Chart */}
        <div className="px-2 pb-2 h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} interval={4} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={formatCurrency} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        formatter={(value: number) => formatCurrencyFull(value)}
                        labelFormatter={(l) => `Ngày ${l}`}
                    />
                    <ReferenceLine y={budget} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Ngân sách', fill: '#EF4444', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceLine x={analysis.currentDay} stroke="#9CA3AF" strokeDasharray="3 3" />
                    
                    {/* Actual Spending Area */}
                    <Area type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} fill="url(#colorActual)" name="Thực tế" />
                    
                    {/* Projected Line */}
                    <Area type="monotone" dataKey="projected" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorProjected)" name="Dự báo" />
                    
                    {/* Today Dot */}
                    {/* We create a separate Line just for the dot */}
                    <Line dataKey={(d) => d.isToday ? d.actual : null} stroke="none" dot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />

                </ComposedChart>
            </ResponsiveContainer>
        </div>

        {/* Footer Advice */}
        <div className="px-5 pb-5">
            {analysis.status === 'DANGER' && (
                <div className="flex items-start gap-2 bg-red-50 p-3 rounded-xl text-red-700 text-xs border border-red-100">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span><strong>Cảnh báo:</strong> Với tốc độ này, bạn sẽ vượt ngân sách khoảng <strong>{formatCurrency(analysis.finalProjection - budget)}</strong>. Hãy cắt giảm chi tiêu biến đổi ngay!</span>
                </div>
            )}
            {analysis.status === 'WARNING' && (
                <div className="flex items-start gap-2 bg-orange-50 p-3 rounded-xl text-orange-700 text-xs border border-orange-100">
                    <TrendingDown size={16} className="shrink-0 mt-0.5" />
                    <span><strong>Lưu ý:</strong> Bạn đang tiêu khá sát nút. Hãy cẩn thận với các khoản chi lớn sắp tới.</span>
                </div>
            )}
            {analysis.status === 'SAFE' && (
                <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-xl text-emerald-700 text-xs border border-emerald-100">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    <span><strong>Tuyệt vời!</strong> Bạn đang kiểm soát rất tốt. Dự kiến dư <strong>{formatCurrency(budget - analysis.finalProjection)}</strong> để đầu tư hoặc tiết kiệm.</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default CashflowForecast;
