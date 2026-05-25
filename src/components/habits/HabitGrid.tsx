"use client";

import { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { HabitRow } from "./HabitRow";
import { CreateHabitDialog } from "./CreateHabitDialog";
import { CategoryFilter } from "./CategoryFilter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HabitGrid() {
  const { habits, toggleCompletion } = useHabitStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Month navigation state
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (!selectedCategory) return habits;
    return habits.filter((h) => h.category === selectedCategory);
  }, [habits, selectedCategory]);

  // Compute days of viewed month
  const days = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0 = Jan, 11 = Dec
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
    const baseIndex = todayIndex >= 0 ? todayIndex : result.length - 1;

    return result.map((d, index) => ({
      ...d,
      isRecent: index >= baseIndex - 6 && index <= baseIndex
    }));
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
  }, [viewDate]);

  const monthLabel = viewDate.toLocaleString("en-US", { month: "long", year: "numeric" });

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
      {/* Controls Header: Category Filter & Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-[#111118] border border-white/[0.06] rounded-lg p-1 w-fit">
          <button 
            onClick={handlePrevMonth}
            className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/[0.05] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-white/80 min-w-[100px] text-center select-none">
            {monthLabel}
          </span>
          <button 
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            className={`p-1.5 rounded-md transition-colors ${
              isCurrentMonth 
                ? "text-white/10 cursor-not-allowed" 
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {filteredHabits.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/40 text-xs">No habits in this category.</p>
          </div>
        ) : (
          /* Scrollable table container */
          <div className="overflow-x-auto scrollbar-none sm:scrollbar-thin pb-1">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="py-3 pl-4 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40 sticky left-0 bg-[#111118] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                    Habit
                  </th>
                  <th className="py-3 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <div className="flex gap-[3px]">
                      {days.map((day) => (
                        <span
                          key={day.date}
                          className={`w-[34px] md:w-[28px] shrink-0 text-center inline-block ${
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
