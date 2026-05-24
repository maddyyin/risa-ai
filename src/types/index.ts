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
