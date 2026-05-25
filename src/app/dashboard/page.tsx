"use client";

import { useEffect, useState, useMemo } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/ui/StatCard";
import { InsightCard } from "@/components/ai/InsightCard";
import Link from "next/link";
import { Check, Target, ChevronRight, Zap } from "lucide-react";
import { auth } from "@/lib/firebase";

// Helper to compute time-aware greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

// Helper to get formatted date string
function getFormattedDate() {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  return new Date().toLocaleDateString("en-US", options);
}

// Helper to generate the current week days (Monday - Sunday)
function getWeekDays() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  
  // Find Monday
  const monday = new Date(today);
  const offset = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(today.getDate() + offset);

  const days = [];
  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      dayName: dayNames[i],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    });
  }
  return days;
}

// Calculate streak helper
function calculateStreak(completions: { date: string }[]) {
  const dates = completions.map((c) => c.date);
  if (dates.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const hasToday = dates.includes(todayStr);
  const hasYesterday = dates.includes(yesterdayStr);

  let streak = 0;
  if (hasToday || hasYesterday) {
    let currentCheckStr = hasToday ? todayStr : yesterdayStr;
    while (true) {
      if (dates.includes(currentCheckStr)) {
        streak++;
        const d = new Date(currentCheckStr + "T12:00:00");
        d.setDate(d.getDate() - 1);
        currentCheckStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        break;
      }
    }
  }
  return streak;
}

export default function DashboardPage() {
  const { habits, stats, fetchStats, insights, insightsLoading, fetchInsights } = useHabitStore();
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    async function loadSettings() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch("/api/settings", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.name) setUserName(data.name);
        }
      } catch (e) {
        console.warn("Failed to load settings in dashboard:", e);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSettings();
      }
    });

    fetchStats();
    fetchInsights();

    return () => unsubscribe();
  }, [fetchStats, fetchInsights]);

  const greeting = useMemo(() => `${getGreeting()}, ${userName}`, [userName]);
  const dateStr = useMemo(() => getFormattedDate(), []);
  const subtitle = useMemo(() => {
    if (!stats || stats.totalHabits === 0) {
      return `${dateStr} • Let's establish your first routine.`;
    }
    const score = stats.consistencyScore;
    if (score >= 80) {
      return `${dateStr} • You're building consistency beautifully.`;
    }
    if (score >= 50) {
      return `${dateStr} • Your routines are becoming more stable.`;
    }
    return `${dateStr} • Take a deep breath. One small step today is enough.`;
  }, [dateStr, stats]);
  const weekDays = useMemo(() => getWeekDays(), []);

  // Find the highest-priority incomplete habit for today
  const priorityHabit = useMemo(() => {
    if (habits.length === 0) return null;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const incomplete = habits.filter(
      (h) => !h.completions.some((c) => c.date === todayStr)
    );

    if (incomplete.length === 0) return null;

    // Sort by priority (high > medium > low)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    incomplete.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    const target = incomplete[0];
    const streak = calculateStreak(target.completions);

    return {
      habit: target,
      streak,
    };
  }, [habits]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title={greeting} subtitle={subtitle} />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        {/* Stats Bar */}
        {!stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-white/[0.03] border border-white/[0.06] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap md:flex-nowrap gap-4 animate-fade-in">
            <StatCard
              label="Consistency"
              value={stats.consistencyScore}
              suffix="%"
              sublabel="30-day average"
            />
            <StatCard
              label="Overall Streak"
              value={stats.currentStreak}
              suffix="days"
              sublabel="minimum active streak"
            />
            <StatCard
              label="Completed Today"
              value={stats.todayCompletionPercent}
              suffix="%"
              sublabel={`${stats.completedToday} of ${stats.totalHabits} habits`}
            />
            <StatCard
              label="Focus Score"
              value={stats.focusScore}
              suffix="/ 100"
              sublabel="high priority weighting"
            />
          </div>
        )}

        {/* Dashboard Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Mini Weekly Heatmap */}
          <div className="lg:col-span-3 card-surface p-4 flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] shrink-0">
              <h2 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-400" />
                This Week
              </h2>
              <span className="text-[10px] text-white/30">weekly consistency</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
              {habits.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-white/30 text-xs">No habits tracked. Start on the habits tab.</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] pb-2">
                      <th className="py-2 text-left text-[9px] font-bold text-white/30 uppercase tracking-wider w-[120px]">
                        Habit
                      </th>
                      <th className="py-2 text-left">
                        <div className="flex gap-1.5">
                          {weekDays.map((d) => (
                            <span
                              key={d.date}
                              className={`w-[24px] text-center inline-block text-[9px] font-bold ${
                                d.isToday ? "text-purple-400 font-black" : "text-white/30"
                              }`}
                            >
                              {d.dayName}
                            </span>
                          ))}
                        </div>
                      </th>
                      <th className="py-2 text-right text-[9px] font-bold text-white/30 uppercase tracking-wider w-[50px]">
                        Weekly %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map((habit) => {
                      const completions = habit.completions.map((c) => c.date);
                      const elapsedDays = weekDays.filter(d => !d.isFuture);
                      const completionsCount = elapsedDays.filter(d => completions.includes(d.date)).length;
                      const weekRate = elapsedDays.length > 0 ? Math.round((completionsCount / elapsedDays.length) * 100) : 0;

                      return (
                        <tr key={habit.id} className="border-b border-white/[0.02] last:border-0 hover:bg-white/[0.01] transition-colors">
                          <td className="py-2.5 text-xs font-semibold text-white/80 truncate max-w-[120px]">
                            <span className="mr-1.5">{habit.icon}</span>
                            {habit.name}
                          </td>
                          <td className="py-2.5">
                            <div className="flex gap-1.5">
                              {weekDays.map((day) => {
                                const isCompleted = completions.includes(day.date);
                                const isFuture = day.isFuture;

                                let cellClass = "w-[24px] h-[24px] rounded-md border flex items-center justify-center transition-all ";
                                if (isCompleted) {
                                  cellClass += "bg-purple-500/10 border-purple-500/35 text-purple-400";
                                } else if (isFuture) {
                                  cellClass += "bg-white/[0.01] border-white/[0.04] opacity-25 cursor-not-allowed";
                                } else {
                                  cellClass += "bg-white/[0.02] border-white/[0.06]";
                                }

                                return (
                                  <div
                                    key={day.date}
                                    title={`${habit.name} - ${day.date}${day.isToday ? " (Today)" : ""}`}
                                    className={cellClass}
                                  >
                                    {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="text-xs font-extrabold text-white/60">{weekRate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT: Stack of focus / AI details */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-[340px]">
            {/* Priority Card */}
            <div className="card-surface p-4 flex flex-col justify-between flex-1">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 shrink-0">
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  Priority Today
                </span>
                <span className="text-[10px] text-white/30">focus target</span>
              </div>

              <div className="flex-1 flex items-center">
                {priorityHabit ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{priorityHabit.habit.icon}</span>
                        <h3 className="text-sm font-bold text-white truncate max-w-[150px]">
                          {priorityHabit.habit.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">
                        {priorityHabit.habit.category} • {priorityHabit.habit.priority}
                      </p>
                    </div>
                    {priorityHabit.streak > 0 && (
                      <span className="streak-badge whitespace-nowrap">
                        🔥 {priorityHabit.streak} day streak
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-white/40 text-xs">
                      All habits completed, or no habits tracked.
                    </p>
                  </div>
                )}
              </div>

              <Link
                href="/habits"
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center mt-2 group"
              >
                Go to Habits
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* AI Guidance Card */}
            <div className="card-surface p-4 flex flex-col justify-between flex-1 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 shrink-0">
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">
                  AI Guidance
                </span>
                <span className="text-[10px] text-white/30">insights</span>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden py-1">
                {insightsLoading ? (
                  <div className="animate-pulse flex gap-4 p-4 card-surface bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/[0.05] rounded w-2/3" />
                      <div className="h-3 bg-white/[0.05] rounded w-1/2" />
                    </div>
                  </div>
                ) : insights.length === 0 ? (
                  <p className="text-white/30 text-xs text-center">
                    AI coaching insights will appear as you check off habits.
                  </p>
                ) : (
                  insights.slice(0, 1).map((ins, index) => (
                    <InsightCard
                      key={index}
                      type={ins.type}
                      message={ins.message}
                      habitName={ins.habitName}
                    />
                  ))
                )}
              </div>

              <Link
                href="/analytics"
                className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center mt-1 group"
              >
                See more insights
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
