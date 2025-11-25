
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, ComposedChart, Line, ReferenceLine } from 'recharts';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { PieChart as PieIcon, BarChart3, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, Zap, Award, Info, CheckCircle2, HelpCircle, X, Rocket, Gauge, Clock } from 'lucide-react';

interface Props {
  transactions: Transaction[]; // Current Month Transactions
  allTransactions?: Transaction[]; // Full history for comparison
  currentMonth?: string; // YYYY-MM
  isPrivacyMode?: boolean;
  budget?: number;
}

// Map Tailwind color classes to hex values for Recharts
const COLOR_MAP: Record<string, string> = {
  [Category.FOOD]: '#F97316', // orange-500
  [Category.TRANSPORT]: '#3B82F6', // blue-500
  [Category.SHOPPING]: '#EC4899', // pink-500
  [Category.BILLS]: '#EF4444', // red-500
  [Category.ENTERTAINMENT]: '#A855F7', // purple-500
  [Category.HEALTH]: '#22C55E', // green-500
  [Category.EDUCATION]: '#6366F1', // indigo-500
  [Category.SALARY]: '#10B981', // emerald-500
  [Category.BONUS]: '#EAB308', // yellow-500
  [Category.OTHER]: '#6B7280', // gray-500
};

type Tab = 'CATEGORY' | 'TIME' | 'INSIGHT';

const StatsChart: React.FC<Props> = ({ transactions = [], allTransactions = [], currentMonth = '', isPrivacyMode = false, budget = 0 }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CATEGORY');
  const [showTimeGuide, setShowTimeGuide] = useState(true);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  const formatCurrencyFull = (val: number) => {
      if (isPrivacyMode) return '******';
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  // 1. Category Data
  const expenseTransactions = useMemo(() => 
    transactions ? transactions.filter(t => t.type === TransactionType.EXPENSE) : []
  , [transactions]);
  
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryData = useMemo(() => {
    return expenseTransactions
      .reduce((acc, t) => {
        const existing = acc.find(item => item.name === t.category);
        if (existing) {
          existing.value += t.amount;
        } else {
          acc.push({ name: t.category, value: t.amount });
        }
        return acc;
      }, [] as { name: string; value: number }[])
      .sort((a, b) => b.value - a.value);
  }, [expenseTransactions]);

  // 2. Time Data (Daily, Weekly, Weekday)
  const { dailyData, averageDaily, maxDay, noSpendDays, weekdayData, weeklyData, maxCumulative } = useMemo(() => {
      if (!currentMonth) return { dailyData: [], averageDaily: 0, maxDay: null, noSpendDays: 0, weekdayData: [], weeklyData: [], maxCumulative: 0 };

      const [year, month] = currentMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Determine days passed for accurate average calculation
      const now = new Date();
      const isCurrentMonth = now.getMonth() + 1 === month && now.getFullYear() === year;
      const daysPassed = isCurrentMonth ? now.getDate() : daysInMonth;

      const days: Record<number, number> = {};
      const weekdays: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // 0=Sun, 1=Mon...
      const weeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      // Initialize all days with 0
      for(let i=1; i<=daysInMonth; i++) {
          days[i] = 0;
      }

      expenseTransactions.forEach(t => {
          const d = new Date(t.date);
          if (!isNaN(d.getTime())) {
              const day = d.getDate();
              days[day] = (days[day] || 0) + t.amount;
              
              // Weekday
              const wd = d.getDay(); // 0-6
              weekdays[wd] += t.amount;

              // Week Number (Simple approx)
              const weekNum = Math.ceil(day / 7);
              weeks[weekNum] = (weeks[weekNum] || 0) + t.amount;
          }
      });

      const avg = totalExpense / Math.max(1, daysPassed);
      let cumulative = 0;

      // Transform Daily Data
      const chartData = Object.entries(days)
          .map(([day, amount]) => {
              const dayNum = parseInt(day);
              // Color Logic
              let fill = '#10B981'; // Green (Low)
              if (amount > avg * 1.5) fill = '#EF4444'; // Red (High)
              else if (amount > avg) fill = '#F59E0B'; // Orange (Med)
              
              if (dayNum <= daysPassed) cumulative += amount;

              return { 
                day: dayNum, 
                label: `Ngày ${day}`, 
                amount,
                cumulative: dayNum <= daysPassed ? cumulative : null, // Hide cumulative for future
                fill,
                isFuture: isCurrentMonth && dayNum > daysPassed 
              };
          })
          .sort((a, b) => a.day - b.day);

      // Transform Weekday Data
      const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const wdChartData = Object.entries(weekdays).map(([wd, val]) => ({
          name: weekdayLabels[parseInt(wd)],
          value: val
      }));

      // Transform Weekly Data
      const wChartData = Object.entries(weeks).map(([w, val]) => ({
          name: `Tuần ${w}`,
          value: val
      })).filter(w => w.value > 0);

      const maxVal = Math.max(...Object.values(days));
      const maxD = chartData.find(d => d.amount === maxVal);
      
      let zeroDays = 0;
      for(let i=1; i<=daysPassed; i++) {
          if(days[i] === 0) zeroDays++;
      }

      return { 
          dailyData: chartData, 
          averageDaily: avg, 
          maxDay: maxD,
          noSpendDays: zeroDays,
          weekdayData: wdChartData,
          weeklyData: wChartData,
          maxCumulative: cumulative
      };
  }, [expenseTransactions, totalExpense, currentMonth]);

  // 3. ADVANCED INSIGHTS LOGIC
  
  // A. Spending Velocity
  const velocity = useMemo(() => {
      if (!budget || budget === 0) return null;
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = Math.max(1, now.getDate());
      
      const timePassedPercent = (daysPassed / daysInMonth) * 100;
      const budgetSpentPercent = Math.min((totalExpense / budget) * 100, 100); // Cap at 100 for bar width
      
      const diff = budgetSpentPercent - timePassedPercent;
      
      let status: 'FAST' | 'SLOW' | 'ON_TRACK' = 'ON_TRACK';
      if (diff > 10) status = 'FAST';
      if (diff < -10) status = 'SLOW';
      
      const projected = (totalExpense / daysPassed) * daysInMonth;

      return { timePassedPercent, budgetSpentPercent, status, projected };
  }, [totalExpense, budget]);

  // B. Top Movers
  const movers = useMemo(() => {
      if (!allTransactions?.length || !currentMonth) return [];

      const [y, m] = currentMonth.split('-').map(Number);
      const prevDate = new Date(y, m - 2, 1);
      const prevMonthKey = prevDate.toISOString().slice(0, 7);

      const prevTrans = allTransactions.filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(prevMonthKey));
      
      const currentCats: Record<string, number> = {};
      const prevCats: Record<string, number> = {};

      expenseTransactions.forEach(t => currentCats[t.category] = (currentCats[t.category] || 0) + t.amount);
      prevTrans.forEach(t => prevCats[t.category] = (prevCats[t.category] || 0) + t.amount);

      const changes = Object.keys(currentCats).map(cat => {
          const curr = currentCats[cat];
          const prev = prevCats[cat] || 0;
          const diff = curr - prev;
          const percent = prev > 0 ? (diff / prev) * 100 : 100;
          return { category: cat, diff, percent, curr };
      });

      return changes.filter(c => c.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 3);
  }, [expenseTransactions, allTransactions, currentMonth]);


  // C. Personality
  const personalityTag = useMemo(() => {
      if (totalExpense === 0) return { title: "Người tiết kiệm", icon: Award, color: "text-emerald-600 bg-emerald-100", desc: "Chưa tiêu đồng nào!" };
      
      const foodSpend = categoryData.find(c => c.name === Category.FOOD)?.value || 0;
      const shopSpend = categoryData.find(c => c.name === Category.SHOPPING)?.value || 0;
      const transportSpend = categoryData.find(c => c.name === Category.TRANSPORT)?.value || 0;

      const weekendSpend = expenseTransactions.filter(t => {
          const d = new Date(t.date).getDay();
          return d === 0 || d === 6;
      }).reduce((sum, t) => sum + t.amount, 0);

      if (weekendSpend / totalExpense > 0.5) return { title: "Cuối tuần rực lửa", icon: Zap, color: "text-orange-600 bg-orange-100", desc: "Bạn tiêu chủ yếu vào cuối tuần" };
      if (foodSpend / totalExpense > 0.4) return { title: "Tín đồ ẩm thực", icon: CATEGORY_ICONS[Category.FOOD], color: "text-orange-600 bg-orange-100", desc: "Ăn uống chiếm > 40% chi tiêu" };
      if (shopSpend / totalExpense > 0.3) return { title: "Nghiện mua sắm", icon: CATEGORY_ICONS[Category.SHOPPING], color: "text-pink-600 bg-pink-100", desc: "Shopping chiếm ưu thế" };
      
      return { title: "Quản lý cân bằng", icon: Award, color: "text-blue-600 bg-blue-100", desc: "Chi tiêu khá đồng đều" };
  }, [categoryData, totalExpense, expenseTransactions]);

  const DailyCustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const amount = payload.find((p: any) => p.dataKey === 'amount')?.value || 0;
          const cumulative = payload.find((p: any) => p.dataKey === 'cumulative')?.value; 
          const diff = amount - averageDaily;
          const isAboveAvg = diff > 0;

          return (
              <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-50 min-w-[180px]">
                  <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <Calendar size={12} /> Ngày {label}
                  </div>
                  <div className="mb-3">
                      <p className="text-xs text-gray-400">Chi tiêu trong ngày</p>
                      <p className="text-lg font-bold" style={{ color: amount > averageDaily * 1.5 ? '#EF4444' : '#10B981' }}>
                          {formatCurrencyFull(amount)}
                      </p>
                  </div>
                  {cumulative !== undefined && cumulative !== null && (
                      <div className="mb-3 pt-2 border-t border-dashed border-gray-100">
                          <p className="text-xs text-gray-400">Tích lũy từ đầu tháng</p>
                          <p className="text-sm font-bold text-blue-600">{formatCurrencyFull(cumulative)}</p>
                      </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-xs">
                          <span className="block text-gray-400">Trung bình:</span>
                          <span className="font-medium text-gray-600">{formatCurrency(averageDaily)}</span>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-lg ${isAboveAvg ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          {isAboveAvg ? '+' : ''}{formatCurrency(diff)}
                      </div>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (expenseTransactions.length === 0 && activeTab === 'CATEGORY') {
    return (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[400px] flex flex-col items-center justify-center text-gray-400">
        <PieIcon size={48} className="opacity-20 mb-4" />
        <p>Chưa có dữ liệu chi tiêu để phân tích</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-auto min-h-[500px]">
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Phân Tích
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('CATEGORY')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'CATEGORY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><PieIcon size={14} /> Danh mục</button>
            <button onClick={() => setActiveTab('TIME')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'TIME' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BarChart3 size={14} /> Thời gian</button>
            <button onClick={() => setActiveTab('INSIGHT')} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${activeTab === 'INSIGHT' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><Zap size={14} /> Insights</button>
        </div>
      </div>

      <div className="p-6 flex-1">
        {/* CATEGORY TAB */}
        {activeTab === 'CATEGORY' && (
            <div className="flex flex-col gap-6 animate-fade-in">
                <div className="h-64 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLOR_MAP[entry.name] || '#9CA3AF'} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: number) => formatCurrencyFull(value)} />
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-gray-400 font-medium uppercase">Tổng chi</span>
                        <span className="text-xl font-bold text-gray-800">{formatCurrency(totalExpense)}</span>
                    </div>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {categoryData.map((item, idx) => {
                        const percent = (item.value / totalExpense) * 100;
                        return (
                            <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_MAP[item.name] || '#9CA3AF' }}></div>
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="text-xs text-gray-400">({percent.toFixed(1)}%)</span>
                                    </div>
                                    <span className="font-bold text-gray-800">{formatCurrencyFull(item.value)}</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: COLOR_MAP[item.name] || '#9CA3AF' }}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* TIME TAB */}
        {activeTab === 'TIME' && (
            <div className="h-full flex flex-col animate-fade-in space-y-6">
                {/* Main Daily Chart */}
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-gray-800">Xu hướng chi tiêu ngày</h4>
                            <p className="text-xs text-gray-500">Biểu đồ kết hợp: Chi tiêu (Cột) & Tích lũy (Vùng)</p>
                        </div>
                        <button onClick={() => setShowTimeGuide(!showTimeGuide)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors">{showTimeGuide ? <X size={16} /> : <HelpCircle size={16} />}</button>
                    </div>
                    
                    {showTimeGuide && (
                        <div className="mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs text-blue-800 flex gap-3">
                             <Info size={16} className="shrink-0 mt-0.5" />
                             <ul className="opacity-90 space-y-1">
                                 <li><strong>Đường kẻ cam:</strong> Mức chi trung bình/ngày ({formatCurrency(averageDaily)}).</li>
                                 <li><strong>Cột Đỏ:</strong> Ngày tiêu &gt;1.5x trung bình. <strong>Vùng Xanh:</strong> Tổng tiền đã tiêu trong tháng (trục phải).</li>
                             </ul>
                        </div>
                    )}

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                
                                {/* X Axis */}
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} interval={2} />
                                
                                {/* Y Axis Left (Daily Amount) */}
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={formatCurrency} />
                                
                                {/* Y Axis Right (Cumulative) */}
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#93C5FD', fontSize: 10 }} tickFormatter={(val) => formatCurrency(val)} domain={[0, 'auto']} />

                                <Tooltip cursor={{ fill: '#F3F4F6' }} content={<DailyCustomTooltip />} />
                                
                                {/* Average Line (Left Axis) */}
                                <ReferenceLine yAxisId="left" y={averageDaily} stroke="#F97316" strokeDasharray="3 3" strokeWidth={1} label={{ position: 'insideTopLeft', value: 'Avg', fill: '#F97316', fontSize: 10 }} />
                                
                                {/* Cumulative Area (Right Axis) */}
                                <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCumulative)" dot={false} activeDot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
                                
                                {/* Daily Bars (Left Axis) */}
                                <Bar yAxisId="left" dataKey="amount" radius={[4, 4, 0, 0]} barSize={12}>
                                    {dailyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col items-center text-center"><span className="text-[10px] font-bold text-purple-400 uppercase mb-1">Trung bình/ngày</span><span className="font-bold text-purple-700 text-sm">{formatCurrency(averageDaily)}</span></div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col items-center text-center"><span className="text-[10px] font-bold text-red-400 uppercase mb-1">Ngày cao điểm</span><span className="font-bold text-red-700 text-sm">Ngày {maxDay?.day || '-'}</span></div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex flex-col items-center text-center"><span className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Ngày không tiêu</span><span className="font-bold text-emerald-700 text-sm">{noSpendDays} ngày</span></div>
                </div>

                {/* Sub Charts: Weekday & Weekly */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Clock size={12} /> Theo thứ</h5>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekdayData}>
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[2,2,0,0]} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={0} />
                                    <Tooltip cursor={false} contentStyle={{fontSize: '10px', borderRadius: '8px'}} formatter={formatCurrencyFull} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Calendar size={12} /> Theo tuần</h5>
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <Bar dataKey="value" fill="#10B981" radius={[2,2,0,0]} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} interval={0} />
                                    <Tooltip cursor={false} contentStyle={{fontSize: '10px', borderRadius: '8px'}} formatter={formatCurrencyFull} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* INSIGHT TAB */}
        {activeTab === 'INSIGHT' && (
            <div className="grid grid-cols-1 gap-5 animate-fade-in">
                {velocity && (
                     <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                         <div className="flex items-center justify-between mb-3">
                             <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Gauge size={14} /> Tốc độ chi tiêu</h4>
                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${velocity.status === 'FAST' ? 'bg-red-100 text-red-600' : velocity.status === 'SLOW' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{velocity.status === 'FAST' ? 'NHANH HƠN DỰ KIẾN' : velocity.status === 'SLOW' ? 'CHẬM HƠN DỰ KIẾN' : 'ĐÚNG TIẾN ĐỘ'}</span>
                         </div>
                         <div className="relative pt-1 pb-4">
                             <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex relative">
                                 <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10" style={{ left: `${Math.min(velocity.timePassedPercent, 100)}%` }} title="Thời gian trôi qua"></div>
                                 <div className={`h-full transition-all duration-1000 ${velocity.status === 'FAST' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${velocity.budgetSpentPercent}%` }}></div>
                             </div>
                             <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>Đã tiêu {velocity.budgetSpentPercent.toFixed(0)}% ngân sách</span><span>Tháng trôi qua {velocity.timePassedPercent.toFixed(0)}%</span></div>
                         </div>
                         <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex items-start gap-2"><Rocket size={14} className="shrink-0 mt-0.5 text-blue-500" /><p>Nếu giữ tốc độ này, dự kiến cuối tháng bạn sẽ tiêu hết <strong>{formatCurrency(velocity.projected)}</strong>.</p></div>
                     </div>
                )}
                {movers.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><TrendingUp size={14} /> Top tăng mạnh nhất</h4>
                        <div className="space-y-3">{movers.map((m, idx) => (<div key={idx} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-1.5 h-8 rounded-full bg-red-500"></div><div><p className="text-sm font-bold text-gray-800">{m.category}</p><p className="text-[10px] text-gray-400">Tháng này: {formatCurrencyFull(m.curr)}</p></div></div><div className="text-right"><p className="text-sm font-bold text-red-500">+{formatCurrency(m.diff)}</p><p className="text-[10px] text-red-400">+{m.percent.toFixed(0)}% vs tháng trước</p></div></div>))}</div>
                    </div>
                )}
                <div className={`p-4 rounded-2xl border border-gray-100 flex items-center gap-4 ${personalityTag.color.replace('text-', 'bg-opacity-10 bg-')}`}><div className={`w-12 h-12 rounded-full flex items-center justify-center ${personalityTag.color}`}><personalityTag.icon size={24} /></div><div><p className="text-xs font-bold text-gray-500 uppercase">Phong cách chi tiêu</p><h4 className="font-bold text-gray-800">{personalityTag.title}</h4><p className="text-xs text-gray-500">{personalityTag.desc}</p></div></div>
            </div>
        )}
      </div>
    </div>
  );
};

export default StatsChart;
