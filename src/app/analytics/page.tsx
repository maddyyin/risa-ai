"use client";

import { useEffect, useMemo } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import { Heatmap } from "@/components/habits/Heatmap";
import { ProductivityChart } from "@/components/analytics/ProductivityChart";
import { InsightCard } from "@/components/ai/InsightCard";
import { BarChart2, AlertCircle, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { stats, fetchStats, insights, fetchInsights } = useHabitStore();

  useEffect(() => {
    fetchStats();
    fetchInsights();
  }, [fetchStats, fetchInsights]);

  // Compute breakdown sorted by completion rate descending
  const sortedHabitStats = useMemo(() => {
    if (!stats || !stats.habitStats) return [];
    return [...stats.habitStats].sort((a, b) => b.completionRate - a.completionRate);
  }, [stats]);

  // Compute procrastination analysis metrics
  const procrastinationMetrics = useMemo(() => {
    if (!stats || !stats.habitStats || stats.habitStats.length === 0) return null;

    // Lowest completion rate
    const sortedLow = [...stats.habitStats].sort((a, b) => a.completionRate - b.completionRate);
    const mostSkipped = sortedLow[0];

    // Max streak across all habits
    const maxStreak = Math.max(...stats.habitStats.map((h) => h.longestStreak), 0);

    return {
      mostSkipped,
      maxStreak,
    };
  }, [stats]);

  // Get weekly reflection text from AI
  const weeklyReflection = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (insights && (insights as any).weeklyReflection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (insights as any).weeklyReflection;
    }
    // Fallback if not directly attached to insights array
    return "Your routines are beginning to settle. Continue tracking completions to build more comprehensive patterns.";
  }, [insights]);

  if (!stats) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Analytics" subtitle="behavioral patterns" />
        <main className="flex-1 p-6 lg:p-8 flex items-center justify-center">
          <div className="text-white/40 text-sm animate-pulse">Loading analytics...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Analytics" subtitle="behavioral patterns" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        
        {/* HERO SECTION: AI Behavioral Reflection */}
        <section className="card-surface p-6 border-l-[3px] border-l-purple-500/80 bg-gradient-to-r from-purple-950/10 via-[#111118] to-[#111118] relative overflow-hidden shadow-[0_4px_20px_-10px_rgba(139,92,246,0.15)] select-none">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                AI Behavioral Reflection
              </span>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed italic font-medium">
                &quot;{weeklyReflection}&quot;
              </p>
              <p className="text-[10px] text-white/30 font-medium">
                Generated from your habit logs over the last 30 days.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: Consistency Heatmap & Productivity Graph */}
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <section className="card-surface p-5 flex flex-col">
            <div className="border-b border-white/[0.06] pb-3 mb-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-display font-bold text-sm text-white">Consistency Heatmap</h2>
                <p className="text-[10px] text-white/30 mt-0.5">completions across all habits for the last 90 days</p>
              </div>
              <span className="text-[10px] text-white/30 font-semibold uppercase tracking-wider">last 90 days</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Heatmap data={stats.heatmapData} />
            </div>
          </section>

          <section className="card-surface p-5 flex flex-col justify-center">
            <ProductivityChart data={stats.heatmapData} days={30} />
          </section>
        </div>

        {/* SECTION 3: Breakdown & Routine Details */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Consistency Breakdown (3 cols) */}
          <div className="lg:col-span-3 card-surface p-5 flex flex-col h-[320px]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3 mb-3 shrink-0">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span className="font-display font-bold text-sm text-white">Consistency Breakdown</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
              {sortedHabitStats.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-12">No habit records found.</p>
              ) : (
                sortedHabitStats.map((habit) => (
                  <div key={habit.habitId} className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-white/80">{habit.habitName}</span>
                      <span className="font-bold text-purple-400">{habit.completionRate}%</span>
                    </div>
                    <div className="progress-thin w-full">
                      <div
                        className="progress-thin-fill"
                        style={{ width: `${habit.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Routine Highlights & Insights (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-[320px]">
            {/* Highlights Box */}
            <div className="card-surface p-4 flex flex-col justify-between flex-1">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">Routine Highlights</span>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-3">
                {procrastinationMetrics ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Most Skipped:</span>
                      <span className="font-bold text-amber-400 truncate max-w-[120px]">{procrastinationMetrics.mostSkipped.habitName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Peak Consistency:</span>
                      <span className="font-bold text-orange-400">{procrastinationMetrics.maxStreak} days</span>
                    </div>
                  </>
                ) : (
                  <p className="text-white/30 text-xs text-center">Track habits to see routine analysis.</p>
                )}
              </div>
            </div>

            {/* Insights Stack */}
            <div className="card-surface p-4 flex flex-col justify-between flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2.5 shrink-0">
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">Actionable Insight</span>
              </div>

              <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
                {insights.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-4">No insights generated yet.</p>
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
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
