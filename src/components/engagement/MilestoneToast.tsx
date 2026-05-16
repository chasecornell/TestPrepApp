import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, X, Sparkles } from 'lucide-react';

interface Props {
  badgeName: string;
  onClose: () => void;
}

export default function MilestoneToast({ badgeName, onClose }: Props) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
    >
      <div className="bg-black/90 border-2 border-neon-cyan/50 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_30px_rgba(0,243,255,0.2)] flex items-center gap-4 relative overflow-hidden">
        {/* Animated background flare */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-transparent animate-pulse" />
        
        <div className="w-12 h-12 rounded-xl bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50 relative">
          <Award className="w-6 h-6 text-neon-cyan" />
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-3 h-3 text-neon-yellow animate-bounce" />
          </div>
        </div>

        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-neon-cyan mb-1">Milestone Achieved!</div>
          <div className="text-sm font-black text-white uppercase tracking-tighter">Unlocked: {badgeName}</div>
          <p className="text-[9px] text-gray-400 font-bold mt-1">XP Reward Synced to Profile.</p>
        </div>

        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/5 rounded-full text-gray-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
