import React from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle2 } from 'lucide-react';
import { DailyGoalType, DAILY_GOAL_VALUES } from '../../types';

interface Props {
  goal: DailyGoalType;
  progress: number;
}

export default function DailyGoalCard({ goal, progress }: Props) {
  const goalValue = DAILY_GOAL_VALUES[goal];
  const percentage = Math.min(100, (progress / goalValue) * 100);
  const isComplete = progress >= goalValue;

  return (
    <div className="card-glass border-white/5 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Target className={`w-4 h-4 ${isComplete ? 'text-neon-cyan' : 'text-gray-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Daily Goal</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-neon-cyan">
          {goal} ({goalValue} Qs)
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xl font-black">{progress} / {goalValue}</span>
          {isComplete && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <CheckCircle2 className="w-5 h-5 text-neon-cyan" />
            </motion.div>
          )}
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={`h-full ${isComplete ? 'bg-neon-cyan' : 'bg-gray-500'}`}
          />
        </div>
      </div>
      
      {isComplete && (
        <p className="text-[10px] text-neon-cyan font-bold animate-pulse">
          GOAL ACHIEVED! +50 XP BONUS SYNCED.
        </p>
      )}
    </div>
  );
}
