import React from 'react';
import { AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  mistakeCount: number;
  onOpen: () => void;
}

export default function MistakeBank({ mistakeCount, onOpen }: Props) {
  return (
    <div 
      onClick={onOpen}
      className={`card-glass border-neon-pink/20 bg-neon-pink/5 p-4 cursor-pointer hover:bg-neon-pink/10 transition-all ${
        mistakeCount === 0 ? 'opacity-50 grayscale' : ''
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-neon-pink/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-neon-pink" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-neon-pink">Mistake Bank</div>
            <div className="text-xl font-black">{mistakeCount} <span className="text-xs text-gray-500 font-medium">pending Review</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <RefreshCw className="w-4 h-4 text-neon-pink animate-spin-slow" />
           <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      
      {mistakeCount > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-gray-500 italic">"Mistakes are the portals of discovery." Review them to boost your score estimation.</p>
        </div>
      )}
    </div>
  );
}
