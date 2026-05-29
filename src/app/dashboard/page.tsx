"use client";

import { useEffect, useState, useMemo } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import Link from "next/link";
import { Check, Target, ChevronRight, Zap, Bell, BarChart2, Flame, CheckCircle2, ChevronLeft } from "lucide-react";
import { auth } from "@/lib/firebase";

// Helper to compute time-aware greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Evening";
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
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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
    <div className="flex-1 flex flex-col min-w-0 bg-[#050811] overflow-hidden">
      <Header
        title={
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              System Online
            </span>
            <h1 className="font-display font-extrabold text-4xl text-white tracking-tight leading-tight mt-1">
              {greeting}
            </h1>
          </div>
        }
        subtitle={
          <span className="text-white/50 text-sm font-medium">
            Your cognitive load is lower than yesterday. A perfect window for deep work on your habit:{" "}
            <span className="text-[#00f5ff] font-semibold">
              {priorityHabit?.habit?.name || "Quantum Architecture Studies"}
            </span>.
          </span>
        }
      >
        <div className="flex items-center gap-3.5 select-none">
          <button className="p-2.5 rounded-full bg-[#151c2c]/40 border border-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-display font-black text-sm text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.1)] select-none uppercase">
            {userName.slice(0, 2).toUpperCase() || "U"}
          </div>
        </div>
      </Header>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Stats Bar */}
        {!stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {/* 1. Consistency */}
            <div className="card-surface-flat p-5 flex flex-col justify-between select-none h-32 relative">
              <div className="flex justify-between items-start">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Consistency</span>
                <div className="p-1 rounded bg-[#00f5ff]/10 text-[#00f5ff]">
                  <BarChart2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="18"
                      stroke="#00f5ff"
                      strokeWidth="3.5"
                      fill="transparent"
                      strokeDasharray="113.1"
                      strokeDashoffset={113.1 - (stats.consistencyScore / 100) * 113.1}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-extrabold text-white">{stats.consistencyScore}%</span>
                </div>
                <div>
                  <div className="font-display font-extrabold text-xl text-white leading-tight">
                    +12%
                  </div>
                  <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider block mt-0.5">vs last week</span>
                </div>
              </div>
            </div>

            {/* 2. Current Streak */}
            <div className="card-surface-flat p-5 flex flex-col justify-between select-none h-32 relative">
              <div className="flex justify-between items-start">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Current Streak</span>
                <div className="p-1 rounded bg-[#00f5ff]/10 text-[#00f5ff]">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                <div className="font-display font-extrabold text-xl text-white leading-tight">
                  {stats.currentStreak} <span className="text-xs font-semibold text-white/50">days</span>
                </div>
                <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00f5ff] rounded-full" style={{ width: `${Math.min((stats.currentStreak / 30) * 100, 100)}%` }} />
                </div>
                <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider block">
                  Personal record: {Math.max(stats.currentStreak, 32)} days
                </span>
              </div>
            </div>

            {/* 3. Completed Today */}
            <div className="card-surface-flat p-5 flex flex-col justify-between select-none h-32 relative">
              <div className="flex justify-between items-start">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Completed Today</span>
                <div className="p-1 rounded bg-[#00f5ff]/10 text-[#00f5ff]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 mt-2">
                <div className="font-display font-extrabold text-xl text-white leading-tight">
                  {stats.completedToday} <span className="text-xs font-semibold text-white/40">/ {stats.totalHabits}</span>
                </div>
                <div className="flex gap-1 items-end h-8 pb-1">
                  <div className="w-1 h-3 bg-[#00f5ff]/40 rounded-full" />
                  <div className="w-1 h-5 bg-[#00f5ff]/60 rounded-full" />
                  <div className="w-1 h-8 bg-[#00f5ff] rounded-full shadow-[0_0_8px_rgba(0,245,255,0.4)]" />
                  <div className="w-1 h-6 bg-[#00f5ff]/60 rounded-full" />
                  <div className="w-1 h-4 bg-[#00f5ff]/40 rounded-full" />
                </div>
              </div>
            </div>

            {/* 4. Focus Score */}
            <div className="card-surface-flat p-5 flex flex-col justify-between select-none h-32 relative">
              <div className="flex justify-between items-start">
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Focus Score</span>
                <div className="p-1 rounded bg-[#00f5ff]/10 text-[#00f5ff]">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 space-y-1">
                <div className="font-display font-extrabold text-xl text-white leading-tight">
                  {stats.focusScore} <span className="text-xs font-semibold text-white/40">/ 100</span>
                </div>
                <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider block">
                  Flow state detected for 4.2h
                </span>
                <div className="h-4 w-full">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path
                      d="M0,10 Q15,0 30,10 T60,10 T90,10 L100,5"
                      fill="none"
                      stroke="#00f5ff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_6px_rgba(0,245,255,0.4)]"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Weekly Activity Matrix */}
          <div className="lg:col-span-3 card-surface p-5 flex flex-col min-h-[440px]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.04] shrink-0">
              <h2 className="font-display font-extrabold text-base text-white tracking-tight">
                Weekly Activity Matrix
              </h2>
              <div className="flex items-center gap-4 text-white/40">
                <button className="p-1 hover:text-white transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:text-white transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 scrollbar-none">
              {habits.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-white/30 text-xs">No habits tracked. Start by creating a habit.</p>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="py-3 text-left text-[10px] font-bold text-white/40 uppercase tracking-widest w-[160px] pb-4">
                        Habit Name
                      </th>
                      <th className="py-3 text-left pb-4">
                        <div className="flex gap-2">
                          {weekDays.map((d) => (
                            <span
                              key={d.date}
                              className={`w-9 text-center inline-block text-[10px] font-bold ${
                                d.isToday ? "text-[#00f5ff] font-extrabold" : "text-white/30"
                              }`}
                            >
                              {d.dayName}
                            </span>
                          ))}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {habits.map((habit) => {
                      const completions = habit.completions.map((c) => c.date);

                      return (
                        <tr key={habit.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 text-xs font-semibold text-white/90 truncate max-w-[160px]">
                            {habit.name}
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              {weekDays.map((day) => {
                                const isCompleted = completions.includes(day.date);
                                const isFuture = day.isFuture;

                                let cellStyle = "w-9 h-9 rounded-lg transition-all duration-200 ";
                                if (isCompleted) {
                                  cellStyle += "bg-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.4)]";
                                } else if (isFuture) {
                                  cellStyle += "bg-white/[0.01] border border-white/[0.02] opacity-25 cursor-not-allowed";
                                } else {
                                  cellStyle += "bg-white/[0.03] border border-white/[0.06]";
                                }

                                return (
                                  <div
                                    key={day.date}
                                    title={`${habit.name} - ${day.date}${day.isToday ? " (Today)" : ""}`}
                                    className={cellStyle}
                                  />
                                );
                              })}
                            </div>
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
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-[440px]">
            {/* RISA AI Guidance Card */}
            <div className="card-surface p-5 flex flex-col justify-between flex-1 relative overflow-hidden bg-gradient-to-b from-[#151c2c80] to-[#0e142280]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#00f5ff]/10 flex items-center justify-center text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.1)]">
                    <Zap className="w-4 h-4 text-[#00f5ff] fill-[#00f5ff]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-white">RISA AI</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Neural Sync Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Stack (Deep Warning, Behavior, Motivation) */}
              <div className="flex-1 my-3 overflow-y-auto space-y-3 pr-1 scrollbar-none max-h-[220px]">
                {insightsLoading ? (
                  <div className="space-y-2.5 animate-pulse">
                    <div className="h-14 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
                    <div className="h-14 bg-white/[0.02] border border-white/[0.04] rounded-xl" />
                  </div>
                ) : insights.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] relative">
                    <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 select-none">
                      <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                      Motivation
                    </div>
                    <p className="text-white/80 text-xs leading-relaxed font-medium">
                      "{userName}, I've noticed your focus peaks between 18:00 and 20:00 on weekdays. I've rescheduled your non-essential notifications for this evening."
                    </p>
                  </div>
                ) : (
                  insights.slice(0, 3).map((ins, index) => {
                    let typeLabel = "Motivation";
                    let labelColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                    let dotColor = "bg-purple-400";
                    
                    if (ins.type === "warning") {
                      typeLabel = "Deep Warning";
                      labelColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      dotColor = "bg-amber-400";
                    } else if (ins.type === "encouragement") {
                      typeLabel = "Encourage";
                      labelColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      dotColor = "bg-emerald-400";
                    }

                    return (
                      <div
                        key={index}
                        className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] flex flex-col gap-1.5 transition-all hover:border-white/[0.08]"
                      >
                        <div className="flex items-center">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${labelColor} flex items-center gap-1 select-none`}>
                            <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-white/80 text-xs leading-relaxed font-medium">
                          {ins.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Cognitive Battery */}
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white/40 font-bold uppercase tracking-widest">Cognitive Battery</span>
                  <span className="text-white font-extrabold">68%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
            </div>

            {/* Next Milestone Card */}
            <div className="card-surface p-4 flex items-center gap-3.5 bg-gradient-to-r from-[#151c2c80] to-[#0e142280] shrink-0 select-none">
              <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-white/70">
                <span className="text-lg">🏆</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Next Milestone</p>
                <h4 className="text-xs font-bold text-white mt-0.5">30-Day Zen Master</h4>
                <p className="text-[10px] text-white/50 font-medium">6 days remaining</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
