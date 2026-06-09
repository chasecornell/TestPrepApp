import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Clock, Zap } from 'lucide-react';

interface Props {
  totalTimeMs: number;
  questionCount: number;
  onExit: () => void;
}

export default function SessionCompleteView({ totalTimeMs, questionCount, onExit }: Props) {
  const totalSeconds = Math.floor(totalTimeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const avgSeconds = totalSeconds / questionCount;
  
  let speedFeedback = "Excellent pacing! You are moving precisely at the target rate.";
  let speedColor = "text-neon-cyan";
  if (avgSeconds > 60) {
    speedFeedback = "You're taking your time. Try to identify trap answers faster, but accuracy is always #1.";
    speedColor = "text-neon-yellow";
  } else if (avgSeconds < 30) {
    speedFeedback = "Blazing speed! Make sure you aren't rushing past crucial details.";
    speedColor = "text-neon-pink";
  }

  return (
    <div className="max-w-md mx-auto space-y-8 text-center pt-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-neon-cyan/20 border border-neon-cyan rounded-full flex items-center justify-center mx-auto"
      >
        <Zap className="w-12 h-12 text-neon-cyan" fill="currentColor" />
      </motion.div>

      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Session Complete</h2>
        <p className="text-gray-400">Great work pushing your limits today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card-glass p-4 border border-white/10">
          <div className="flex justify-center mb-2">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Time</div>
          <div className="text-2xl font-black font-mono">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="card-glass p-4 border border-white/10">
          <div className="flex justify-center mb-2">
            <CheckCircle className="w-6 h-6 text-gray-400" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Questions</div>
          <div className="text-2xl font-black font-mono">
            {questionCount}
          </div>
        </div>
      </div>

      <div className="card-glass p-6 text-left border border-white/10">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Pacing Analysis</div>
        <div className={`text-xl font-black mb-2 ${speedColor}`}>
          Avg {avgSeconds.toFixed(1)}s / Question
        </div>
        <p className="text-sm text-gray-300">
          {speedFeedback}
        </p>
      </div>

      <button
        onClick={onExit}
        className="w-full btn-primary py-4 uppercase font-black tracking-widest"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
