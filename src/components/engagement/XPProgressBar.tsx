import React from 'react';
import { motion } from 'motion/react';

interface Props {
  currentXP: number;
  level: number;
  xpNeeded: number;
}

export default function XPProgressBar({ currentXP, level, xpNeeded }: Props) {
  const percentage = Math.min(100, (currentXP / xpNeeded) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
            <span className="text-neon-cyan font-black text-xs">{level}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Level</span>
        </div>
        <span className="text-[10px] font-mono text-neon-cyan">{currentXP} / {xpNeeded} XP</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-gradient-to-r from-neon-cyan to-blue-500 shadow-[0_0_10px_rgba(0,243,255,0.3)]"
        />
      </div>
    </div>
  );
}
