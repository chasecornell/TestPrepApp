import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { initializePersona } from '../services/bktService';

interface Props {
  user: { displayName: string | null; photoURL: string | null };
  onComplete: (profile: Partial<UserProfile>) => void;
}

export default function PersonaOnboarding({ user, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<UserProfile>>({
    displayName: user.displayName || 'V-Explorer',
    gender: '',
    gpa: 3.5,
    preScores: { SAT_MATH: 500 },
    classesTaken: []
  });

  const next = () => setStep(s => s + 1);

  const finish = () => {
    const initialState = initializePersona(data.gpa || 3.5, data.preScores || {}, data.classesTaken || []);
    onComplete({ ...data, dailyGoal: data.dailyGoal || 'STANDARD', knowledgeState: initialState });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-8 sm:py-0">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card-glass neon-border p-6"
      >
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black neon-text-glow uppercase tracking-tighter text-center">Velocity Sync</h2>
            
            <div className="flex flex-col items-center justify-center space-y-3">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.displayName}`} className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 p-1" alt="avatar" />
               <div className="text-center">
                 <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Identified Signature</div>
                 <input 
                   type="text"
                   value={data.displayName}
                   onChange={(e) => setData({...data, displayName: e.target.value})}
                   className="text-center bg-transparent border-b border-neon-cyan/30 focus:border-neon-cyan outline-none font-bold text-lg uppercase tracking-tight w-full max-w-[200px]"
                 />
               </div>
            </div>

            <p className="text-gray-400 text-center text-sm px-4">Map your neural core to calibrate the AI Strategy Engine.</p>
            
            <div className="space-y-4">
              <label className="block text-[10px] uppercase tracking-widest text-neon-cyan font-black">Velocity Target (Daily Goal)</label>
              <div className="grid gap-2">
                {[
                  { id: 'LIGHT', label: 'Light', q: 5 },
                  { id: 'STANDARD', label: 'Standard', q: 15 },
                  { id: 'SERIOUS', label: 'Serious', q: 30 },
                  { id: 'INTENSIVE', label: 'Intensive', q: 60 },
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setData({...data, dailyGoal: g.id as any})}
                    className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all ${
                      data.dailyGoal === g.id ? 'border-neon-cyan bg-neon-cyan/10 text-white' : 'border-white/5 text-gray-500 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold uppercase tracking-widest text-xs">{g.label}</span>
                    <span className="text-[10px] font-mono">{g.q} Qs/day</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={next} className="w-full btn-primary">INITIALIZE PROFILE</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-neon-pink">ACADEMIC METRICS</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">GPA (Unweighted)</label>
                <input 
                  type="number" step="0.1" 
                  value={data.gpa}
                  onChange={e => setData({...data, gpa: parseFloat(e.target.value)})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-neon-pink" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Previous SAT Math Score</label>
                <input 
                  type="number"
                  value={data.preScores?.SAT_MATH}
                  onChange={e => setData({...data, preScores: { SAT_MATH: parseInt(e.target.value) }})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-neon-pink" 
                />
              </div>
            </div>
            <button onClick={next} className="w-full btn-primary bg-neon-pink shadow-neon-pink/30">CALIBRATE BASESTATE</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-neon-yellow">CLASS RADIUS</h2>
            <p className="text-sm text-gray-400">Select advanced cursors you have already navigated.</p>
            <div className="grid grid-cols-2 gap-2">
              {['AP Calculus', 'AP Physics', 'Honors Algebra', 'Pre-Calc', 'AP Stats', 'Geometry'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    const classes = data.classesTaken?.includes(c) 
                      ? data.classesTaken.filter(i => i !== c)
                      : [...(data.classesTaken || []), c];
                    setData({...data, classesTaken: classes});
                  }}
                  className={`p-3 text-xs rounded-lg border transition-all ${data.classesTaken?.includes(c) ? 'border-neon-yellow bg-neon-yellow/10 text-neon-yellow' : 'border-white/10 text-gray-500'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={finish} className="w-full btn-primary bg-neon-yellow shadow-neon-yellow/30 text-black">ENTER VELOCITY PREP</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
