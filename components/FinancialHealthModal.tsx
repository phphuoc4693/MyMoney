
import React, { useMemo } from 'react';
import { Transaction, TransactionType, Asset, AssetType, Debt } from '../types';
import { X, ShieldCheck, AlertTriangle, TrendingUp, PiggyBank, Scale, Activity, CheckCircle2, Sword, Shield, ArrowRight, Lightbulb, Stethoscope, Info } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[]; // Current Month (Filtered)
  allTransactions: Transaction[]; // Full History
  budget: number;
  assets: Asset[];
  debts: Debt[];
  isPrivacyMode?: boolean;
}

const FinancialHealthModal: React.FC<Props> = ({ isOpen, onClose, transactions, allTransactions, budget, assets, debts, isPrivacyMode = false }) => {
  const analysis = useMemo(() => {
    // 1. DATA PREP
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    
    const totalAssets = assets.filter(a => a.type !== AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);
    const liquidAssets = assets.filter(a => a.type === AssetType.CASH || a.type === AssetType.SAVINGS).reduce((sum, a) => sum + a.value, 0);
    const investAssets = assets.filter(a => [AssetType.STOCK, AssetType.CRYPTO, AssetType.REAL_ESTATE, AssetType.GOLD, AssetType.FUND].includes(a.type)).reduce((sum, a) => sum + a.value, 0);
    
    const totalDebt = debts.filter(d => d.type === 'BORROW' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0) + 
                      assets.filter(a => a.type === AssetType.DEBT).reduce((sum, a) => sum + a.value, 0);

    // Calculate Average Monthly Burn (Identical Logic to Widget)
    const avgBurn = (() => {
        const expenses = allTransactions.filter(t => t.type === TransactionType.EXPENSE);
        if (expenses.length === 0) return expense || 1;
        
        const today = new Date();
        let total = 0;
        let monthsCount = 0;
        
        for(let i=1; i<=3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const k = d.toISOString().slice(0,7);
            const monthExp = expenses.filter(t => t.date.startsWith(k)).reduce((sum, t) => sum + t.amount, 0);
            if (monthExp > 0) {
                total += monthExp;
                monthsCount++;
            }
        }
        return monthsCount > 0 ? total / monthsCount : (expense > 0 ? expense : 1);
    })();

    // 2. METRICS CALCULATION & SCORING (0-100)

    // A. Savings Rate (Target: 20%)
    const savingsRate = income > 0 ? (income - expense) / income : 0;
    let scoreSavings = Math.min(100, (savingsRate / 0.2) * 100);
    if (savingsRate < 0) scoreSavings = 0;

    // B. Runway / Liquidity (Target: 6 months of AVG expense)
    const runwayMonths = avgBurn > 0 ? liquidAssets / avgBurn : 0;
    const scoreRunway = Math.min(100, (runwayMonths / 6) * 100);

    // C. Debt Control (Target: Debt < 30% of Assets)
    const debtRatio = totalAssets > 0 ? totalDebt / totalAssets : 0;
    let scoreDebt = 100;
    if (debtRatio > 0.6) scoreDebt = 0; // High risk
    else if (debtRatio > 0) scoreDebt = 100 - (debtRatio / 0.6) * 100;

    // D. Budget Discipline
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
    
    // Defense vs Offense
    const defenseScore = Math.round((scoreRunway + scoreDebt + scoreBudget) / 3);
    const offenseScore = Math.round((scoreSavings + scoreGrowth) / 2);

    // 4. GENERATE ADVICE
    const adviceList: { type: 'critical' | 'warning' | 'good', text: string, icon: any }[] = [];

    if (runwayMonths < 3) adviceList.push({ type: 'critical', text: 'Khẩn cấp: Quỹ dự phòng quá mỏng (< 3 tháng chi tiêu). Hãy ngừng đầu tư rủi ro, tích trữ tiền mặt ngay.', icon: ShieldCheck });
    if (debtRatio > 0.5) adviceList.push({ type: 'critical', text: 'Cảnh báo nợ: Nợ chiếm >50% tài sản. Hãy áp dụng phương pháp trả nợ "Tuyết lở" (Trả khoản lãi cao nhất trước).', icon: Scale });
    if (budgetUsage > 1.0) adviceList.push({ type: 'warning', text: 'Vỡ kế hoạch: Bạn đang tiêu lạm vào ngân sách. Cần cắt giảm chi phí biến đổi (Ăn ngoài, Cafe).', icon: AlertTriangle });
    if (savingsRate < 0.1 && income > 0) adviceList.push({ type: 'warning', text: 'Tiết kiệm thấp: Hãy thử quy tắc "Pay yourself first" - Trích 10% lương ngay khi nhận được.', icon: PiggyBank });
    if (investRatio < 0.2 && runwayMonths > 6) adviceList.push({ type: 'good', text: 'Cơ hội: Bạn có nhiều tiền mặt nhàn rỗi. Hãy bắt đầu đầu tư (Vàng, Chứng chỉ quỹ) để chống lạm phát.', icon: TrendingUp });
    
    if (adviceList.length === 0) adviceList.push({ type: 'good', text: 'Tài chính của bạn đang rất khỏe mạnh. Hãy duy trì kỷ luật này!', icon: CheckCircle2 });

    // 5. RADAR DATA
    const chartData = [
        { subject: 'Tiết kiệm', A: Math.round(scoreSavings), fullMark: 100 },
        { subject: 'Thanh khoản', A: Math.round(scoreRunway), fullMark: 100 },
        { subject: 'Sạch nợ', A: Math.round(scoreDebt), fullMark: 100 },
        { subject: 'Kỷ luật', A: Math.round(scoreBudget), fullMark: 100 },
        { subject: 'Đầu tư', A: Math.round(scoreGrowth), fullMark: 100 },
    ];

    return {
        scores: { overallScore, defenseScore, offenseScore, scoreSavings, scoreRunway, scoreDebt, scoreBudget, scoreGrowth },
        metrics: { savingsRate, runwayMonths, debtRatio, budgetUsage, investRatio },
        chartData,
        adviceList
    };
  }, [transactions, allTransactions, budget, assets, debts]);

  const getGrade = (score: number) => {
      if (score >= 90) return { grade: 'S', color: 'text-emerald-500', bg: 'bg-emerald-100', text: 'Huyền Thoại', desc: 'Tự do tài chính trong tầm tay!' };
      if (score >= 80) return { grade: 'A', color: 'text-green-500', bg: 'bg-green-100', text: 'Xuất Sắc', desc: 'Nền tảng vững chắc.' };
      if (score >= 65) return { grade: 'B', color: 'text-blue-500', bg: 'bg-blue-100', text: 'Khá Tốt', desc: 'Cần tối ưu thêm một chút.' };
      if (score >= 50) return { grade: 'C', color: 'text-yellow-500', bg: 'bg-yellow-100', text: 'Trung Bình', desc: 'Cần chấn chỉnh ngay.' };
      return { grade: 'D', color: 'text-red-500', bg: 'bg-red-100', text: 'Nguy Hiểm', desc: 'Báo động đỏ! Cần thay đổi toàn diện.' };
  };

  const getDefenseAssessment = (score: number) => {
      if (score >= 80) return 'Pháo đài kiên cố';
      if (score >= 50) return 'Cần gia cố thêm';
      return 'Rất dễ tổn thương';
  }

  const getOffenseAssessment = (score: number) => {
      if (score >= 80) return 'Tăng tốc mạnh mẽ';
      if (score >= 50) return 'Đang tăng trưởng';
      return 'Dậm chân tại chỗ';
  }

  const grade = getGrade(analysis.scores.overallScore);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-gray-50 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                    <Activity size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Chẩn Đoán Tài Chính</h2>
                    <p className="text-xs text-gray-500">Báo cáo phân tích 360 độ</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-500" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            
            {/* Top Section: Score & Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Score Card */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${grade.color.includes('emerald') || grade.color.includes('green') ? 'from-emerald-50 to-transparent' : grade.color.includes('red') ? 'from-red-50 to-transparent' : 'from-blue-50 to-transparent'} opacity-50`}></div>
                    
                    <div className="relative mb-4">
                        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" className="text-gray-100" strokeWidth="8" fill="none" stroke="currentColor" />
                            <circle 
                                cx="50" cy="50" r="45" 
                                className={grade.color} 
                                strokeWidth="8" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (analysis.scores.overallScore / 100 * 283)} 
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-5xl font-bold ${grade.color}`}>{analysis.scores.overallScore}</span>
                            <span className="text-xs font-bold text-gray-400 uppercase">Điểm số</span>
                        </div>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold mb-2 ${grade.bg} ${grade.color}`}>
                        Hạng {grade.grade}
                    </div>
                    <p className="text-sm text-gray-600 text-center font-medium">{grade.desc}</p>

                    {/* Defense vs Offense Bars */}
                    <div className="w-full mt-6 space-y-3">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-1 font-bold text-blue-700"><Shield size={12} /> Phòng thủ</span>
                                <span className="font-bold text-blue-700">{analysis.scores.defenseScore}/100</span>
                            </div>
                            <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${analysis.scores.defenseScore}%` }}></div></div>
                            <p className="text-[10px] text-blue-600 mt-1 text-right italic">{getDefenseAssessment(analysis.scores.defenseScore)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="flex items-center gap-1 font-bold text-red-600"><Sword size={12} /> Tấn công</span>
                                <span className="font-bold text-red-600">{analysis.scores.offenseScore}/100</span>
                            </div>
                            <div className="w-full h-2.5 bg-red-100 rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${analysis.scores.offenseScore}%` }}></div></div>
                            <p className="text-[10px] text-red-600 mt-1 text-right italic">{getOffenseAssessment(analysis.scores.offenseScore)}</p>
                        </div>
                    </div>

                    {/* Explanation Box */}
                    <div className="mt-4 bg-white/60 p-3 rounded-xl border border-gray-200 text-[10px] text-gray-500 relative z-10 backdrop-blur-sm">
                        <div className="flex items-start gap-2 mb-2">
                            <Shield size={12} className="text-blue-500 mt-0.5 shrink-0" />
                            <p><strong>Phòng thủ (An toàn):</strong> Khả năng sinh tồn khi gặp biến cố. Cấu thành từ: Thanh khoản, Sạch nợ & Kỷ luật ngân sách.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <Sword size={12} className="text-red-500 mt-0.5 shrink-0" />
                            <p><strong>Tấn công (Tăng trưởng):</strong> Tốc độ làm giàu và tự do tài chính. Cấu thành từ: Tỷ lệ tiết kiệm & Đầu tư.</p>
                        </div>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="lg:col-span-4 bg-white rounded-3xl p-4 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Biểu đồ năng lực</h4>
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis.chartData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Điểm" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.3} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Prescription (Action Plan) */}
                <div className="lg:col-span-4 bg-indigo-900 text-white rounded-3xl p-6 shadow-lg flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-indigo-300">
                        <Stethoscope size={20} />
                        <h4 className="text-sm font-bold uppercase tracking-widest">Lời khuyên bác sĩ</h4>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {analysis.adviceList.map((advice, idx) => (
                            <div key={idx} className="flex gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/5">
                                <div className={`mt-0.5 shrink-0 ${advice.type === 'critical' ? 'text-red-400' : advice.type === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                    <advice.icon size={18} />
                                </div>
                                <p className="text-xs leading-relaxed text-indigo-50 opacity-90">{advice.text}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={onClose} className="mt-4 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                        Đã hiểu <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* Bottom Section: Detailed Metrics */}
            <div>
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Lightbulb size={20} className="text-yellow-500"/> Chi tiết 5 Trụ cột</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 1. Runway */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5"><ShieldCheck size={40} /></div>
                        <div className="flex items-center gap-2 text-blue-600 mb-2 text-xs font-bold uppercase">
                            <ShieldCheck size={14} /> Thanh khoản
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">{analysis.metrics.runwayMonths.toFixed(1)} <span className="text-sm font-medium text-gray-400">tháng</span></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${analysis.scores.scoreRunway >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${analysis.scores.scoreRunway}%` }}></div></div>
                        <p className="text-[10px] text-gray-400">Mục tiêu: &gt; 6 tháng chi tiêu</p>
                    </div>

                    {/* 2. Savings */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5"><PiggyBank size={40} /></div>
                        <div className="flex items-center gap-2 text-green-600 mb-2 text-xs font-bold uppercase">
                            <PiggyBank size={14} /> Tiết kiệm
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">{(analysis.metrics.savingsRate * 100).toFixed(1)} <span className="text-sm font-medium text-gray-400">%</span></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${analysis.scores.scoreSavings >= 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${analysis.scores.scoreSavings}%` }}></div></div>
                        <p className="text-[10px] text-gray-400">Mục tiêu: &gt; 20% thu nhập</p>
                    </div>

                    {/* 3. Debt */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5"><Scale size={40} /></div>
                        <div className="flex items-center gap-2 text-orange-600 mb-2 text-xs font-bold uppercase">
                            <Scale size={14} /> Tỷ lệ Nợ
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${analysis.metrics.debtRatio > 0.5 ? 'text-red-500' : 'text-gray-800'}`}>{(analysis.metrics.debtRatio * 100).toFixed(1)} <span className="text-sm font-medium text-gray-400">%</span></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${analysis.scores.scoreDebt >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${analysis.scores.scoreDebt}%` }}></div></div>
                        <p className="text-[10px] text-gray-400">Mục tiêu: &lt; 30% tài sản</p>
                    </div>

                    {/* 4. Budget */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5"><AlertTriangle size={40} /></div>
                        <div className="flex items-center gap-2 text-red-600 mb-2 text-xs font-bold uppercase">
                            <AlertTriangle size={14} /> Kỷ luật
                        </div>
                        <p className={`text-2xl font-bold mb-1 ${analysis.metrics.budgetUsage > 1 ? 'text-red-500' : 'text-gray-800'}`}>{(analysis.metrics.budgetUsage * 100).toFixed(0)} <span className="text-sm font-medium text-gray-400">%</span></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${analysis.scores.scoreBudget >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${analysis.scores.scoreBudget}%` }}></div></div>
                        <p className="text-[10px] text-gray-400">Mục tiêu: &lt; 100% ngân sách</p>
                    </div>

                    {/* 5. Growth */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5"><TrendingUp size={40} /></div>
                        <div className="flex items-center gap-2 text-purple-600 mb-2 text-xs font-bold uppercase">
                            <TrendingUp size={14} /> Đầu tư
                        </div>
                        <p className="text-2xl font-bold text-gray-800 mb-1">{(analysis.metrics.investRatio * 100).toFixed(1)} <span className="text-sm font-medium text-gray-400">%</span></p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`h-full rounded-full ${analysis.scores.scoreGrowth >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${analysis.scores.scoreGrowth}%` }}></div></div>
                        <p className="text-[10px] text-gray-400">Mục tiêu: &gt; 40% tài sản</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealthModal;
