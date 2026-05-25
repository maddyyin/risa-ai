"use client";

import { useMemo, useState, useEffect } from "react";
import { useHabitStore } from "@/store/habitStore";
import { HabitRow } from "./HabitRow";
import { CreateHabitDialog } from "./CreateHabitDialog";
import { CategoryFilter } from "./CategoryFilter";

export function HabitGrid() {
  const { habits, toggleCompletion } = useHabitStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (!selectedCategory) return habits;
    return habits.filter((h) => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Compute days of current month
  const days = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const year = today.getFullYear();
    const month = today.getMonth(); // 0 = Jan, 11 = Dec
    const numDays = new Date(year, month + 1, 0).getDate();

    const result = [];
    for (let i = 1; i <= numDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      result.push({
        date: dateStr,
        dayNum: i,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }

    // Determine the index of today to calculate recent days
    const todayIndex = result.findIndex(d => d.isToday);
    // If today is not in the current month (edge case), default to end of array
    const baseIndex = todayIndex >= 0 ? todayIndex : result.length - 1;

    return result.map((d, index) => ({
      ...d,
      isRecent: index >= baseIndex - 6 && index <= baseIndex
    }));
  }, []);

  if (habits.length === 0) {
    return (
      <div className="card-surface p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-display font-bold text-xl">
          🎯
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-white">No habits yet</h3>
          <p className="text-white/40 text-xs mt-1 max-w-[280px]">
            Begin your consistency journey by creating your first habit.
          </p>
        </div>
        <CreateHabitDialog />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="card-surface overflow-hidden">
        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/40 text-xs">No habits in this category.</p>
          </div>
        ) : (
          /* Scrollable table container */
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="py-3 pl-4 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Habit
                  </th>
                  <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <div className="flex gap-[3px]">
                      {days.map((day) => (
                        <span
                          key={day.date}
                          className={`w-[28px] text-center ${day.isRecent ? "inline-block" : "hidden md:inline-block"} ${
                            day.isToday ? "text-purple-400 font-extrabold" : ""
                          }`}
                        >
                          {day.dayNum}
                        </span>
                      ))}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Streak
                  </th>
                  <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHabits.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    days={days}
                    onToggle={toggleCompletion}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
