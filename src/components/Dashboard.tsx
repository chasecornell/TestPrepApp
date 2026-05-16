import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Target, Trophy, TrendingUp, ChevronRight, BookOpen, Brain, Sparkles, Calculator, BookMarked, PenLine } from 'lucide-react';
import XPProgressBar from './engagement/XPProgressBar';
import StreakFlame from './engagement/StreakFlame';
import DailyGoalCard from './engagement/DailyGoalCard';
import BadgeShelf from './engagement/BadgeShelf';
import LearningPath from './engagement/LearningPath';
import MistakeBank from './engagement/MistakeBank';
import StreakMilestonesCard from './engagement/StreakMilestonesCard';
import WeeklyProgressChart from './engagement/WeeklyProgressChart';
import LeaderboardCard from './engagement/LeaderboardCard';
import { getXPForNextLevel, estimateSATScore } from '../services/gamificationService';

interface Props {
  user: UserProfile;
  onStartSession: (section: string) => void;
  onOpenLibrary: () => void;
  onOpenMistakes: () => void;
  onOpenProfile: () => void;
}

const SECTIONS = [
  {
    id: 'math',
    label: 'MATH',
    sub: 'Algebra · Geometry · Data',
    icon: Calculator,
    gradient: 'from-neon-cyan to-blue-600',
    iconColor: 'text-black',
    badge: 'Neural Load Ready',
  },
  {
    id: 'reading',
    label: 'READING',
    sub: 'Passages · Inference · Evidence',
    icon: BookMarked,
    gradient: 'from-neon-pink to-purple-700',
    iconColor: 'text-black',
    badge: 'Comprehension Mode',
  },
  {
    id: 'english_grammar',
    label: 'GRAMMAR',
    sub: 'Punctuation · Structure · Style',
    icon: PenLine,
    gradient: 'from-neon-yellow to-orange-500',
    iconColor: 'text-black',
    badge: 'Language Core',
  },
];

export default function Dashboard({ user, onStartSession, onOpenLibrary, onOpenMistakes, onOpenProfile }: Props) {
  const [activeSection, setActiveSection] = useState<string>('math');

  const concepts = Object.entries(user.knowledgeState).map(([id, prob]) => ({
    id,
    prob,
    label: id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ')
  }));

  const estimatedScore = estimateSATScore(
    concepts.reduce((acc, c) => acc + c.prob, 0) / (concepts.length || 1),
    user.totalQuestionsCompleted
  );

  const selected = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
  const Icon = selected.icon;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Top Bar: Streak and Score Motivation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <StreakFlame streak={user.streak} freezes={user.streakFreezeCount} />

        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-6 bg-white/5 p-4 rounded-3xl border border-white/5 w-full md:w-auto overflow-hidden relative group cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
             <Sparkles className="w-12 h-12 text-neon-yellow" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estimated SAT Score</div>
            <div className="text-3xl font-black text-neon-yellow tracking-tighter">
              {estimatedScore.total}
            </div>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex gap-4">
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-500">R&W</div>
              <div className="font-bold text-sm text-white">{estimatedScore.reading}</div>
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-gray-500">Math</div>
              <div className="font-bold text-sm text-white">{estimatedScore.math}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Progress & Paths */}
        <div className="lg:col-span-2 space-y-8">
          <XPProgressBar
            currentXP={user.xp}
            level={user.level}
            xpNeeded={getXPForNextLevel(user.level)}
          />

          {/* Section Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SECTIONS.map(s => {
              const SIcon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <motion.button
                  key={s.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveSection(s.id)}
                  className={`relative rounded-2xl p-4 flex sm:flex-col items-center sm:items-start text-left border transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-br ${s.gradient} border-transparent`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <SIcon className={`w-5 h-5 sm:mb-2 mr-3 sm:mr-0 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-black' : 'text-white'}`}>
                      {s.label}
                    </div>
                    <div className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-black/70' : 'text-gray-500'}`}>
                      {s.sub}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Launch Card */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onStartSession(activeSection)}
            className={`group cursor-pointer relative min-h-[224px] sm:h-56 rounded-3xl overflow-hidden bg-gradient-to-br ${selected.gradient} p-6 sm:p-8 flex flex-col justify-end`}
          >
            <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-105 transition-transform duration-500">
              <Icon className="w-32 h-32 sm:w-48 sm:h-48" />
            </div>
            <div className="relative z-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-white">{selected.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-black leading-tight mb-1 uppercase">
                START {selected.label}
              </h2>
              <p className="text-black/70 font-bold text-xs sm:text-sm">
                20 adaptive questions · tap to begin
              </p>
            </div>
          </motion.div>

          <div className="space-y-8 pt-4">
            <LearningPath
              title="MATH"
              accentColor="bg-neon-cyan"
              nodes={[
                { id: 'alg1', title: 'Linear Eq', status: 'completed' },
                { id: 'alg2', title: 'Functions', status: 'current' },
                { id: 'alg3', title: 'Quadratics', status: 'locked' },
                { id: 'geom1', title: 'Geometry', status: 'locked' },
              ]}
            />

            <LearningPath
              title="READING & WRITING"
              accentColor="bg-neon-pink"
              nodes={[
                { id: 'rw1', title: 'Punctuation', status: 'completed' },
                { id: 'rw2', title: 'Evidence', status: 'current' },
                { id: 'rw3', title: 'Transitions', status: 'locked' },
              ]}
            />
          </div>
        </div>

        {/* Right Column: Gauges & Rewards */}
        <div className="space-y-6">
           <DailyGoalCard goal={user.dailyGoal} progress={user.dailyProgress} />

           <WeeklyProgressChart />

           <StreakMilestonesCard streak={user.streak} />

           <MistakeBank
             mistakeCount={user.mistakeBank.length}
             onOpen={onOpenMistakes}
           />

           <BadgeShelf unlockedBadges={user.badges} />

           <LeaderboardCard />

           <div className="card-glass border-white/5 space-y-4">
              <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Mirror Bank Status
              </h3>
              <p className="text-[10px] text-gray-400 italic">5,000+ cloned questions mapping 1:1 to official SAT/ACT standards.</p>
              <button
                onClick={onOpenLibrary}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5 transition-all"
              >
                Open Library
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
