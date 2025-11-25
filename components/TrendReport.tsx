
import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, AreaChart, Area, BarChart, ReferenceLine, Cell
} from 'recharts';
import { Transaction, TransactionType, Category } from '../types';
import { TrendingUp, TrendingDown, Calendar, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Activity, Search, Filter, Target } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

const TrendReport: React.FC<Props> = ({ transactions }) => {
  const [timeRange, setTimeRange] = useState<number>(6); // Default 6 months
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 1. Prepare Monthly Data based on Time Range
  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = `T${d.getMonth() + 1}`;
      
      const monthlyTrans = transactions.filter(t => t.date.startsWith(monthKey));
      
      const income = monthlyTrans.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const expense = monthlyTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate Savings Rate
      const rate = income > 0 ? ((income - expense) / income) * 100 : 0;

      // Category Breakdown for Stacked Bar
      const categoryBreakdown: Record<string, number> = {};
      monthlyTrans.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

      data.push({
        name: monthLabel,
        fullDate: monthKey,
        Thu: income,
        Chi: expense,
        Net: income - expense,
        Rate: rate,
        ...categoryBreakdown
      });
    }
    return data;
  }, [transactions, timeRange]);

  // 2. Category Drill-down Data
  const categoryTrendData = useMemo(() => {
      if (selectedCategory === 'ALL') return [];
      return chartData.map(d => ({
          name: d.name,
          value: d[selectedCategory] || 0
      }));
  }, [chartData, selectedCategory]);

  const categoryAvg = useMemo(() => {
      if (categoryTrendData.length === 0) return 0;
      const sum = categoryTrendData.reduce((acc, cur) => acc + cur.value, 0);
      return sum / categoryTrendData.length;
  }, [categoryTrendData]);

  // 3. Calculate KPIs & Insights
  const kpis = useMemo(() => {
      const totalIncome = chartData.reduce((sum, d) => sum + d.Thu, 0);
      const totalExpense = chartData.reduce((sum, d) => sum + d.Chi, 0);
      const netSavings = totalIncome - totalExpense;
      const avgSavingsRate = chartData.reduce((sum, d) => sum + d.Rate, 0) / timeRange;
      const avgMonthlyExpense = totalExpense / timeRange;
      const avgMonthlyIncome = totalIncome / timeRange;

      // Compare last month vs average
      const lastMonth = chartData[chartData.length - 1];
      const incomeTrend = lastMonth.Thu - avgMonthlyIncome;
      const expenseTrend = lastMonth.Chi - avgMonthlyExpense;

      return { 
          totalIncome, totalExpense, netSavings, avgSavingsRate, avgMonthlyExpense, 
          incomeTrend, expenseTrend 
      };
  }, [chartData, timeRange]);

  // 4. Get All Used Categories for Dropdown
  const allCategories = useMemo(() => {
      const cats = new Set<string>();
      transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => cats.add(t.category));
      return Array.from(cats).sort();
  }, [transactions]);

  // 5. Top Categories for Stacked Chart
  const topCategories = useMemo(() => {
      const catMap: Record<string, number> = {};
      transactions.forEach(t => {
          if(t.type === TransactionType.EXPENSE) catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
      return Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]).slice(0, 5); // Top 5
  }, [transactions]);

  const formatCurrencyShort = (value: number) => {
      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
      return value.toString();
  };

  const formatCurrencyFull = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const STACK_COLORS = ['#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#9CA3AF'];

  const TrendCustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
              <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
                  <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Tháng {label}</h4>
                  <div className="space-y-2 mb-3">
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Thu nhập:</span><span className="text-xs font-bold text-emerald-600">{formatCurrencyFull(data.Thu)}</span></div>
                      <div className="flex justify-between"><span className="text-xs text-gray-500">Chi tiêu:</span><span className="text-xs font-bold text-red-500">{formatCurrencyFull(data.Chi)}</span></div>
                      <div className="flex justify-between pt-1 border-t border-dashed border-gray-100">
                          <span className="text-xs text-gray-500">Dòng tiền:</span>
                          <span className={`text-xs font-bold ${data.Net >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>{data.Net > 0 ? '+' : ''}{formatCurrencyFull(data.Net)}</span>
                      </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Tỷ lệ tiết kiệm</span>
                      <p className={`font-bold ${data.Rate >= 20 ? 'text-emerald-500' : 'text-orange-500'}`}>{data.Rate.toFixed(1)}%</p>
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Activity size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Báo cáo Xu hướng</h2>
                <p className="text-sm text-gray-500">Phân tích sâu 6 tháng gần nhất</p>
            </div>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl self-end">
            {[3, 6, 12].map(range => (
                <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${timeRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {range} Tháng
                </button>
            ))}
        </div>
      </div>

      {/* KPI Cards with Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tổng thu nhập</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrencyShort(kpis.totalIncome)}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${kpis.incomeTrend >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {kpis.incomeTrend >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  <span>{kpis.incomeTrend >= 0 ? 'Tăng' : 'Giảm'} so với TB</span>
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tổng chi tiêu</p>
              <p className="text-lg font-bold text-red-500">{formatCurrencyShort(kpis.totalExpense)}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${kpis.expenseTrend <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {kpis.expenseTrend > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  <span>{kpis.expenseTrend > 0 ? 'Cao' : 'Thấp'} hơn TB</span>
              </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Dư nợ (Savings)</p>
              <p className={`text-lg font-bold ${kpis.netSavings >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                  {kpis.netSavings > 0 ? '+' : ''}{formatCurrencyShort(kpis.netSavings)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Tiền mặt ròng giữ lại</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tỷ lệ tiết kiệm TB</p>
              <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${kpis.avgSavingsRate >= 20 ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {kpis.avgSavingsRate.toFixed(1)}%
                  </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mục tiêu: &gt; 20%</p>
          </div>
      </div>

      {/* MAIN CHART: Cashflow & Savings Rate */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800">Dòng tiền & Hiệu suất</h3>
                <p className="text-xs text-gray-500">Tương quan giữa Thu nhập, Chi tiêu và Tỷ lệ tiết kiệm</p>
            </div>
            <div className="text-right hidden md:block">
                <span className="block text-xs text-gray-400">Chi trung bình</span>
                <span className="font-bold text-gray-700">{formatCurrencyFull(kpis.avgMonthlyExpense)} / tháng</span>
            </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={formatCurrencyShort} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} unit="%" domain={[0, 100]} hide />
              
              <RechartsTooltip content={<TrendCustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Bar yAxisId="left" dataKey="Thu" fill="#10B981" name="Thu nhập" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar yAxisId="left" dataKey="Chi" fill="#EF4444" name="Chi tiêu" radius={[4, 4, 0, 0]} barSize={12} />
              <Line yAxisId="left" type="monotone" dataKey="Net" stroke="#3B82F6" name="Dòng tiền ròng" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
              <Line yAxisId="right" type="monotone" dataKey="Rate" stroke="#F59E0B" name="% Tiết kiệm" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              
              <ReferenceLine yAxisId="left" y={kpis.avgMonthlyExpense} stroke="#9CA3AF" strokeDasharray="3 3" label={{ position: 'insideRight', value: 'TB Chi', fill: '#9CA3AF', fontSize: 10 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY ROW: Category Spotlight & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. CATEGORY SPOTLIGHT (Drill-down) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <Target size={20} className="text-blue-500" /> Tiêu điểm danh mục
                      </h3>
                      <p className="text-xs text-gray-500">Xem xu hướng chi tiết từng nhóm</p>
                  </div>
                  <div className="relative">
                      <select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none bg-gray-100 border border-gray-200 text-gray-700 py-2 pl-4 pr-10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                          <option value="ALL">Chọn danh mục...</option>
                          {allCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
              </div>

              {selectedCategory !== 'ALL' ? (
                  <div className="flex-1 min-h-[250px]">
                      <div className="flex justify-between mb-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <span className="text-xs font-bold text-blue-600 uppercase">Trung bình {selectedCategory}</span>
                          <span className="font-bold text-blue-800">{formatCurrencyFull(categoryAvg)}/tháng</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={categoryTrendData}>
                              <defs>
                                  <linearGradient id="colorCat" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                              <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrencyShort} />
                              <RechartsTooltip 
                                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                                  formatter={(val: number) => formatCurrencyFull(val)}
                              />
                              <ReferenceLine y={categoryAvg} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'TB', position: 'insideLeft', fill: '#F59E0B', fontSize: 10 }} />
                              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fill="url(#colorCat)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50 min-h-[250px]">
                      <Search size={48} className="mb-2 opacity-20" />
                      <p className="text-sm">Chọn một danh mục để xem phân tích chi tiết</p>
                  </div>
              )}
          </div>

          {/* 2. CATEGORY BREAKDOWN (Stacked) */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Top Chi Tiêu</h3>
              <p className="text-xs text-gray-500 mb-6">5 danh mục chiếm tỷ trọng lớn nhất</p>
              
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} stackOffset="sign">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={formatCurrencyShort} />
                          <RechartsTooltip 
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                            formatter={(value: number) => formatCurrencyShort(value)}
                          />
                          {topCategories.map((cat, idx) => (
                              <Bar 
                                key={cat} 
                                dataKey={cat} 
                                stackId="a" 
                                fill={STACK_COLORS[idx % STACK_COLORS.length]} 
                                radius={idx === topCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                              />
                          ))}
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {topCategories.map((cat, idx) => (
                      <div key={cat} className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STACK_COLORS[idx % STACK_COLORS.length] }}></div>
                          {cat}
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default TrendReport;
