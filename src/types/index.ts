// ─── Habit System ───────────────────────────────────────────

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type Priority = 'low' | 'medium' | 'high';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  targetDays?: number[];
  category: string;
  priority: Priority;
  archived: boolean;
  sortOrder: number;
  reminderTime?: string;
  createdAt: Date;
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  note?: string;
}

// ─── Daily Tasks ────────────────────────────────────────────

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
  date: string; // "YYYY-MM-DD"
  sortOrder: number;
}

// ─── Categories ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export const PRESET_CATEGORIES: Category[] = [
  { id: 'general', name: 'General', icon: '📌', color: '#8b5cf6' },
  { id: 'study', name: 'Study', icon: '📚', color: '#3b82f6' },
  { id: 'fitness', name: 'Fitness', icon: '💪', color: '#ef4444' },
  { id: 'health', name: 'Health', icon: '❤️', color: '#f43f5e' },
  { id: 'coding', name: 'Coding', icon: '💻', color: '#06b6d4' },
  { id: 'meditation', name: 'Meditation', icon: '🧘', color: '#8b5cf6' },
  { id: 'reading', name: 'Reading', icon: '📖', color: '#a855f7' },
  { id: 'productivity', name: 'Productivity', icon: '⚡', color: '#f59e0b' },
  { id: 'career', name: 'Career', icon: '💼', color: '#0ea5e9' },
  { id: 'sleep', name: 'Sleep', icon: '😴', color: '#6366f1' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#22c55e' },
  { id: 'learning', name: 'Learning', icon: '🎓', color: '#14b8a6' },
  { id: 'personal-growth', name: 'Personal Growth', icon: '🌱', color: '#10b981' },
  { id: 'social', name: 'Social', icon: '👥', color: '#f97316' },
  { id: 'creativity', name: 'Creativity', icon: '🎨', color: '#ec4899' },
];

// ─── AI System ──────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export type InsightType = 'observation' | 'warning' | 'encouragement' | 'tip';

export interface InsightCard {
  type: InsightType;
  message: string;
  habitName?: string;
}

// ─── Stats ──────────────────────────────────────────────────

export interface HabitStats {
  habitId: string;
  habitName: string;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface OverallStats {
  consistencyScore: number;
  currentStreak: number;
  todayCompletionPercent: number;
  focusScore: number;
  totalHabits: number;
  completedToday: number;
  habitStats: HabitStats[];
  heatmapData: HeatmapDay[];
}

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  count: number;
  total: number;
  level: 0 | 1 | 2 | 3 | 4; // intensity level
}
