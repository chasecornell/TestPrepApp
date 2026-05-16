import React from 'react';
import { Award } from 'lucide-react';
import { Badge } from '../../types';

interface Props {
  unlockedBadges: string[]; // List of badge IDs
}

const ALL_BADGES: Record<string, Badge> = {
  'first_lesson': { id: 'first_lesson', name: 'First Node', description: 'Complete your first practice session.', icon: 'Zap' },
  'streak_3': { id: 'streak_3', name: 'Tri-Day Initiate', description: 'Maintain a 3-day streak.', icon: 'Flame' },
  'streak_7': { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak.', icon: 'Flame' },
  'streak_14': { id: 'streak_14', name: 'Fortnight Force', description: 'Maintain a 14-day streak.', icon: 'Flame' },
  'streak_30': { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak.', icon: 'Flame' },
  'streak_60': { id: 'streak_60', name: 'Double Moon', description: 'Maintain a 60-day streak.', icon: 'Flame' },
  'streak_100': { id: 'streak_100', name: 'Century Club', description: 'Maintain a 100-day streak.', icon: 'Flame' },
  'grammar_grinder': { id: 'grammar_grinder', name: 'Grammar Grinder', description: 'Master 10 Writing concepts.', icon: 'Book' },
  'mistake_master': { id: 'mistake_master', name: 'Logic Fixer', description: 'Review 25 missed questions.', icon: 'Target' },
};

export default function BadgeShelf({ unlockedBadges }: Props) {
  return (
    <div className="card-glass border-white/5 p-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
        <Award className="w-3 h-3" /> Achievement Badges
      </h3>
      <div className="flex flex-wrap gap-3">
        {Object.values(ALL_BADGES).map(badge => {
          const isLocked = !unlockedBadges.includes(badge.id);
          return (
            <div 
              key={badge.id}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all group relative ${
                isLocked ? 'border-white/5 opacity-20 grayscale' : 'border-neon-cyan/50 bg-neon-cyan/10'
              }`}
            >
              <div className="text-white text-xs">
                {/* Placeholder icon representation */}
                {badge.name.charAt(0)}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-black border border-white/10 rounded-lg hidden group-hover:block z-50 min-w-[120px]">
                <div className="text-[10px] font-black uppercase text-neon-cyan">{badge.name}</div>
                <div className="text-[8px] text-gray-400">{badge.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
