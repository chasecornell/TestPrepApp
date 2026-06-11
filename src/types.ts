export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  gender?: string;
  gpa?: number;
  preScores?: Record<string, number>;
  classesTaken?: string[];
  knowledgeState: Record<string, number>;
  streak: number;
  streakFreezeCount: number;
  xp: number;
  level: number;
  dailyGoal: 'LIGHT' | 'STANDARD' | 'SERIOUS' | 'INTENSIVE';
  dailyProgress: number; // Questions completed today
  badges: string[];
  mistakeBank: string[]; // Question IDs
  completedLessons: string[];
  totalQuestionsCompleted: number;
  lastActive: string;
}

export type DailyGoalType = 'LIGHT' | 'STANDARD' | 'SERIOUS' | 'INTENSIVE';

export const DAILY_GOAL_VALUES: Record<DailyGoalType, number> = {
  LIGHT: 5,
  STANDARD: 15,
  SERIOUS: 30,
  INTENSIVE: 60
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Lesson {
  id: string;
  title: string;
  concept: string;
  example: string;
  questionIds: string[];
  difficulty: 'Quick Win' | 'Skill Builder' | 'Challenge';
  path: 'Reading' | 'Writing' | 'Math';
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  conceptId: string;
  difficulty: number;
  explanation: string;
  strategyTip: string;
  trickPattern?: string;
  syntheticDisclosed: boolean;
  isRemediation?: boolean;
  remediationText?: string;
}

export interface ProgressEntry {
  id?: string;
  userId: string;
  questionId: string;
  timestamp: string;
  isCorrect: boolean;
  timeSpentMs: number;
  pointsEarned: number;
  isRetry?: boolean;
}
