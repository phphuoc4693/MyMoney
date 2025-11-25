
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { Sprout, Wheat, ArrowRight, Calendar, TrendingUp, Leaf, DollarSign, PiggyBank, PieChart as PieIcon, Scale, ArrowUpRight, ArrowDownRight, Wallet, Target, Shield, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend, AreaChart, Area } from 'recharts';

interface Props {
  transactions: Transaction[];
  onAllocatedSavings: (amount: number) => void;
  onAllocatedInvestment: (amount: number) => void;
}

const HarvestSowingReport: React.FC<Props> = ({ transactions, onAllocatedSavings, onAllocatedInvestment }) => {
  const [view, setView] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Allocation State
  const [allocationRatio, setAllocationRatio] = useState(50); // 50% Savings, 50% Investment

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCompact = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    return `${(val / 1000).toFixed(0)}k`;
  };

  // --- HELPERS ---
  const isGoodSeed = (category: string) => {
      const goodSeeds = [
          Category.EDUCATION, 
          Category.HEALTH, 
          Category.BUSINESS_COST, 
          Category.INSURANCE, 
          Category.GIVING,
          Category.HOUSING // Considered essential/investment in life quality
      ];
      return goodSeeds.includes(category as Category);
  };

  // --- LOGIC: HARVEST & SOWING (Category Profitability) ---
  const categoryFlow = useMemo(() => {
      const flow: Record<string, { income: number; expense: number; net: number }> = {};
      const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      
      // Previous Month for comparison
      const prevDate = new Date(selectedYear, selectedMonth - 2, 1);
      const prevMonthKey = prevDate.toISOString().slice(0, 7);
      const prevFlow: Record<string, number> = {};

      // Process Data
      transactions.forEach(t => {
          // Current Period Data
          const isCurrent = view === 'YEARLY' ? t.date.startsWith(String(selectedYear)) : t.date.startsWith(monthKey);
          
          if (isCurrent) {
              if (!flow[t.category]) flow[t.category] = { income: 0, expense: 0, net: 0 };
              if (t.type === TransactionType.INCOME) flow[t.category].income += t.amount;
              else flow[t.category].expense += t.amount;
              flow[t.category].net = flow[t.category].income - flow[t.category].expense;
          }

          // Previous Period Data (Only for Monthly view comparison logic simplification)
          if (view === 'MONTHLY' && t.date.startsWith(prevMonthKey)) {
               const val = t.type === TransactionType.INCOME ? t.amount : -t.amount;
               prevFlow[t.category] = (prevFlow[t.category] || 0) + val;
          }
      });

      // Separate Harvest (Positive Net) & Sowing (Negative Net)
      const harvest = Object.entries(flow)
        .filter(([_, val]) => val.net >= 0)
        .map(([cat, val]) => ({
            category: cat,
            ...val,
            prevNet: prevFlow[cat] || 0,
            growth: prevFlow[cat] ? ((val.net - prevFlow[cat]) / Math.abs(prevFlow[cat])) * 100 : 0
        }))
        .sort((a, b) => b.net - a.net);

      const sowing = Object.entries(flow)
        .filter(([_, val]) => val.net < 0)
        .map(([cat, val]) => ({
            category: cat,
            ...val,
            prevNet: prevFlow[cat] || 0,
            isGoodSeed: isGoodSeed(cat)
        }))
        .sort((a, b) => a.net - b.net); // Most negative first

      return { harvest, sowing };
  }, [transactions, selectedYear, selectedMonth, view]);

  // --- LOGIC: SETTLEMENT & TREND ---
  const { settlement, profitTrend, sowingStats } = useMemo(() => {
      let totalIncome = 0;
      let totalExpense = 0;
      
      // Settlement
      if (view === 'MONTHLY') {
         const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
         const filtered = transactions.filter(t => t.date.startsWith(monthKey));
         totalIncome = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
         totalExpense = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      } else {
         const filtered = transactions.filter(t => t.date.startsWith(String(selectedYear)));
         totalIncome = filtered.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
         totalExpense = filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      }

      // Profit Trend (Last 6 months)
      const trend = [];
      const today = new Date();
      for(let i=5; i>=0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const k = d.toISOString().slice(0, 7);
          const label = `T${d.getMonth() + 1}`;
          
          const monthly = transactions.filter(t => t.date.startsWith(k));
          const inc = monthly.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
          const exp = monthly.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
          trend.push({ name: label, profit: inc - exp });
      }

      // Sowing Stats (Good vs Bad)
      let goodSeedTotal = 0;
      let badSeedTotal = 0;
      categoryFlow.sowing.forEach(item => {
          if(item.isGoodSeed) goodSeedTotal += Math.abs(item.net);
          else badSeedTotal += Math.abs(item.net);
      });

      return { 
          settlement: { totalIncome, totalExpense, profit: totalIncome - totalExpense },
          profitTrend: trend,
          sowingStats: { good: goodSeedTotal, bad: badSeedTotal }
      };
  }, [transactions, selectedYear, selectedMonth, view, categoryFlow]);

  // --- CHART DATA ---
  const chartData = [
      { name: 'Gặt (Thu)', value: settlement.totalIncome, color: '#10B981' }, // Emerald
      { name: 'Gieo (Chi)', value: settlement.totalExpense, color: '#F97316' }, // Orange
  ];
  
  const seedQualityData = [
      { name: 'Hạt giống tốt', value: sowingStats.good, color: '#3B82F6' }, // Blue
      { name: 'Tiêu dùng', value: sowingStats.bad, color: '#9CA3AF' }, // Gray
  ];
  
  const harvestRatio = settlement.totalExpense > 0 ? (settlement.totalIncome / settlement.totalExpense) : 0;

  // --- LOGIC: YEARLY GRID ---
  const yearlyGrid = useMemo(() => {
      const data = Array.from({length: 12}, () => ({ income: 0, expense: 0, profit: 0 }));
      transactions.filter(t => t.date.startsWith(String(selectedYear))).forEach(t => {
          const monthIdx = new Date(t.date).getMonth();
          if(t.type === TransactionType.INCOME) data[monthIdx].income += t.amount;
          else data[monthIdx].expense += t.amount;
          data[monthIdx].profit = data[monthIdx].income - data[monthIdx].expense;
      });
      return data;
  }, [transactions, selectedYear]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Leaf className="text-green-600" /> Phân Tích Gieo & Gặt
              </h2>
              <p className="text-sm text-gray-500">Tối ưu hóa dòng tiền: Tăng thu, giảm chi xấu</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setView('MONTHLY')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${view === 'MONTHLY' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Tháng</button>
              <button onClick={() => setView('YEARLY')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${view === 'YEARLY' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Năm</button>
          </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="font-bold text-lg bg-transparent outline-none text-gray-700">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
          {view === 'MONTHLY' && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <button 
                        key={m}
                        onClick={() => setSelectedMonth(m)}
                        className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors shrink-0 ${selectedMonth === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                          {m}
                      </button>
                  ))}
              </div>
          )}
      </div>

      {/* 1. MAIN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profit Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Xu hướng Lợi Nhuận Ròng</h3>
              <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profitTrend}>
                          <defs>
                              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <Tooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{borderRadius: '12px'}} />
                          <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Settlement Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">Lợi Nhuận Ròng (Profit)</p>
                  <h2 className={`text-4xl font-bold ${settlement.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(settlement.profit)}
                  </h2>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      Hệ số Gặt/Gieo: <span className="text-white font-bold">{harvestRatio.toFixed(2)}x</span>
                  </p>
              </div>

              <div className="space-y-3 mt-6 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Tổng Thu</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><ArrowUpRight size={14}/> {formatCompact(settlement.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Tổng Chi</span>
                      <span className="text-orange-400 font-bold flex items-center gap-1"><ArrowDownRight size={14}/> {formatCompact(settlement.totalExpense)}</span>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. PROFIT ALLOCATION (INTERACTIVE) */}
      {settlement.profit > 0 && view === 'MONTHLY' && (
          <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Wallet size={24} /></div>
                      <div>
                          <h3 className="font-bold text-gray-800">Phân bổ lợi nhuận</h3>
                          <p className="text-xs text-gray-500">Kế hoạch sử dụng tiền lãi tháng này</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => setAllocationRatio(80)} className="text-xs px-3 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors font-medium">An toàn</button>
                      <button onClick={() => setAllocationRatio(50)} className="text-xs px-3 py-1 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-colors font-medium">Cân bằng</button>
                      <button onClick={() => setAllocationRatio(20)} className="text-xs px-3 py-1 bg-gray-100 hover:bg-purple-100 hover:text-purple-600 rounded-lg transition-colors font-medium">Tăng trưởng</button>
                  </div>
              </div>

              <div className="flex items-center gap-4 mb-8 px-2">
                  <span className="text-xs font-bold text-blue-600 uppercase w-24 text-right">Tiết kiệm {allocationRatio}%</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={allocationRatio} 
                    onChange={(e) => setAllocationRatio(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-purple-600 uppercase w-24">Đầu tư {100 - allocationRatio}%</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group cursor-pointer" onClick={() => onAllocatedSavings(settlement.profit * (allocationRatio / 100))}>
                      <div className="absolute inset-0 bg-blue-50 rounded-2xl transform transition-transform group-hover:scale-105"></div>
                      <div className="relative p-5 flex items-center justify-between border border-blue-100 rounded-2xl">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-500 text-white rounded-xl shadow-md shadow-blue-200"><Shield size={24} /></div>
                              <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Gửi Tiết Kiệm</p>
                                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(settlement.profit * (allocationRatio / 100))}</p>
                              </div>
                          </div>
                          <div className="bg-white p-2 rounded-full shadow-sm text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <ArrowRight size={20} />
                          </div>
                      </div>
                  </div>

                  <div className="relative group cursor-pointer" onClick={() => onAllocatedInvestment(settlement.profit * ((100 - allocationRatio) / 100))}>
                      <div className="absolute inset-0 bg-purple-50 rounded-2xl transform transition-transform group-hover:scale-105"></div>
                      <div className="relative p-5 flex items-center justify-between border border-purple-100 rounded-2xl">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-purple-500 text-white rounded-xl shadow-md shadow-purple-200"><Zap size={24} /></div>
                              <div>
                                  <p className="text-xs text-gray-500 font-bold uppercase">Tái Đầu Tư</p>
                                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(settlement.profit * ((100 - allocationRatio) / 100))}</p>
                              </div>
                          </div>
                          <div className="bg-white p-2 rounded-full shadow-sm text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                              <ArrowRight size={20} />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 3. HARVEST & SOWING COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HARVEST (Income) */}
          <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Wheat size={24} /></div>
                  <div>
                      <h3 className="font-bold text-gray-800">Mùa Gặt (Harvest)</h3>
                      <p className="text-xs text-gray-500">Các nguồn tạo thu nhập ròng</p>
                  </div>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {categoryFlow.harvest.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-4">Chưa có danh mục sinh lời dương.</p>
                  ) : (
                      categoryFlow.harvest.map((item) => (
                          <div key={item.category} className="bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-gray-700">{item.category}</h4>
                                      {view === 'MONTHLY' && item.growth !== 0 && (
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.growth > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                              {item.growth > 0 ? '↑' : '↓'} {Math.abs(item.growth).toFixed(0)}%
                                          </span>
                                      )}
                                  </div>
                                  <span className="font-bold text-emerald-600">+{formatCompact(item.net)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                  <span>Thu: {formatCompact(item.income)}</span>
                                  <span>Chi: {formatCompact(item.expense)}</span>
                              </div>
                              {/* Efficiency Bar */}
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${Math.min((item.net / settlement.profit) * 100, 100)}%` }}></div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>

          {/* SOWING (Expense/Investment) */}
          <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><Sprout size={24} /></div>
                      <div>
                          <h3 className="font-bold text-gray-800">Gieo Trồng (Sowing)</h3>
                          <p className="text-xs text-gray-500">Chất lượng hạt giống chi tiêu</p>
                      </div>
                  </div>
                  {/* Mini Pie Chart for Seed Quality */}
                  <div className="w-12 h-12">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={seedQualityData} dataKey="value" cx="50%" cy="50%" innerRadius={0} outerRadius={20}>
                                  {seedQualityData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {categoryFlow.sowing.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-4">Không có khoản gieo trồng.</p>
                  ) : (
                      categoryFlow.sowing.map((item) => (
                          <div key={item.category} className="bg-white p-4 rounded-2xl border border-orange-100/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-gray-700">{item.category}</h4>
                                      {item.isGoodSeed ? (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                                              <Target size={10} /> Hạt giống tốt
                                          </span>
                                      ) : (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Tiêu dùng</span>
                                      )}
                                  </div>
                                  <span className="font-bold text-orange-500">{formatCompact(item.net)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                  <div className={`h-full ${item.isGoodSeed ? 'bg-blue-500' : 'bg-gray-400'}`} style={{ width: `${Math.min((Math.abs(item.net) / settlement.totalExpense) * 100, 100)}%` }}></div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* 4. YEARLY SETTLEMENT GRID (Only in Yearly View) */}
      {view === 'YEARLY' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="text-gray-500" size={20} />
                  <h3 className="font-bold text-gray-700">Bảng Quyết Toán Năm {selectedYear}</h3>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead>
                          <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                              <th className="px-4 py-3 font-bold sticky left-0 bg-gray-50 z-10">Hạng mục</th>
                              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                  <th key={m} className="px-4 py-3 font-bold text-center min-w-[80px]">T{m}</th>
                              ))}
                              <th className="px-4 py-3 font-bold text-right min-w-[120px]">Tổng Năm</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          <tr>
                              <td className="px-4 py-3 font-bold text-emerald-600 sticky left-0 bg-white">Tổng Thu</td>
                              {yearlyGrid.map((m, i) => <td key={i} className="px-4 py-3 text-center text-gray-700">{formatCompact(m.income)}</td>)}
                              <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(settlement.totalIncome)}</td>
                          </tr>
                          <tr>
                              <td className="px-4 py-3 font-bold text-red-500 sticky left-0 bg-white">Tổng Chi</td>
                              {yearlyGrid.map((m, i) => <td key={i} className="px-4 py-3 text-center text-gray-700">{formatCompact(m.expense)}</td>)}
                              <td className="px-4 py-3 text-right font-bold text-red-500">{formatCurrency(settlement.totalExpense)}</td>
                          </tr>
                          <tr className="bg-gray-50/50 font-bold">
                              <td className="px-4 py-3 text-blue-600 sticky left-0 bg-gray-50">Lợi Nhuận</td>
                              {yearlyGrid.map((m, i) => (
                                  <td key={i} className={`px-4 py-3 text-center ${m.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                      {formatCompact(m.profit)}
                                  </td>
                              ))}
                              <td className={`px-4 py-3 text-right ${settlement.profit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                                  {formatCurrency(settlement.profit)}
                              </td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default HarvestSowingReport;
