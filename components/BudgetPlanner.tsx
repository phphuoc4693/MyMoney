
import React, { useState, useMemo } from 'react';
import { Category, Transaction, TransactionType } from '../types';
import { Target, Edit2, Save, Plus, AlertCircle, TrendingUp, CheckCircle2, AlertTriangle, ArrowRight, History, Calculator, X, Check } from 'lucide-react';
import { CATEGORY_ICONS, CATEGORY_COLORS, JARS_SYSTEM } from '../constants';

interface Props {
  transactions: Transaction[];
  categoryBudgets: Record<string, number>;
  onUpdateBudget: (category: string, amount: number) => void;
  currentMonth: string; // YYYY-MM
  monthlyIncome: string;
  onIncomeChange: (val: string) => void;
  customCategories?: {name: string, type: TransactionType}[];
}

const BudgetPlanner: React.FC<Props> = ({ 
    transactions, 
    categoryBudgets, 
    onUpdateBudget, 
    currentMonth, 
    monthlyIncome, 
    onIncomeChange,
    customCategories = []
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVER' | 'SAFE'>('ALL');
  
  const [showJars, setShowJars] = useState(true);
  
  // Distribution Modal State
  const [distributingJar, setDistributingJar] = useState<any | null>(null);
  const [jarDistribution, setJarDistribution] = useState<Record<string, string>>({});

  // 1. Calculate Data
  const { expenseMap, lastMonthExpenseMap, totalBudget, totalSpent } = useMemo(() => {
      const currentExp: Record<string, number> = {};
      const lastMonthExp: Record<string, number> = {};
      
      // Previous Month Key
      const d = new Date(currentMonth + "-01");
      d.setMonth(d.getMonth() - 1);
      const lastMonthKey = d.toISOString().slice(0, 7);

      transactions.forEach(t => {
          if (t.type === TransactionType.EXPENSE) {
              if (t.date.startsWith(currentMonth)) {
                  currentExp[t.category] = (currentExp[t.category] || 0) + t.amount;
              } else if (t.date.startsWith(lastMonthKey)) {
                  lastMonthExp[t.category] = (lastMonthExp[t.category] || 0) + t.amount;
              }
          }
      });

      // Calculate Totals based on set budgets
      let tBudget = 0;
      let tSpent = 0;

      Object.entries(categoryBudgets).forEach(([cat, limit]) => {
          const numericLimit = limit as number;
          if (numericLimit > 0) {
              tBudget += numericLimit;
              tSpent += (currentExp[cat] || 0);
          }
      });

      return { expenseMap: currentExp, lastMonthExpenseMap: lastMonthExp, totalBudget: tBudget, totalSpent: tSpent };
  }, [transactions, currentMonth, categoryBudgets]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCompact = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    return `${(val / 1000).toFixed(0)}k`;
  };

  const handleEdit = (cat: string, currentLimit: number) => {
      setEditingCategory(cat);
      setTempAmount(currentLimit ? currentLimit.toString() : '');
  };

  const handleSave = (cat: string) => {
      const val = parseFloat(tempAmount);
      if (!isNaN(val)) {
          onUpdateBudget(cat, val);
      }
      setEditingCategory(null);
  };

  const applySuggestion = (amount: number) => {
      setTempAmount(amount.toString());
  }

  // Open Modal to Distribute Jar Budget
  const openDistribute = (jar: any, targetAmount: number) => {
      if (!jar || !jar.categories || jar.categories.length === 0) return;
      
      const initialDist: Record<string, string> = {};
      
      // Pre-fill with existing budgets
      const categories = jar.categories as string[];
      categories.forEach((cat) => {
          const categoryKey = String(cat);
          const current = categoryBudgets[categoryKey] || 0;
          initialDist[categoryKey] = current.toString();
      });

      setDistributingJar({ ...jar, targetAmount });
      setJarDistribution(initialDist);
  };

  const handleDistributeSave = () => {
      Object.entries(jarDistribution).forEach(([cat, amountStr]) => {
          const val = parseFloat(amountStr as string) || 0;
          onUpdateBudget(cat, val);
      });
      setDistributingJar(null);
  };

  // Categories to show: Merge Standard + Custom (Expense Only)
  const categoriesToBudget = useMemo(() => {
      const standard = (Object.values(Category) as string[]).filter(c => 
          c !== Category.SALARY && 
          c !== Category.BONUS && 
          c !== Category.SELLING && 
          c !== Category.INVESTMENT_RETURN
      );
      const custom = customCategories
          .filter(c => c.type === TransactionType.EXPENSE)
          .map(c => c.name);
      
      return Array.from(new Set([...standard, ...custom, Category.OTHER]));
  }, [customCategories]);
  
  // Filter Logic
  const filteredCategories = categoriesToBudget.filter(cat => {
      const limit = categoryBudgets[cat] || 0;
      const spent = expenseMap[cat] || 0;
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'OVER') return limit > 0 && spent > limit;
      if (filterStatus === 'SAFE') return limit > 0 && spent <= limit;
      return true;
  });

  const totalPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                <Target size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Kế hoạch Ngân sách</h2>
                <p className="text-sm text-gray-500">Phương pháp 6 Chiếc Hũ (T. Harv Eker)</p>
            </div>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>Tất cả</button>
            <button onClick={() => setFilterStatus('OVER')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'OVER' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}>Báo động</button>
            <button onClick={() => setFilterStatus('SAFE')} className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'SAFE' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'}`}>An toàn</button>
        </div>
      </div>

      {/* 6 JARS CALCULATOR SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Calculator size={20} /></div>
                  <h3 className="font-bold text-gray-800">Phân bổ ngân sách (6 Hũ)</h3>
              </div>
              <button onClick={() => setShowJars(!showJars)} className="text-gray-400 hover:text-blue-500">
                  {showJars ? <ArrowRight size={20} className="rotate-90 transition-transform" /> : <ArrowRight size={20} className="-rotate-90 transition-transform" />}
              </button>
          </div>

          {showJars && (
              <div className="animate-fade-in">
                  <div className="mb-6 bg-gray-50 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 border border-gray-200">
                      <div className="flex-1 w-full">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nhập thu nhập thực nhận (Tháng này)</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  value={monthlyIncome} 
                                  onChange={(e) => onIncomeChange(e.target.value)} 
                                  className="w-full p-3 pl-10 bg-white rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-bold text-gray-800"
                                  placeholder="Ví dụ: 20000000" 
                              />
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₫</div>
                          </div>
                      </div>
                      <div className="text-xs text-gray-500 md:w-1/2 leading-relaxed">
                          <p>Hệ thống sẽ tự động tính toán số tiền nên phân bổ vào từng hũ. Bấm nút <strong>"Phân bổ"</strong> trên từng hũ để chia tiền vào các danh mục chi tiêu cụ thể.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {JARS_SYSTEM.map(jar => {
                          const incomeVal = parseFloat(monthlyIncome) || 0;
                          const targetAmount = incomeVal * jar.pct;
                          
                          // Calculate current planned budget for this jar's categories
                          const currentPlanned = jar.categories.reduce((sum, cat) => sum + (categoryBudgets[cat] || 0), 0);
                          const diff = targetAmount - currentPlanned;
                          
                          return (
                              <div key={jar.id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow relative overflow-hidden group">
                                  <div className={`absolute top-0 left-0 w-1 h-full ${jar.color}`}></div>
                                  <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-lg ${jar.bgLight} ${jar.textColor}`}>
                                              <jar.icon size={20} />
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-gray-800 text-sm">{jar.name} ({jar.id})</h4>
                                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${jar.bgLight} ${jar.textColor}`}>{jar.pct * 100}%</span>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  <div className="mb-3">
                                      <p className="text-xs text-gray-400 font-bold uppercase">Ngân sách khuyên dùng</p>
                                      <p className={`text-xl font-bold ${jar.textColor}`}>{formatCurrency(targetAmount)}</p>
                                  </div>

                                  <div className="text-xs space-y-2 pt-3 border-t border-gray-50">
                                      {jar.categories.length > 0 ? (
                                          <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Đã lập:</span>
                                                <span className={`font-bold ${Math.abs(diff) > 1000 ? (diff < 0 ? 'text-red-500' : 'text-gray-600') : 'text-emerald-500'}`}>
                                                    {formatCurrency(currentPlanned)}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => openDistribute(jar, targetAmount)}
                                                className={`w-full py-2 rounded-lg font-bold text-center transition-colors ${jar.bgLight} ${jar.textColor} hover:opacity-80`}
                                            >
                                                Phân bổ ngay
                                            </button>
                                          </>
                                      ) : (
                                          <div className="flex justify-between items-center text-gray-400 italic py-2">
                                              <span>Dùng cho Tiết kiệm/Đầu tư</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}
      </div>

      {/* Overview Dashboard */}
      <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-4">
                  <div>
                      <h3 className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Tổng ngân sách các mục đã lập</h3>
                      <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{formatCurrency(totalBudget)}</span>
                      </div>
                  </div>
                  
                  <div>
                      <div className="flex justify-between text-sm mb-2">
                          <span className="text-blue-100">Đã chi tiêu</span>
                          <span className="font-bold">{totalPercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                          <div 
                              className={`h-full rounded-full transition-all duration-1000 ${totalPercent > 100 ? 'bg-red-500' : totalPercent > 80 ? 'bg-orange-400' : 'bg-emerald-400'}`}
                              style={{ width: `${Math.min(totalPercent, 100)}%` }}
                          ></div>
                      </div>
                  </div>
                  
                  <div className="flex gap-4 pt-2">
                       <div>
                           <p className="text-xs text-blue-300 mb-0.5">Thực chi</p>
                           <p className="font-bold">{formatCurrency(totalSpent)}</p>
                       </div>
                       <div className="w-px bg-white/20 h-8"></div>
                       <div>
                           <p className="text-xs text-blue-300 mb-0.5">Còn lại</p>
                           <p className={`font-bold ${totalBudget - totalSpent < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                               {formatCurrency(totalBudget - totalSpent)}
                           </p>
                       </div>
                  </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2 mb-2 text-sm font-bold text-blue-100">
                      <TrendingUp size={16} /> Lời khuyên
                  </div>
                  <p className="text-xs text-blue-50 leading-relaxed">
                      {totalPercent > 90 
                        ? "Cảnh báo: Bạn đã tiêu gần hết ngân sách tổng. Hãy cắt giảm các khoản không cần thiết ngay."
                        : totalPercent > 50 
                            ? "Bạn đang đi đúng hướng. Hãy duy trì tốc độ chi tiêu này để đạt mục tiêu tiết kiệm." 
                            : "Tuyệt vời! Ngân sách vẫn còn rất dồi dào."
                      }
                  </p>
              </div>
          </div>
      </div>

      {/* Budget List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map(cat => {
            const spent = expenseMap[cat] || 0;
            const limit = categoryBudgets[cat] || 0;
            const lastMonth = lastMonthExpenseMap[cat] || 0;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const isOver = spent > limit && limit > 0;
            const isWarning = !isOver && percent > 80;
            
            // Fallback for Custom Categories to prevent crashes
            const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS[Category.OTHER];
            const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS[Category.OTHER];
            const isEditing = editingCategory === cat;

            return (
                <div key={cat} className={`bg-white p-5 rounded-2xl border transition-all group ${isEditing ? 'ring-2 ring-blue-500 border-transparent shadow-lg z-10' : isOver ? 'border-red-200 shadow-sm hover:shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${colorClass} bg-opacity-50 transition-colors`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{cat}</h4>
                                {limit > 0 ? (
                                    <div className="flex items-center gap-1 text-xs font-medium">
                                        {isOver ? (
                                            <span className="text-red-500 flex items-center gap-1"><AlertCircle size={10} /> Vượt ngân sách</span>
                                        ) : isWarning ? (
                                            <span className="text-orange-500 flex items-center gap-1"><AlertTriangle size={10} /> Sắp hết</span>
                                        ) : (
                                            <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={10} /> An toàn</span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">Chưa thiết lập</p>
                                )}
                            </div>
                        </div>
                        
                        {!isEditing && (
                            <button 
                                onClick={() => handleEdit(cat, limit)}
                                className={`p-2 rounded-xl transition-colors ${limit > 0 ? 'text-gray-400 hover:bg-gray-100 hover:text-blue-600' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                            >
                                {limit > 0 ? <Edit2 size={16} /> : <Plus size={18} />}
                            </button>
                        )}
                    </div>

                    {/* Editing Mode */}
                    {isEditing ? (
                        <div className="space-y-3 animate-fade-in">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ngân sách tháng này</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={tempAmount}
                                        onChange={(e) => setTempAmount(e.target.value)}
                                        className="flex-1 border-2 border-blue-100 rounded-xl px-3 py-2 text-lg font-bold focus:border-blue-500 outline-none text-gray-800"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => handleSave(cat)}
                                        className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
                                    >
                                        <Save size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Smart Suggestion */}
                            {lastMonth > 0 && (
                                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-indigo-700">
                                        <History size={14} />
                                        <div className="text-xs">
                                            <span className="opacity-70">Tháng trước tiêu: </span>
                                            <span className="font-bold">{formatCompact(lastMonth)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => applySuggestion(lastMonth)}
                                        className="text-[10px] font-bold bg-white text-indigo-600 px-2 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-500 hover:text-white transition-colors"
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* View Mode */
                        limit > 0 ? (
                            <>
                                <div className="flex justify-between text-sm mb-1.5 items-end">
                                    <span className={`font-bold text-lg ${isOver ? 'text-red-500' : 'text-gray-800'}`}>
                                        {formatCompact(spent)}
                                    </span>
                                    <span className="text-gray-400 text-xs mb-1 font-medium">/ {formatCompact(limit)}</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-orange-400' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2">
                                     <span className="text-[10px] text-gray-400">Đã dùng {percent.toFixed(0)}%</span>
                                     {isOver ? (
                                         <span className="text-[10px] text-red-500 font-bold">Vượt {formatCurrency(spent - limit)}</span>
                                     ) : (
                                         <span className="text-[10px] text-emerald-600 font-bold">Còn {formatCurrency(limit - spent)}</span>
                                     )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <span className="text-xs text-gray-400">Chưa có ngân sách</span>
                                {spent > 0 && (
                                    <div className="mt-1 text-sm font-medium text-gray-600">
                                        Đã chi: {formatCurrency(spent)}
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            );
        })}
        
        {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
                <p>Không có danh mục nào phù hợp với bộ lọc.</p>
            </div>
        )}
      </div>

      {/* DISTRIBUTE MODAL */}
      {distributingJar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${distributingJar.bgLight}`}>
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-white ${distributingJar.textColor}`}>
                              <distributingJar.icon size={20} />
                          </div>
                          <div>
                              <h3 className="font-bold text-gray-800">Phân bổ: {distributingJar.name}</h3>
                              <p className={`text-xs font-bold ${distributingJar.textColor}`}>Mục tiêu: {formatCurrency(distributingJar.targetAmount)}</p>
                          </div>
                      </div>
                      <button onClick={() => setDistributingJar(null)} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <div className="space-y-4">
                          {distributingJar.categories.map((cat: string) => (
                              <div key={cat}>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{cat}</label>
                                  <div className="relative">
                                      <input 
                                          type="number" 
                                          value={jarDistribution[cat] || ''} 
                                          onChange={(e) => setJarDistribution({...jarDistribution, [cat]: e.target.value})}
                                          className="w-full p-3 pl-3 pr-10 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-blue-500 font-medium"
                                          placeholder="0"
                                      />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">VND</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          {(() => {
                              const values = Object.values(jarDistribution) as string[];
                              const allocated = values.reduce((sum: number, val: string) => sum + (parseFloat(val) || 0), 0);
                              const diff = (distributingJar.targetAmount || 0) - allocated;
                              return (
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-500">Đã phân bổ: <strong>{formatCurrency(allocated)}</strong></span>
                                      <span className={`font-bold ${diff < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                          {diff < 0 ? `Vượt ${formatCurrency(Math.abs(diff))}` : `Còn dư ${formatCurrency(diff)}`}
                                      </span>
                                  </div>
                              )
                          })()}
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-100">
                      <button 
                        onClick={handleDistributeSave}
                        className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                          <Check size={18} /> Lưu Phân Bổ
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BudgetPlanner;
