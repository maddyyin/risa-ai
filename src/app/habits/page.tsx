"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import { InsightCard } from "@/components/ai/InsightCard";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { DailyTasks } from "@/components/habits/DailyTasks";
import { AIChat } from "@/components/ai/AIChat";
import { CreateHabitDialog } from "@/components/habits/CreateHabitDialog";
import { BrainCircuit } from "lucide-react";

export default function HabitsPage() {
  const { insights, insightsLoading, fetchInsights } = useHabitStore();

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Habits" subtitle="Track and refine your daily routines">
        <CreateHabitDialog />
      </Header>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl">
        {/* Section A: AI Guidance Insights */}
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            AI Reflection & Guidance
          </div>

          {insightsLoading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-white/[0.02] border border-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="card-surface p-4 text-center text-white/30 text-xs">
              AI analysis will populate as you begin completing tracked habits.
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((ins, index) => (
                <InsightCard
                  key={index}
                  type={ins.type}
                  message={ins.message}
                  habitName={ins.habitName}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section B: Habit Tracker Grid */}
        <section className="space-y-2">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
            Consistency Tracker
          </div>
          <HabitGrid />
        </section>

        {/* Section C & D: Bottom Grid splits Tasks & AI Chat */}
        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {/* Section C: Daily Tasks Checklist */}
          <section>
            <DailyTasks />
          </section>

          {/* Section D: AI Coach Chat */}
          <section>
            <AIChat />
          </section>
        </div>
      </main>
    </div>
  );
}
