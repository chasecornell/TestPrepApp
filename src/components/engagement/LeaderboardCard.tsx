import React from 'react';
import { Trophy } from 'lucide-react';

const TOP_PLAYERS = [
  { name: 'Velocity_Viper', level: 42, xp: 4250 },
  { name: 'Quantum_Ace', level: 38, xp: 3890 },
  { name: 'Logic_Lord', level: 35, xp: 3500 },
];

export default function LeaderboardCard() {
  return (
    <div className="card-glass border-neon-cyan/20 bg-neon-cyan/5 p-4 space-y-4">
      <div className="flex justify-between items-center text-neon-cyan">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Global Sync Rank</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {TOP_PLAYERS.map((player, i) => (
          <div key={player.name} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-all">
            <div className="flex items-center gap-3">
              <span className={`text-xs font-black italic ${i === 0 ? 'text-neon-yellow' : 'text-gray-500'}`}>0{i + 1}</span>
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {player.name.charAt(0)}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tight">{player.name}</div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest font-black">Level {player.level}</div>
              </div>
            </div>
            <div className="text-[10px] font-mono font-black text-neon-cyan">{player.xp} XP</div>
          </div>
        ))}
      </div>
      
      <button className="w-full py-2 bg-neon-cyan text-black font-black text-[10px] uppercase rounded-lg hover:brightness-110 transition-all">
        VIEW FULL BOARD
      </button>
    </div>
  );
}
