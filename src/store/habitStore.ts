import { create } from 'zustand';
import { Habit, DailyTask, AIMessage, OverallStats, InsightCard, Category, PRESET_CATEGORIES } from '../types';
import { auth } from '@/lib/firebase';

// Helper to retrieve Authorization headers containing current Firebase ID Token
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
}

// ─── Category Persistence (localStorage) ──────────────────
const CUSTOM_CATEGORIES_KEY = 'risa_custom_categories';

function loadCustomCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(cats: Category[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(cats));
}

interface HabitState {
  habits: Habit[];
  dailyTasks: DailyTask[];
  stats: OverallStats | null;
  insights: InsightCard[];
  chatMessages: AIMessage[];
  loading: boolean;
  insightsLoading: boolean;
  chatLoading: boolean;

  // Categories
  categories: Category[];
  loadCategories: () => void;
  addCategory: (cat: Omit<Category, 'id' | 'isCustom'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Habits
  fetchHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'archived' | 'sortOrder'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;

  // Stats
  fetchStats: () => Promise<void>;

  // Daily Tasks
  fetchDailyTasks: (date: string) => Promise<void>;
  addDailyTask: (title: string, date: string) => Promise<void>;
  toggleDailyTask: (id: string) => Promise<void>;
  updateDailyTask: (id: string, updates: { title?: string; sortOrder?: number }) => Promise<void>;
  deleteDailyTask: (id: string) => Promise<void>;

  // AI
  fetchInsights: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  fetchChatHistory: () => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  dailyTasks: [],
  stats: null,
  insights: [],
  chatMessages: [],
  loading: true,
  insightsLoading: false,
  chatLoading: false,
  categories: [...PRESET_CATEGORIES],

  // ─── Categories ─────────────────────────────────────────────

  loadCategories: () => {
    const custom = loadCustomCategories();
    set({ categories: [...PRESET_CATEGORIES, ...custom] });
  },

  addCategory: (cat) => {
    const newCat: Category = {
      ...cat,
      id: 'custom_' + Math.random().toString(36).substring(2, 9),
      isCustom: true,
    };
    const custom = loadCustomCategories();
    const updated = [...custom, newCat];
    saveCustomCategories(updated);
    set({ categories: [...PRESET_CATEGORIES, ...updated] });
  },

  updateCategory: (id, updates) => {
    const custom = loadCustomCategories().map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    saveCustomCategories(custom);
    set({ categories: [...PRESET_CATEGORIES, ...custom] });
  },

  deleteCategory: (id) => {
    const custom = loadCustomCategories().filter((c) => c.id !== id);
    saveCustomCategories(custom);
    set({ categories: [...PRESET_CATEGORIES, ...custom] });
  },

  // ─── Habits ──────────────────────────────────────────────

  fetchHabits: async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/habits', {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      const parsed = data.map((h: Record<string, unknown>) => ({
        ...h,
        createdAt: new Date(h.createdAt as string),
        targetDays: h.targetDays ? JSON.parse(h.targetDays as string) : undefined,
      }));
      set({ habits: parsed, loading: false });
    } catch (e) {
      console.warn('Habit fetch failed:', e);
      set({ loading: false });
    }
  },

  createHabit: async (habit) => {
    const tempId = 'temp_' + Math.random().toString(36).substring(2, 9);
    const optimistic: Habit = {
      ...habit,
      id: tempId,
      archived: false,
      sortOrder: get().habits.length,
      createdAt: new Date(),
      completions: [],
    };
    set({ habits: [...get().habits, optimistic] });

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(habit),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      const saved = await res.json();
      set({
        habits: get().habits.map((h) =>
          h.id === tempId ? { ...saved, createdAt: new Date(saved.createdAt), completions: [], targetDays: saved.targetDays ? JSON.parse(saved.targetDays) : undefined } : h
        ),
      });
    } catch (e) {
      console.error('Create habit error:', e);
    }
  },

  updateHabit: async (id, updates) => {
    set({ habits: get().habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) });
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Update habit error:', e);
    }
  },

  deleteHabit: async (id) => {
    set({ habits: get().habits.filter((h) => h.id !== id) });
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/habits/${id}`, { 
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch (e) {
      console.error('Delete habit error:', e);
    }
  },

  toggleCompletion: async (habitId, date) => {
    // Optimistic toggle
    const habits = get().habits.map((h) => {
      if (h.id !== habitId) return h;
      const existing = h.completions.find((c) => c.date === date);
      if (existing) {
        return { ...h, completions: h.completions.filter((c) => c.date !== date) };
      } else {
        return {
          ...h,
          completions: [
            ...h.completions,
            { id: 'temp_' + Math.random().toString(36).substring(2, 9), habitId, date, completed: true },
          ],
        };
      }
    });
    set({ habits });

    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ date }),
      });
      // Refetch for accurate server state
      await get().fetchHabits();
      await get().fetchStats();
    } catch (e) {
      console.error('Toggle completion error:', e);
    }
  },

  // ─── Stats ───────────────────────────────────────────────

  fetchStats: async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/habits/stats?today=${todayStr}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      set({ stats: data });
    } catch (e) {
      console.warn('Stats fetch failed:', e);
    }
  },

  // ─── Daily Tasks ─────────────────────────────────────────

  fetchDailyTasks: async (date) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/tasks?date=${date}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch daily tasks');
      const data = await res.json();
      set({ dailyTasks: data });
    } catch (e) {
      console.warn('Daily tasks fetch failed:', e);
      set({ dailyTasks: [] });
    }
  },

  addDailyTask: async (title, date) => {
    const tempId = 'temp_' + Math.random().toString(36).substring(2, 9);
    const optimistic: DailyTask = { id: tempId, title, completed: false, date, sortOrder: get().dailyTasks.length };
    set({ dailyTasks: [...get().dailyTasks, optimistic] });

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ title, date }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const saved = await res.json();
      set({ dailyTasks: get().dailyTasks.map((t) => (t.id === tempId ? saved : t)) });
    } catch (e) {
      console.error('Add daily task error:', e);
    }
  },

  toggleDailyTask: async (id) => {
    set({
      dailyTasks: get().dailyTasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    });
    try {
      const authHeaders = await getAuthHeaders();
      const task = get().dailyTasks.find((t) => t.id === id);
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ completed: task?.completed }),
      });
    } catch (e) {
      console.error('Toggle task error:', e);
    }
  },

  updateDailyTask: async (id, updates) => {
    set({
      dailyTasks: get().dailyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    });
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error('Update daily task error:', e);
    }
  },

  deleteDailyTask: async (id) => {
    set({ dailyTasks: get().dailyTasks.filter((t) => t.id !== id) });
    try {
      const authHeaders = await getAuthHeaders();
      await fetch(`/api/tasks/${id}`, { 
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch (e) {
      console.error('Delete task error:', e);
    }
  },

  // ─── AI ──────────────────────────────────────────────────

  fetchInsights: async () => {
    set({ insightsLoading: true });
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/ai/insights', {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      set({ insights: data.insights || [], insightsLoading: false });
    } catch (e) {
      console.warn('Insights fetch failed:', e);
      set({
        insights: [
          { type: 'tip', message: 'Complete your habits today to start receiving AI insights.' },
        ],
        insightsLoading: false,
      });
    }
  },

  sendChatMessage: async (message) => {
    const userMsg: AIMessage = {
      id: 'temp_' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    set({ chatMessages: [...get().chatMessages, userMsg], chatLoading: true });

    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 
          ...authHeaders,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error('Failed to send chat');
      const data = await res.json();
      const aiMsg: AIMessage = {
        id: data.id || 'ai_' + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: data.content,
        createdAt: new Date(data.createdAt || Date.now()),
      };
      set({ chatMessages: [...get().chatMessages, aiMsg], chatLoading: false });
    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg: AIMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: "I couldn't process that right now. Try again in a moment.",
        createdAt: new Date(),
      };
      set({ chatMessages: [...get().chatMessages, errorMsg], chatLoading: false });
    }
  },

  fetchChatHistory: async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/ai/chat', {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to fetch chat');
      const data = await res.json();
      const messages = data.map((m: Record<string, unknown>) => ({ ...m, createdAt: new Date(m.createdAt as string) }));
      set({ chatMessages: messages });
    } catch (e) {
      console.warn('Chat history fetch failed:', e);
    }
  },
}));
