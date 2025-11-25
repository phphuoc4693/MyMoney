
import React, { useMemo } from 'react';
import { SavingsGoal, Transaction } from '../types';
import { PiggyBank, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props {
  goals: SavingsGoal[];
  onOpenGoal: (goal: SavingsGoal) => void;
  isPrivacyMode?: boolean;
}

const DailySavingsWidget: React.FC<Props> = ({ goals, onOpenGoal, isPrivacyMode = false }) => {
  
  // Filter active goals with deadlines
  const activeGoals = useMemo(() => {
      return goals.filter(g => 
          g.deadline && 
          g.currentAmount < g.targetAmount && 
          new Date(g.deadline) > new Date()
      );
  }, [goals]);

  // Calculate daily amount needed for each goal
  const dailyGoalsData = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);

      return activeGoals.map(g => {
          const deadline = new Date(g.deadline);
          const diffTime = Math.max(0, deadline.getTime() - today.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const remaining = g.targetAmount - g.currentAmount;
          const dailyNeeded = diffDays > 0 ? remaining / diffDays : remaining;

          return {
              ...g,
              dailyNeeded,
              daysLeft: diffDays
          };
      }).sort((a, b) => b.dailyNeeded - a.dailyNeeded); // Show highest need first
  }, [activeGoals]);

  const totalDailyNeeded = dailyGoalsData.reduce((sum, g) => sum + g.dailyNeeded, 0);

  const formatCurrency = (val: number) => {
    if (isPrivacyMode) return '******';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  if (dailyGoalsData.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 text-pink-500 rounded-lg">
                    <Calendar size={16} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">Cần tiết kiệm hôm nay</h3>
            </div>
            <span className="bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                Tổng: {formatCurrency(totalDailyNeeded)}
            </span>
        </div>

        <div className="space-y-3">
            {dailyGoalsData.slice(0, 3).map(goal => (
                <div 
                    key={goal.id} 
                    onClick={() => onOpenGoal(goal)}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-pink-50 border border-transparent hover:border-pink-100 cursor-pointer transition-all group/item"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white border border-pink-100 text-pink-500 shadow-sm">
                            <PiggyBank size={18} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{goal.name}</h4>
                            <p className="text-xs text-gray-400">còn {goal.daysLeft} ngày</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-pink-600 text-sm">{formatCurrency(goal.dailyNeeded)}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 group-hover/item:text-pink-400">
                             Nạp ngay <ChevronRight size={10} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default DailySavingsWidget;
