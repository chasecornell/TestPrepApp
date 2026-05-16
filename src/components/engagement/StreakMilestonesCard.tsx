import React from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  streak: number;
}

const MILESTONES = [
  { day: 3, xp: 50 },
  { day: 7, xp: 100 },
  { day: 14, xp: 200 },
  { day: 30, xp: 500 },
  { day: 60, xp: 1000 },
  { day: 100, xp: 2000 }
];

export default function StreakMilestonesCard({ streak }: Props) {
  const nextMilestone = MILESTONES.find(m => m.day > streak) || MILESTONES[MILESTONES.length - 1];

  return (
    <div className="card-glass border-orange-500/20 bg-orange-500/5 p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-orange-500">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Streak Milestones</span>
        </div>
        <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded-full">
           <span className="text-[10px] font-black text-orange-500">{streak} DAYS</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {MILESTONES.map((m) => {
          const isUnlocked = streak >= m.day;
          const isNext = m.day === nextMilestone.day && !isUnlocked;
          
          return (
            <div key={m.day} className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
              isUnlocked ? 'border-orange-500/30 bg-orange-500/10 opacity-60' :
              isNext ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.1)]' :
              'border-white/5 opacity-40'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isUnlocked ? 'bg-orange-500' : isNext ? 'bg-orange-500 animate-pulse' : 'bg-gray-700'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{m.day} Day Unlock</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] font-mono ${isUnlocked ? 'text-gray-500 line-through' : 'text-orange-500'}`}>+{m.xp} XP</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {streak < nextMilestone.day && (
        <p className="text-[9px] text-gray-500 font-medium italic text-center">
          Next sync: Reach day {nextMilestone.day} for a massive {nextMilestone.xp} XP burst.
        </p>
      )}
    </div>
  );
}
