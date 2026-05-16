import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../types';
import { Zap, AlertTriangle, FastForward, Sparkles } from 'lucide-react';
import { calculateXPGain } from '../services/gamificationService';

interface Props {
  question: Question;
  onAnswer: (correct: boolean, timeTaken: number) => void;
}

export default function QuestionView({ question, onAnswer }: Props) {
  const [startTime] = useState(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60s per micro-task

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSelect = (idx: number) => {
    if (isRevealed) return;
    setSelected(idx);
    setIsRevealed(true);
    // 2. Update Profile State
    const xpGained = calculateXPGain(idx === question.correctAnswerIndex, Date.now() - startTime, 0); // Streak placeholder
    setXpAwarded(xpGained);
    
    const correct = idx === question.correctAnswerIndex;
    onAnswer(correct, Date.now() - startTime);
  };

  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Velocity Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          className={`h-full ${timeLeft < 10 ? 'bg-neon-pink' : 'bg-neon-cyan'}`}
        />
      </div>

      <motion.div 
        key={question.id}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="card-glass border-neon-cyan/20 p-5 sm:p-8"
      >
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold tracking-widest rounded-full uppercase border border-neon-cyan/20">
            {question.conceptId.replace('_', ' ')}
          </span>
          <span className="text-gray-500 font-mono text-[10px] sm:text-xs">V-LVL: {question.difficulty}</span>
        </div>

        <h3 className="text-lg sm:text-xl font-medium mb-6 sm:mb-8 leading-relaxed">
          {question.text}
        </h3>

        <div className="grid gap-2 sm:gap-3">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.correctAnswerIndex;
            const isSelected = idx === selected;
            
            let borderColor = 'border-white/10';
            let bgColor = 'bg-white/5';
            
            if (isRevealed) {
              if (isCorrect) borderColor = 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)]';
              else if (isSelected) borderColor = 'border-neon-pink bg-neon-pink/10 text-neon-pink transition-all';
            } else if (isSelected) {
              borderColor = 'border-neon-cyan';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isRevealed}
                className={`w-full p-4 sm:p-5 text-left rounded-xl border transition-all duration-200 flex justify-between items-center text-sm sm:text-base ${borderColor} ${bgColor} ${!isRevealed && 'hover:bg-white/10'}`}
              >
                <span className="flex-1 pr-2">{opt}</span>
                {isRevealed && isCorrect && <Zap className="w-4 h-4 shrink-0" />}
                {isRevealed && isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Strategy Engine Layer (Cheat Sheet) */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="card-glass border-neon-yellow/30 bg-neon-yellow/5 p-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <FastForward className="w-12 h-12 text-neon-yellow" />
            </div>
            
            <div className="flex justify-between items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-yellow" fill="currentColor" />
                <span className="text-xs font-black text-neon-yellow tracking-tighter uppercase">5-Second Speed Hack</span>
              </div>
              {xpAwarded !== null && xpAwarded > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-neon-cyan/20 border border-neon-cyan/50 rounded-full">
                  <Sparkles className="w-3 h-3 text-neon-cyan" />
                  <span className="text-[10px] font-black text-neon-cyan leading-none">+{xpAwarded} XP SYNCED</span>
                </div>
              )}
            </div>
            
            <p className="text-sm font-medium mb-3">{question.explanation || question.strategyTip}</p>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <div className="text-[8px] font-black uppercase text-neon-yellow mb-1 tracking-widest">Strategy Hack</div>
                <p className="text-[10px] text-gray-300 leading-snug">{question.strategyTip}</p>
              </div>
              {question.trickPattern && (
                <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="text-[8px] font-black uppercase text-neon-pink mb-1 tracking-widest">Trap Pattern</div>
                  <p className="text-[10px] text-gray-300 leading-snug">{question.trickPattern}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
