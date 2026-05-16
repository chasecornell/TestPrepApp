import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, handleFirestoreError } from './lib/firebase';
import { UserProfile, Question } from './types';
import PersonaOnboarding from './components/PersonaOnboarding';
import Dashboard from './components/Dashboard';
import QuestionView from './components/QuestionView';
import QuestionBank from './components/QuestionBank';
import MistakeBankView from './components/MistakeBankView';
import ProfileSettings from './components/ProfileSettings';
import MilestoneToast from './components/engagement/MilestoneToast';
import { updateKnowledgeState } from './services/bktService';
import { fetchExternalQuestions } from './services/questionService';
import { calculateXPGain, checkLevelUp, updateStreak, getXPForNextLevel, checkStreakMilestones } from './services/gamificationService';
import { Target, Zap, LogIn, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'LOADING' | 'AUTH' | 'ONBOARDING' | 'DASHBOARD' | 'SESSION' | 'LIBRARY' | 'MISTAKES' | 'PROFILE';

export default function App() {
  const [appState, setAppState] = useState<AppState>('LOADING');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showBadgeName, setShowBadgeName] = useState<string | null>(null);
  const [currentSessionQuestions, setCurrentSessionQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const rawData = docSnap.data();
          const fetchedProfile: UserProfile = {
            ...rawData,
            streak: rawData.streak || 0,
            streakFreezeCount: rawData.streakFreezeCount ?? 1,
            xp: rawData.xp || 0,
            level: rawData.level || 1,
            dailyGoal: rawData.dailyGoal || 'STANDARD',
            dailyProgress: rawData.dailyProgress || 0,
            badges: rawData.badges || [],
            mistakeBank: rawData.mistakeBank || [],
            completedLessons: rawData.completedLessons || [],
            totalQuestionsCompleted: rawData.totalQuestionsCompleted || 0,
          } as UserProfile;

          // Update streak on login
          let { newStreak, newFreezeCount } = updateStreak(fetchedProfile.lastActive, fetchedProfile.streak, fetchedProfile.streakFreezeCount);

          const milestoneCheck = checkStreakMilestones(newStreak, fetchedProfile.badges);
          if (milestoneCheck.newBadges.length > 0) {
            fetchedProfile.badges = [...fetchedProfile.badges, ...milestoneCheck.newBadges];
            fetchedProfile.xp += milestoneCheck.xpReward;
            setShowBadgeName(milestoneCheck.newBadges[milestoneCheck.newBadges.length - 1]);
          }

          if (newStreak !== rawData.streak || newFreezeCount !== rawData.streakFreezeCount || milestoneCheck.newBadges.length > 0) {
             await updateDoc(docRef, {
               streak: newStreak,
               streakFreezeCount: newFreezeCount,
               badges: fetchedProfile.badges,
               xp: fetchedProfile.xp
             });
             fetchedProfile.streak = newStreak;
             fetchedProfile.streakFreezeCount = newFreezeCount;
          }

          setProfile(fetchedProfile);
          setAppState('DASHBOARD');
        } else {
          setAppState('ONBOARDING');
        }
      } else {
        setAppState('AUTH');
      }
    });

    return unsub;
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardingComplete = async (partialProfile: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProfile: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: partialProfile.displayName || currentUser.displayName || 'V-Explorer',
      photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.uid}`,
      streak: 1,
      streakFreezeCount: 1,
      xp: 0,
      level: 1,
      dailyGoal: 'STANDARD',
      dailyProgress: 0,
      badges: [],
      mistakeBank: [],
      completedLessons: [],
      totalQuestionsCompleted: 0,
      lastActive: new Date().toISOString(),
      knowledgeState: partialProfile.knowledgeState || {},
      ...partialProfile
    };
    try {
      await setDoc(doc(db, 'users', currentUser.uid), newProfile);
      setProfile(newProfile);
      setAppState('DASHBOARD');
    } catch (error) {
      handleFirestoreError(error, 'create', `users/${currentUser.uid}`);
    }
  };

  // section: 'math' | 'reading' | 'english_grammar'
  const startSession = async (section: string = 'math') => {
    setAppState('LOADING');
    try {
      const qs = await fetchExternalQuestions(section, 20);
      if (qs.length === 0) throw new Error('No questions returned from API');
      setCurrentSessionQuestions(qs);
      setQuestionIndex(0);
      setAppState('SESSION');
    } catch (error) {
      console.error('Failed to start session:', error);
      setAppState('DASHBOARD');
    }
  };

  const handleAnswer = async (correct: boolean, timeSpentMs: number) => {
    if (!profile || !currentUser) return;

    const currentQ = currentSessionQuestions[questionIndex];
    if (!currentQ) return;

    // 1. Update BKT Knowledge State
    const currentProb = profile.knowledgeState[currentQ.conceptId] || 0.5;
    const nextProb = updateKnowledgeState(currentProb, correct);

    // 2. Update Gamification State
    const xpGained = calculateXPGain(correct, timeSpentMs, profile.streak);
    const { nextLevel, remainingXP, leveledUp } = checkLevelUp(profile.xp + xpGained, profile.level);

    // Check if we should increment streak (first activity of a new day)
    const lastActiveDate = new Date(profile.lastActive);
    const today = new Date();
    const isNewDay = lastActiveDate.getDate() !== today.getDate() ||
                      lastActiveDate.getMonth() !== today.getMonth() ||
                      lastActiveDate.getFullYear() !== today.getFullYear();

    const newStreak = isNewDay ? profile.streak + 1 : profile.streak;
    const newDailyProgress = isNewDay ? 1 : profile.dailyProgress + 1;

    const milestoneCheck = checkStreakMilestones(newStreak, profile.badges);
    if (milestoneCheck.newBadges.length > 0) {
      setShowBadgeName(milestoneCheck.newBadges[milestoneCheck.newBadges.length - 1]);
    }

    const updatedBadges = milestoneCheck.newBadges.length > 0
      ? [...profile.badges, ...milestoneCheck.newBadges]
      : profile.badges;
    const xpWithMilestone = remainingXP + milestoneCheck.xpReward;

    const updatedMistakeBank = !correct && !profile.mistakeBank.includes(currentQ.id)
      ? [...profile.mistakeBank, currentQ.id]
      : profile.mistakeBank;

    const updatedProfile: UserProfile = {
      ...profile,
      streak: newStreak,
      xp: xpWithMilestone,
      level: nextLevel,
      badges: updatedBadges,
      dailyProgress: newDailyProgress,
      totalQuestionsCompleted: profile.totalQuestionsCompleted + 1,
      mistakeBank: updatedMistakeBank,
      knowledgeState: {
        ...profile.knowledgeState,
        [currentQ.conceptId]: nextProb
      },
      lastActive: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        streak: updatedProfile.streak,
        xp: updatedProfile.xp,
        level: updatedProfile.level,
        badges: updatedProfile.badges,
        dailyProgress: updatedProfile.dailyProgress,
        totalQuestionsCompleted: updatedProfile.totalQuestionsCompleted,
        mistakeBank: updatedProfile.mistakeBank,
        [`knowledgeState.${currentQ.conceptId}`]: nextProb,
        lastActive: updatedProfile.lastActive
      });
      setProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${currentUser.uid}`);
    }

    // Move to next question or dashboard
    setTimeout(() => {
      if (questionIndex < currentSessionQuestions.length - 1) {
        setQuestionIndex(i => i + 1);
      } else {
        setAppState('DASHBOARD');
      }
    }, 2000);
  };

  const handleMistakeResolved = async (questionId: string) => {
    if (!profile || !currentUser) return;

    const updatedBank = profile.mistakeBank.filter(id => id !== questionId);
    const updatedProfile = {
      ...profile,
      mistakeBank: updatedBank,
      xp: profile.xp + 15 // Bonus XP for correcting mistakes
    };

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        mistakeBank: updatedBank,
        xp: updatedProfile.xp
      });
      setProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${currentUser.uid}`);
    }
  };

  if (appState === 'LOADING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 selection:bg-neon-cyan selection:text-black">
      {/* Mini Header */}
      {appState !== 'AUTH' && (
        <header className="p-4 md:p-6 flex justify-between items-center border-b border-white/5 bg-dark-bg/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neon-cyan flex items-center justify-center rounded-lg shadow-neon-cyan/50 shadow-lg">
              <Zap className="w-5 h-5 text-black" fill="currentColor" />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter uppercase italic">VELOCITY<span className="text-neon-cyan">PREP</span></span>
          </div>
          {profile && (
            <button 
              onClick={() => setAppState('PROFILE')}
              className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-black leading-none mb-1">LVL {profile.level}</div>
                <div className="text-sm font-bold text-neon-cyan">{profile.xp} XP</div>
              </div>
              <img src={profile.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.uid}`} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/10 p-1 border border-white/10 object-cover" alt="avatar" />
            </button>
          )}
        </header>
      )}

      <main className="px-4 py-8">
        <AnimatePresence mode="wait">
          {appState === 'AUTH' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md mx-auto mt-20 text-center space-y-8 p-8"
            >
              <div className="w-32 h-32 bg-neon-cyan mx-auto rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(0,243,255,0.3)]">
                <Target className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-black tracking-tight leading-none uppercase">DON'T STUDY<br/><span className="text-neon-cyan">HARDER</span></h1>
                <p className="text-gray-400 font-medium">TikTok-style Micro-Learning. Predictive Modeling. Instant Gratification.</p>
              </div>
              <button
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-black rounded-2xl hover:bg-neon-cyan hover:scale-[1.02] transition-all"
              >
                <LogIn className="w-5 h-5" /> SYNC WITH GOOGLE
              </button>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">A Speedtrainer for SAT/ACT dominance</div>
            </motion.div>
          )}

          {appState === 'ONBOARDING' && currentUser && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PersonaOnboarding 
                user={{ displayName: currentUser.displayName, photoURL: currentUser.photoURL }} 
                onComplete={handleOnboardingComplete} 
              />
            </motion.div>
          )}

          {appState === 'DASHBOARD' && profile && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard
                user={profile}
                onStartSession={startSession}
                onOpenLibrary={() => setAppState('LIBRARY')}
                onOpenMistakes={() => setAppState('MISTAKES')}
                onOpenProfile={() => setAppState('PROFILE')}
              />
            </motion.div>
          )}

          {appState === 'MISTAKES' && profile && (
            <motion.div key="mistakes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MistakeBankView
                questionIds={profile.mistakeBank}
                onExit={() => setAppState('DASHBOARD')}
                onCorrect={handleMistakeResolved}
              />
            </motion.div>
          )}

          {appState === 'LIBRARY' && (
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuestionBank onExit={() => setAppState('DASHBOARD')} />
            </motion.div>
          )}

          {appState === 'PROFILE' && profile && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileSettings 
                user={profile} 
                onUpdate={(upd) => {
                  setProfile(prev => prev ? { ...prev, ...upd } : null);
                  setAppState('DASHBOARD');
                }}
                onExit={() => setAppState('DASHBOARD')}
              />
            </motion.div>
          )}

          {appState === 'SESSION' && currentSessionQuestions[questionIndex] && (
            <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <QuestionView
                question={currentSessionQuestions[questionIndex]}
                onAnswer={handleAnswer}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showBadgeName && (
            <MilestoneToast
              badgeName={showBadgeName.replace('streak_', '').replace('_', ' ') + ' Day Streak'}
              onClose={() => setShowBadgeName(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
