import React from 'react';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, Play } from 'lucide-react';

interface Node {
  id: string;
  title: string;
  status: 'locked' | 'current' | 'completed';
}

interface Props {
  nodes: Node[];
  title: string;
  accentColor: string;
}

export default function LearningPath({ nodes, title, accentColor }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className={`w-1 h-4 ${accentColor} rounded-full`} />
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-100">{title} PATH</h3>
      </div>

      <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar">
        {nodes.map((node, i) => {
          const isLocked = node.status === 'locked';
          const isCompleted = node.status === 'completed';
          const isCurrent = node.status === 'current';

          return (
            <div key={node.id} className="relative flex flex-col items-center min-w-[100px] group">
              {/* Connector line */}
              {i < nodes.length - 1 && (
                <div className={`absolute top-8 left-[50px] w-full h-0.5 ${isCompleted ? accentColor : 'bg-white/5'}`} />
              )}

              <motion.button
                whileHover={!isLocked ? { scale: 1.1 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                className={`w-16 h-16 rounded-3xl border-2 flex items-center justify-center relative z-10 transition-all ${
                  isCompleted ? `${accentColor} border-current bg-current/10` :
                  isCurrent ? `${accentColor} border-current shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)] animate-pulse` :
                  'border-white/5 bg-white/5 opacity-50'
                }`}
              >
                {isLocked ? <Lock className="w-5 h-5 text-gray-600" /> :
                 isCompleted ? <CheckCircle2 className={`w-6 h-6 ${accentColor.replace('bg-', 'text-')}`} /> :
                 <Play className={`w-6 h-6 fill-current ${accentColor.replace('bg-', 'text-')}`} />}
              </motion.button>

              <div className="mt-3 text-center">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  {node.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
