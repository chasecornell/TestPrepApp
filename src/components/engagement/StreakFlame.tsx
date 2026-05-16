import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  streak: number;
  freezes: number;
}

export default function StreakFlame({ streak, freezes }: Props) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-gray-600'}`} />
        </motion.div>
        {streak > 0 && (
          <div className="absolute inset-0 bg-orange-500/20 blur-lg rounded-full -z-1" />
        )}
      </div>
      <div>
        <div className="text-sm font-black leading-none">{streak}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Day Streak</div>
      </div>
      
      {freezes > 0 && (
        <div className="flex items-center gap-1 pl-4 border-l border-white/10 text-blue-400">
          <Snowflake className="w-3 h-3" />
          <span className="text-[10px] font-bold">{freezes}</span>
        </div>
      )}
    </div>
  );
}
