
import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { JARS_SYSTEM } from '../constants';
import { Target, Info } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  monthlyIncome: number;
  currentMonth: string; // YYYY-MM
  isPrivacyMode?: boolean;
}

const JarsWidget: React.FC<Props> = ({ transactions, monthlyIncome, currentMonth, isPrivacyMode = false }) => {
  
  // Calculate spending for each Jar
  const jarsStatus = useMemo(() => {
      const status = JARS_SYSTEM.map(jar => {
          const target = monthlyIncome * jar.pct;
          
          // Calculate actual spent in this jar's categories
          const spent = transactions
            .filter(t => 
                t.type === TransactionType.EXPENSE && 
                t.date.startsWith(currentMonth) &&
                jar.categories.includes(t.category)
            )
            .reduce((sum, t) => sum + t.amount, 0);
            
          const percent = target > 0 ? (spent / target) * 100 : 0;
          
          return { ...jar, target, spent, percent };
      });
      
      return status;
  }, [transactions, monthlyIncome, currentMonth]);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  if (monthlyIncome <= 0) {
      return (
          <div className="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm text-center">
              <Target size={32} className="text-blue-300 mx-auto mb-2" />
              <h3 className="font-bold text-gray-700">Quy tắc 6 Chiếc Hũ</h3>
              <p className="text-xs text-gray-400 mb-3">Thiết lập thu nhập trong mục "Lập kế hoạch" để kích hoạt tính năng này.</p>
          </div>
      );
  }

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    <Target size={16} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">6 Chiếc Hũ (Thực tế vs Kế hoạch)</h3>
            </div>
            <div className="text-[10px] text-gray-400 font-medium bg-white px-2 py-1 rounded-full border border-gray-100">
                Thu nhập: {formatCurrency(monthlyIncome)}
            </div>
        </div>

        <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {jarsStatus.map(jar => {
                    const isOver = jar.spent > jar.target;
                    const barColor = isOver ? 'bg-red-500' : jar.color.replace('bg-', 'bg-'); // Reuse jar color or default
                    
                    // Custom bar colors for better visualization
                    let visualColor = 'bg-blue-500';
                    if(jar.id === 'NEC') visualColor = isOver ? 'bg-red-500' : 'bg-blue-500';
                    if(jar.id === 'LTSS') visualColor = 'bg-emerald-500';
                    if(jar.id === 'PLAY') visualColor = isOver ? 'bg-red-500' : 'bg-pink-500';
                    if(jar.id === 'EDUC') visualColor = 'bg-indigo-500';
                    if(jar.id === 'FFA') visualColor = 'bg-purple-500';
                    if(jar.id === 'GIVE') visualColor = 'bg-orange-500';

                    return (
                        <div key={jar.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-lg bg-opacity-10 ${jar.bgLight} ${jar.textColor}`}>
                                    <jar.icon size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-700">{jar.id}</span>
                                        <span className={`text-[10px] font-bold ${isOver ? 'text-red-500' : 'text-gray-500'}`}>
                                            {formatCurrency(jar.spent)} / {formatCurrency(jar.target)}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${visualColor}`}
                                            style={{ width: `${Math.min(jar.percent, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default JarsWidget;
