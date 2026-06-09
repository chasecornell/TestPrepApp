import { UserProfile, ProgressEntry, DailyGoalType, DAILY_GOAL_VALUES } from '../types';

export const XP_PER_QUESTION = 10;
export const XP_SPEED_BONUS = 5;
export const XP_STREAK_BONUS = 20;

export function calculateXPGain(isCorrect: boolean, timeSpentMs: number, currentStreak: number): number {
  if (!isCorrect) return 0;
  
  let xp = XP_PER_QUESTION;
  
  // Speed bonus (under 15 seconds)
  if (timeSpentMs < 15000) {
    xp += XP_SPEED_BONUS;
  }
  
  // Interval streak bonus
  if (currentStreak > 0 && currentStreak % 5 === 0) {
    xp += XP_STREAK_BONUS;
  }
  
  return xp;
}

export function getXPForNextLevel(level: number): number {
  return level * 100;
}

export function checkLevelUp(currentXP: number, currentLevel: number): { nextLevel: number, remainingXP: number, leveledUp: boolean } {
  const xpNeeded = getXPForNextLevel(currentLevel);
  if (currentXP >= xpNeeded) {
    return {
      nextLevel: currentLevel + 1,
      remainingXP: currentXP - xpNeeded,
      leveledUp: true
    };
  }
  return {
    nextLevel: currentLevel,
    remainingXP: currentXP,
    leveledUp: false
  };
}

export function updateStreak(lastActive: string, currentStreak: number, streakFreezeCount: number): { newStreak: number, newFreezeCount: number } {
  const lastDate = new Date(lastActive);
  const now = new Date();
  
  // Reset time part for comparison
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const diff = today - lastDay;
  
  if (diff <= oneDay) {
    // Active today or yesterday, streak is safe for now
    return { newStreak: currentStreak, newFreezeCount: streakFreezeCount };
  }
  
  // Missed at least one full day (e.g. last active was 2 days ago)
  const daysMissed = Math.floor(diff / oneDay) - 1;
  
  if (daysMissed <= streakFreezeCount) {
    // Streak freezes protect the streak
    return { newStreak: currentStreak, newFreezeCount: streakFreezeCount - daysMissed };
  } else {
    // Not enough freezes, streak resets
    // We set to 0, it will become 1 on the first activity of today
    return { newStreak: 0, newFreezeCount: streakFreezeCount };
  }
}

export function estimateScores(accuracy: number, totalQuestions: number): { sat: number, act: number } {
  // Very rough estimation for motivational purposes
  // Accuracy weight 70%, volume weight 30%
  const volumeFactor = Math.min(1, totalQuestions / 1000);
  const mastery = (accuracy * 0.7) + (volumeFactor * 0.3);
  
  const satReading = 200 + Math.round(mastery * 600);
  const satMath = 200 + Math.round(mastery * 600);
  const sat = satReading + satMath;
  
  // ACT Max 36, Base 1
  const act = 1 + Math.round(mastery * 35);
  
  return { sat, act };
}

export function checkStreakMilestones(streak: number, currentBadges: string[]): { newBadges: string[], xpReward: number } {
  const milestones = [
    { day: 3, id: 'streak_3', xp: 50 },
    { day: 7, id: 'streak_7', xp: 100 },
    { day: 14, id: 'streak_14', xp: 200 },
    { day: 30, id: 'streak_30', xp: 500 },
    { day: 60, id: 'streak_60', xp: 1000 },
    { day: 100, id: 'streak_100', xp: 2000 }
  ];
  
  const newBadges: string[] = [];
  let xpReward = 0;
  
  milestones.forEach(m => {
    if (streak >= m.day && !currentBadges.includes(m.id)) {
      newBadges.push(m.id);
      xpReward += m.xp;
    }
  });
  
  return { newBadges, xpReward };
}
