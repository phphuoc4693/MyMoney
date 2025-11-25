
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Asset, AssetType, Debt } from '../types';
import { Activity, TrendingUp, ShieldCheck, AlertTriangle, PiggyBank, Scale, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[]; // Current Month (Filtered)
  allTransactions: Transaction[]; // Full History (For Averages)
  budget: number;
  assets: Asset[];
  debts: Debt[];
  isPrivacyMode?: boolean;
  onOpenDetails?: () => void;
}

const FinancialHealthWidget: React.FC<Props> = ({ transactions, allTransactions, budget, assets, debts, isPrivacyMode = false, onOpenDetails }) => {
  const analysis = useMemo(() => {
    // 1. DATA PREP
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    const totalAssets = assets.filter(a => a.type !== AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
    const liquidAssets = assets.filter(a => a.type === AssetType.CASH || a.type === AssetType.SAVINGS).reduce((sum, a) => sum + a.value, 0);
    const investAssets = assets.filter(a => [AssetType.STOCK, AssetType.CRYPTO, AssetType.REAL_ESTATE, AssetType.GOLD, AssetType.FUND].includes(a.type)).reduce((sum, a) => sum + a.value, 0);
    
    const totalDebt = debts.filter(d => d.type === 'BORROW' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0) + 
                      assets.filter(a => a.type === AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);

    // Calculate Average Monthly Burn from History (Last 3 months)
    // This makes the Runway metric stable and accurate, instead of fluctuating wildly based on current month's day 1 expense.
    const avgBurn = (() => {
        const expenses = allTransactions.filter(t => t.type === TransactionType.EXPENSE);
        if (expenses.length === 0) return expense || 1; // Fallback to current month if no history
        
        const today = new Date();
        let total = 0;
        let monthsCount = 0;
        
        // Check last 3 months (excluding current)
        for(let i=1; i<=3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const k = d.toISOString().slice(0,7);
            const monthExp = expenses.filter(t => t.date.startsWith(k)).reduce((sum, t) => sum + t.amount, 0);
            if (monthExp > 0) {
                total += monthExp;
                monthsCount++;
            }
        }
        // If history exists, use it. Otherwise use current month expense if > 0, else 1 to avoid div/0
        return monthsCount > 0 ? total / monthsCount : (expense > 0 ? expense : 1);
    })();

    // 2. METRICS CALCULATION & SCORING (0-100)

    // A. Savings Rate (Target: 20% of Current Month Income)
    // We use current month here because it's a performance metric for "Now"
    const savingsRate = income > 0 ? (income - expense) / income : 0;
    let scoreSavings = Math.min(100, (savingsRate / 0.2) * 100);
    if (savingsRate < 0) scoreSavings = 0;

    // B. Runway / Liquidity (Target: 6 months of AVERAGE expense)
    const runwayMonths = liquidAssets / avgBurn;
    const scoreRunway = Math.min(100, (runwayMonths / 6) * 100);

    // C. Debt Control (Target: Debt < 30% of Assets)
    const debtRatio = totalAssets > 0 ? totalDebt / totalAssets : 0;
    let scoreDebt = 100;
    if (debtRatio > 0.6) scoreDebt = 0; // High risk > 60%
    else if (debtRatio > 0) scoreDebt = 100 - (debtRatio / 0.6) * 100;

    // D. Budget Discipline
    // Based on current month budget usage vs time passed? 
    // Simplification: If you stay under budget, score is high.
    const budgetUsage = budget > 0 ? expense / budget : 1;
    let scoreBudget = 0;
    if (budgetUsage <= 0.9) scoreBudget = 100; 
    else if (budgetUsage <= 1.0) scoreBudget = 80; 
    else if (budgetUsage <= 1.2) scoreBudget = 40; 
    else scoreBudget = 0; 

    // E. Investment / Growth (Target: > 40% Invested)
    const investRatio = totalAssets > 0 ? investAssets / totalAssets : 0;
    const scoreGrowth = Math.min(100, (investRatio / 0.4) * 100);

    // 3. AGGREGATE SCORES
    const overallScore = Math.round((scoreSavings + scoreRunway + scoreDebt + scoreBudget + scoreGrowth) / 5);

    return {
        overallScore,
        breakdown: [
            { label: 'Tiết kiệm', score: scoreSavings, icon: PiggyBank, color: 'bg-blue-500' },
            { label: 'Thanh khoản', score: scoreRunway, icon: ShieldCheck, color: 'bg-green-500' },
            { label: 'Nợ', score: scoreDebt, icon: Scale, color: 'bg-orange-500' },
            { label: 'Kỷ luật', score: scoreBudget, icon: AlertTriangle, color: 'bg-red-500' },
            { label: 'Đầu tư', score: scoreGrowth, icon: TrendingUp, color: 'bg-purple-500' },
        ]
    };
  }, [transactions, allTransactions, budget, assets, debts]);

  const getGrade = (s: number) => {
      if (s >= 90) return { label: 'A+', color: 'text-emerald-500', bg: 'bg-emerald-500', text: 'Xuất sắc' };
      if (s >= 80) return { label: 'A', color: 'text-green-500', bg: 'bg-green-500', text: 'Rất tốt' };
      if (s >= 65) return { label: 'B', color: 'text-blue-500', bg: 'bg-blue-500', text: 'Khá' };
      if (s >= 50) return { label: 'C', color: 'text-yellow-500', bg: 'bg-yellow-500', text: 'Trung bình' };
      return { label: 'D', color: 'text-red-500', bg: 'bg-red-500', text: 'Cảnh báo' };
  };

  const grade = getGrade(analysis.overallScore);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (analysis.overallScore / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:shadow-md" onClick={onOpenDetails}>
       <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-2">
               <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                   <Activity size={18} />
               </div>
               <h3 className="font-bold text-gray-800 text-sm">Sức khỏe Tài chính</h3>
           </div>
           {onOpenDetails && (
               <div className="bg-gray-50 p-1 rounded-full text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                   <ChevronRight size={16} />
               </div>
           )}
       </div>

       <div className="flex items-center gap-4">
           {/* Circular Progress */}
           <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={radius} className="text-gray-100" strokeWidth="6" fill="none" stroke="currentColor" />
                    <circle cx="40" cy="40" r={radius} className={grade.color} strokeWidth="6" fill="none" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${grade.color}`}>{analysis.overallScore}</span>
                    <span className="text-[9px] text-gray-400 font-bold">{grade.label}</span>
                </div>
           </div>

           {/* Breakdown Mini Bars */}
           <div className="flex-1 space-y-1.5">
               {analysis.breakdown.slice(0, 3).map((item, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                       <div className={`p-1 rounded-md bg-gray-50 text-gray-400`}>
                           <item.icon size={10} />
                       </div>
                       <div className="flex-1">
                           <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                               <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.score}%` }}></div>
                           </div>
                       </div>
                   </div>
               ))}
               <p className="text-[10px] text-gray-400 text-right pt-1">+2 chỉ số khác</p>
           </div>
       </div>
    </div>
  );
};

export default FinancialHealthWidget;
