import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, handleFirestoreError, createUserWithEmailAndPassword, signInWithEmailAndPassword } from './lib/firebase';
import { UserProfile, Question } from './types';
import PersonaOnboarding from './components/PersonaOnboarding';
import Dashboard from './components/Dashboard';
import QuestionView from './components/QuestionView';
import SessionCompleteView from './components/SessionCompleteView';
import QuestionBank from './components/QuestionBank';
import MistakeBankView from './components/MistakeBankView';
import ProfileSettings from './components/ProfileSettings';
import MilestoneToast from './components/engagement/MilestoneToast';
import { updateKnowledgeState } from './services/bktService';
import { fetchExternalQuestions } from './services/questionService';
import { calculateXPGain, checkLevelUp, updateStreak, getXPForNextLevel, checkStreakMilestones } from './services/gamificationService';
import { Target, Zap, LogIn, Library, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'LOADING' | 'AUTH' | 'ONBOARDING' | 'DASHBOARD' | 'SESSION' | 'SESSION_COMPLETE' | 'LIBRARY' | 'MISTAKES' | 'PROFILE';

export default function App() {
  const [appState, setAppState] = useState<AppState>('LOADING');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showBadgeName, setShowBadgeName] = useState<string | null>(null);
  const [currentSessionQuestions, setCurrentSessionQuestions] = useState<Question[]>([]);
  const [sessionQuestionPool, setSessionQuestionPool] = useState<Question[]>([]);
  const [sessionConsecutiveCorrect, setSessionConsecutiveCorrect] = useState(0);
  const [sessionConsecutiveIncorrect, setSessionConsecutiveIncorrect] = useState(0);
  const [sessionTargetDifficulty, setSessionTargetDifficulty] = useState(2);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionTotalTimeMs, setSessionTotalTimeMs] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      console.log("Auth event fired. User UID:", user?.uid);
      setCurrentUser(user);
      
      if (!user) {
        setProfile(null);
        setAppState('AUTH');
        console.log("No user session found. Routing to AUTH.");
        return;
      }

      try {
        console.log("User session found. Fetching profile for:", user.uid);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const rawData = docSnap.data();
          console.log("Profile data found for:", rawData.displayName);
          
          const fetchedProfile: UserProfile = {
            uid: user.uid,
            email: user.email || rawData.email || '',
            displayName: rawData.displayName || user.displayName || 'V-Explorer',
            photoURL: rawData.photoURL || user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
            lastActive: rawData.lastActive || new Date().toISOString(),
            knowledgeState: rawData.knowledgeState || {},
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
            ...rawData
          };

          // Ensure critical fields are not overwritten with nulls from rawData
          fetchedProfile.knowledgeState = fetchedProfile.knowledgeState || {};
          fetchedProfile.badges = fetchedProfile.badges || [];
          fetchedProfile.mistakeBank = fetchedProfile.mistakeBank || [];

          // Update streak on login
          let { newStreak, newFreezeCount } = updateStreak(fetchedProfile.lastActive, fetchedProfile.streak, fetchedProfile.streakFreezeCount);

          const milestoneCheck = checkStreakMilestones(newStreak, fetchedProfile.badges);
          if (milestoneCheck.newBadges.length > 0) {
            fetchedProfile.badges = [...fetchedProfile.badges, ...milestoneCheck.newBadges];
            fetchedProfile.xp += milestoneCheck.xpReward;
            setShowBadgeName(milestoneCheck.newBadges[milestoneCheck.newBadges.length - 1]);
          }

          if (newStreak !== rawData.streak || newFreezeCount !== rawData.streakFreezeCount || milestoneCheck.newBadges.length > 0) {
            try {
              await updateDoc(docRef, {
                streak: newStreak,
                streakFreezeCount: newFreezeCount,
                badges: fetchedProfile.badges,
                xp: fetchedProfile.xp,
                lastActive: new Date().toISOString()
              });
            } catch (e) {
              console.error("Sync error on login:", e);
            }
            fetchedProfile.streak = newStreak;
            fetchedProfile.streakFreezeCount = newFreezeCount;
          }

          setProfile(fetchedProfile);
          setAppState('DASHBOARD');
          console.log("Application routed to DASHBOARD.");
        } else {
          setAppState('ONBOARDING');
          console.log("No profile found. Routing to ONBOARDING.");
        }
      } catch (error: any) {
        console.error("Critical Auth Error:", error);
        setAppState('AUTH');
        setAuthError(`System Error during init: ${error.message || 'Unknown failure'}`);
      }
    }, (error) => {
      console.error("onAuthStateChanged observer error:", error);
      setAppState('AUTH');
      setAuthError("Auth Connection Failed. Please reload.");
    });

    return unsub;
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setAuthError(e.message || "Google Authentication Failed");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      setAuthError(e.message || "Authentication Failed");
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

  // section: 'math' | 'reading' | 'english_grammar' | 'science'
  const startSession = async (section: string = 'math') => {
    setAppState('LOADING');
    try {
      // Fetch a larger pool of questions for adaptive selection
      const pool = await fetchExternalQuestions(section, 50);
      if (pool.length === 0) throw new Error('No questions returned from API');
      
      setSessionQuestionPool(pool);
      const initialDiff = 2; // Start with a medium difficulty
      
      // Select the first question based on difficulty match and lowest BKT mastery
      const sortedPool = [...pool].sort((a, b) => {
        const diffMatchA = Math.abs((a.difficulty || 1) - initialDiff);
        const diffMatchB = Math.abs((b.difficulty || 1) - initialDiff);
        const probA = profile?.knowledgeState[a.conceptId] || 0.5;
        const probB = profile?.knowledgeState[b.conceptId] || 0.5;
        if (diffMatchA !== diffMatchB) return diffMatchA - diffMatchB;
        return probA - probB;
      });
      
      const firstQ = sortedPool[0];

      setCurrentSessionQuestions([firstQ]);
      setQuestionIndex(0);
      setSessionTotalTimeMs(0);
      setSessionStartTime(Date.now());
      setSessionConsecutiveCorrect(0);
      setSessionConsecutiveIncorrect(0);
      setSessionTargetDifficulty(initialDiff);
      setAppState('SESSION');
    } catch (error) {
      console.error('Failed to start session:', error);
      setAppState('DASHBOARD');
    }
  };

  const handleAnswer = async (correct: boolean, timeSpentMs: number) => {
    if (!profile || !currentUser) return;

    setSessionTotalTimeMs(prev => prev + timeSpentMs);

    const currentQ = currentSessionQuestions[questionIndex];
    if (!currentQ) return;

    // 1. Update BKT Knowledge State
    const currentProb = profile.knowledgeState[currentQ.conceptId] || 0.5;
    const nextProb = updateKnowledgeState(currentProb, correct);

    // Track consecutive correct/incorrect for adaptive difficulty
    let newConsecutiveCorrect = correct ? sessionConsecutiveCorrect + 1 : 0;
    let newConsecutiveIncorrect = correct ? 0 : sessionConsecutiveIncorrect + 1;
    let newTargetDifficulty = sessionTargetDifficulty;

    if (newConsecutiveCorrect >= 2) {
      newTargetDifficulty = Math.min(3, newTargetDifficulty + 1);
      newConsecutiveCorrect = 0; // Reset after leveling up difficulty
    } else if (newConsecutiveIncorrect >= 1) {
      newTargetDifficulty = Math.max(1, newTargetDifficulty - 1);
      newConsecutiveIncorrect = 0; // Reset after dropping difficulty
    }

    setSessionConsecutiveCorrect(newConsecutiveCorrect);
    setSessionConsecutiveIncorrect(newConsecutiveIncorrect);
    setSessionTargetDifficulty(newTargetDifficulty);

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
  };

  const handleNextQuestion = () => {
    // We want 5 questions total per session, but cap it at the available pool size
    if (questionIndex < Math.min(4, sessionQuestionPool.length - 1)) {
      const usedIds = new Set(currentSessionQuestions.map(q => q.id));
      const available = sessionQuestionPool.filter(q => !usedIds.has(q.id));
      
      const sortedAvailable = available.sort((a, b) => {
        const diffMatchA = Math.abs((a.difficulty || 1) - sessionTargetDifficulty);
        const diffMatchB = Math.abs((b.difficulty || 1) - sessionTargetDifficulty);
        
        const probA = profile?.knowledgeState[a.conceptId] || 0.5;
        const probB = profile?.knowledgeState[b.conceptId] || 0.5;
        
        // Prioritize matching the target difficulty, then pick the lowest mastery concept
        if (diffMatchA !== diffMatchB) {
          return diffMatchA - diffMatchB;
        }
        return probA - probB;
      });
      
      const nextQ = sortedAvailable[0] || sessionQuestionPool.find(q => !usedIds.has(q.id));
      
      if (nextQ) {
        setCurrentSessionQuestions(prev => [...prev, nextQ]);
        setQuestionIndex(i => i + 1);
      } else {
        setAppState('SESSION_COMPLETE');
      }
    } else {
      setAppState('SESSION_COMPLETE');
    }
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

  // Handle loading state with a timeout fallback
  useEffect(() => {
    if (appState === 'LOADING') {
      const timer = setTimeout(() => {
        // If still loading after 8s, something is hung. Check auth manually.
        if (auth.currentUser) {
           console.log("Loading timeout reached but user exists. Manual trigger.");
           // Force a state check if we're stuck
           if (!profile) setAppState('ONBOARDING');
           else setAppState('DASHBOARD');
        } else {
           setAppState('AUTH');
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [appState, profile]);

  console.log("[Render Trace] State:", appState, "| User:", !!currentUser, "| Profile:", !!profile);

  if (appState === 'LOADING') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0c] text-[#00f3ff] gap-6 p-10">
        <div className="w-16 h-16 border-4 border-[#00f3ff] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,243,255,0.5)]" />
        <div className="flex flex-col items-center gap-2">
          <div className="text-sm font-black uppercase tracking-[0.3em] animate-pulse">Initializing Neural Link</div>
          <div className="text-[10px] text-gray-600 font-mono">STATE: {appState} | AUTH: {auth.currentUser ? 'DETECTED' : 'PENDING'}</div>
        </div>
        <button 
          onClick={() => setAppState('AUTH')}
          className="mt-8 text-[10px] text-gray-500 underline uppercase tracking-widest hover:text-white"
        >
          Force Bypass to Login
        </button>
      </div>
    );
  }

  // Safety fallback for blank screen: if appState matches nothing, show diagnostic
  const renderContent = () => {
    console.log("[renderContent] Executing for state:", appState);
    switch (appState) {
      case 'AUTH':
        return (
          <div key="auth" className="max-w-md mx-auto mt-10 text-center space-y-8 p-8">
            <div className="w-24 h-24 bg-neon-cyan mx-auto rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(0,243,255,0.3)]">
              <Target className="w-12 h-12 text-black" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight leading-none uppercase">
                {isSignUp ? 'CREATE ACCOUNT' : 'SYSTEM LOGIN'}
              </h1>
              <p className="text-gray-400 font-medium text-sm">
                TikTok-style Micro-Learning for SAT/ACT dominance.
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Node</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="explorer@velocity.prep"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Access Protocol (Password)</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-neon-cyan focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
              
              {authError && (
                <div className="text-xs font-bold text-neon-pink bg-neon-pink/10 p-3 rounded-lg border border-neon-pink/20">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-neon-cyan text-black font-black rounded-2xl hover:bg-white hover:scale-[1.02] transition-all uppercase tracking-widest"
              >
                {isSignUp ? 'INITIALIZE PROFILE' : 'AUTHENTICATE'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-dark-bg px-2 text-gray-600">OR SYNC VIA</span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 hover:scale-[1.02] transition-all"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="google" /> GOOGLE SSO
            </button>

            <div className="pt-4">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-bold text-gray-500 hover:text-neon-cyan transition-colors uppercase tracking-widest"
              >
                {isSignUp ? 'Already authenticated? LOG IN' : 'New explorer? CREATE ACCOUNT'}
              </button>
            </div>

            <div className="text-[10px] text-gray-700 uppercase tracking-widest">A Speedtrainer for SAT/ACT dominance</div>
          </div>
        );
      case 'ONBOARDING':
        if (!currentUser) {
          return (
            <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
               <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
               <div className="text-[10px] uppercase font-black tracking-widest text-gray-500">Securing Authentication State...</div>
            </div>
          );
        }
        return (
          <div key="onboarding">
            <PersonaOnboarding 
              user={{ displayName: currentUser.displayName, photoURL: currentUser.photoURL }} 
              onComplete={handleOnboardingComplete} 
            />
          </div>
        );
      case 'DASHBOARD':
        if (!profile) {
          return (
             <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
                <div className="text-[10px] uppercase font-black tracking-widest text-gray-500">Syncing Profile Data...</div>
             </div>
          );
        }
        return (
          <div key="dashboard">
            <Dashboard
              user={profile}
              onStartSession={startSession}
              onOpenLibrary={() => setAppState('LIBRARY')}
              onOpenMistakes={() => setAppState('MISTAKES')}
              onOpenProfile={() => setAppState('PROFILE')}
            />
          </div>
        );
      case 'MISTAKES':
        if (!profile) return null;
        return (
          <motion.div key="mistakes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MistakeBankView
              questionIds={profile.mistakeBank}
              onExit={() => setAppState('DASHBOARD')}
              onCorrect={handleMistakeResolved}
            />
          </motion.div>
        );
      case 'LIBRARY':
        return (
          <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuestionBank onExit={() => setAppState('DASHBOARD')} />
          </motion.div>
        );
      case 'PROFILE':
        if (!profile) return null;
        return (
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
        );
      case 'SESSION':
        const currentQ = currentSessionQuestions[questionIndex];
        if (!currentQ) return null;
        return (
          <motion.div key="session" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <QuestionView
              key={currentQ.id}
              question={currentQ}
              sessionStartTime={sessionStartTime}
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
            />
          </motion.div>
        );
      case 'SESSION_COMPLETE':
        return (
          <motion.div key="session_complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SessionCompleteView
              totalTimeMs={sessionTotalTimeMs}
              questionCount={currentSessionQuestions.length}
              onExit={() => setAppState('DASHBOARD')}
            />
          </motion.div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
             <AlertTriangle className="w-12 h-12 text-neon-pink" />
             <div className="font-black text-xl uppercase italic">Quantum Desync Detected</div>
             <p className="text-gray-500 text-sm max-w-xs">The application reached an undefined state or lost its neural connection.</p>
             <button 
               onClick={() => window.location.reload()}
               className="btn-primary bg-neon-pink shadow-neon-pink/30"
             >
               Force Reload
             </button>
          </div>
        );
    }
  };

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
        {renderContent()}

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
