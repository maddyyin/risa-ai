"use client";

import { useEffect, useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { DailyTasks } from "@/components/habits/DailyTasks";
import { CategoryFilter } from "@/components/habits/CategoryFilter";
import { CategoryManagerDialog } from "@/components/habits/CategoryManagerDialog";
import { FocusTimeframes } from "@/components/habits/FocusTimeframes";
import { Search, Bell, FolderOpen } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function HabitsPage() {
  const { loadCategories } = useHabitStore();
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Alex Sterling");

  useEffect(() => {
    loadCategories();
    
    // Load display name from settings
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
        console.warn("Failed to load settings in habits page:", e);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSettings();
      }
    });

    return () => unsubscribe();
  }, [loadCategories]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#050811] overflow-hidden">
      {/* Header */}
      <Header
        title={
          <div className="flex flex-col gap-0.5">
            <h1 className="font-display font-extrabold text-3xl text-white tracking-tight leading-tight">
              Habit Evolution
            </h1>
            <p className="text-white/40 text-xs mt-1">Refining your daily neural pathways.</p>
          </div>
        }
      >
        <div className="flex items-center gap-3.5 select-none">
          {/* Search bar input */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search habits..."
              className="bg-[#151c2c]/40 border border-white/[0.04] text-white placeholder-white/30 text-xs px-4 py-2.5 pl-10 rounded-full w-56 focus:outline-none focus:border-[#00f5ff]/30 focus:bg-[#151c2c]/60 transition-all"
            />
          </div>

          {/* Bell Icon */}
          <button className="p-2.5 rounded-full bg-[#151c2c]/40 border border-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </button>

          {/* User Avatar Initials Badge */}
          <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-display font-black text-xs text-[#00f5ff] shadow-[0_0_8px_rgba(0,245,255,0.1)] select-none uppercase">
            {userName.slice(0, 2).toUpperCase() || "U"}
          </div>
        </div>
      </Header>

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Category Pills Row with Manage Categories button */}
        <div className="flex items-center justify-between gap-4">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <button
            onClick={() => setCatManagerOpen(true)}
            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all cursor-pointer shrink-0"
            title="Manage Categories"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>

        {/* Core Layout Split */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* LEFT: Active Circuits 30-Day Heat Matrix */}
          <div className="lg:col-span-3">
            <HabitGrid
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
            />
          </div>

          {/* RIGHT: Daily Tasks + Focus Timers */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Daily Tasks Checklist */}
            <DailyTasks />

            {/* Focus Timeframes Timers */}
            <FocusTimeframes />
          </div>
        </div>
      </main>

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={catManagerOpen}
        onOpenChange={setCatManagerOpen}
      />
    </div>
  );
}
