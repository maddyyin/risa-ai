"use client";

import { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { EditHabitDialog } from "./EditHabitDialog";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Habit } from "@/types";

interface HabitGridProps {
  searchQuery: string;
  selectedCategory: string | null;
}

export function HabitGrid({ searchQuery, selectedCategory }: HabitGridProps) {
  const { habits, toggleCompletion, deleteHabit } = useHabitStore();
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  // Month navigation state
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
  const monthLabelShort = viewDate.toLocaleString("en-US", { month: "short" });

  // Generate days of viewed month
  const daysInMonth = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    const result = [];
    for (let i = 1; i <= numDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      result.push({
        date: dateStr,
        dayNum: i,
        isToday: dateStr === todayStr,
      });
    }
    return result;
  }, [viewDate]);

  // Filter habits by category and search query
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      const matchesCategory = !selectedCategory || h.category === selectedCategory;
      const matchesSearch = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && !h.archived;
    });
  }, [habits, selectedCategory, searchQuery]);

  // Helper to calculate streak for a habit
  const calculateStreak = (completions: { date: string }[]) => {
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
  };

  // Calculate consistency score for the whole month
  const calculateMonthlyConsistency = (completions: { date: string }[]) => {
    if (daysInMonth.length === 0) return 0;
    const monthDates = daysInMonth.map((d) => d.date);
    const completionsInMonth = completions.filter((c) => monthDates.includes(c.date)).length;
    return Math.round((completionsInMonth / daysInMonth.length) * 100);
  };

  if (habits.length === 0) {
    return (
      <div className="card-surface p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 select-none">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-display font-bold text-xl">
          🎯
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-white">No habits yet</h3>
          <p className="text-white/40 text-xs mt-1 max-w-[280px]">
            Begin your consistency journey by creating your first habit in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface p-6 flex flex-col relative overflow-hidden bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
      
      {/* Card Header with Title and Month Controls */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/[0.04] shrink-0 select-none">
        <h2 className="font-display font-bold text-base text-white tracking-tight">
          Active Circuits
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">
            {monthLabel}
          </span>
          <div className="flex items-center gap-1 bg-[#151c2c]/85 border border-white/[0.06] rounded-lg p-0.5 select-none">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className={`p-1 rounded transition-colors ${
                isCurrentMonth
                  ? "text-white/10 cursor-not-allowed"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] cursor-pointer"
              }`}
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of habits and check blocks in a table to ensure perfect scrolling and alignment */}
      <div className="overflow-x-auto scrollbar-none pb-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {/* Habit Details Header */}
              <th className="text-left pb-3 text-[10px] font-bold text-white/30 uppercase tracking-widest min-w-[240px]">
                Circuit Details
              </th>
              {/* Days Header */}
              {daysInMonth.map((day) => (
                <th key={day.date} className="pb-3 text-center shrink-0 w-[24px]">
                  <span
                    className={`inline-block w-[20px] text-center text-[9px] font-bold select-none ${
                      day.isToday ? "text-[#00f5ff] font-extrabold" : "text-white/30"
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {filteredHabits.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth.length + 1} className="py-8 text-center text-white/40 text-xs">
                  No active circuits match this filter.
                </td>
              </tr>
            ) : (
              filteredHabits.map((habit) => {
                const streak = calculateStreak(habit.completions);
                const completionDates = habit.completions.map((c) => c.date);
                const monthRate = calculateMonthlyConsistency(habit.completions);

                return (
                  <tr key={habit.id} className="group/row hover:bg-white/[0.01] transition-colors">
                    {/* Habit Info Cell */}
                    <td className="py-4 pr-3 min-w-[240px] max-w-[240px]">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Emoji Icon with background */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 select-none shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/[0.04]"
                          style={{
                            backgroundColor: `${habit.color}15`,
                            color: habit.color,
                          }}
                        >
                          {habit.icon || "📌"}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white/95 truncate">
                              {habit.name}
                            </span>
                            {/* Action buttons (pencil & delete) on row hover */}
                            <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditHabit(habit)}
                                className="p-1 rounded text-white/30 hover:text-[#00f5ff] hover:bg-[#00f5ff]/10 transition-all cursor-pointer"
                                title="Edit habit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteHabitId(habit.id)}
                                className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Delete habit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <span className="text-[10px] text-white/40 font-medium flex items-center gap-1.5 mt-0.5 select-none">
                            <span className="text-[#00f5ff]">⚡ {streak}d Streak</span>
                            <span className="text-white/20">•</span>
                            <span className="text-emerald-400 font-semibold">{monthRate}% Month Rate</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Checkbox block squircle cells */}
                    {daysInMonth.map((day) => {
                      const isCompleted = completionDates.includes(day.date);
                      
                      let cellStyle = "w-[20px] h-[20px] rounded-[6px] transition-all duration-200 cursor-pointer shrink-0 inline-flex items-center justify-center ";
                      let tooltipText = `${day.dayNum} ${monthLabelShort}: `;

                      if (isCompleted) {
                        cellStyle += "bg-[#00f5ff] border-[#00f5ff] shadow-[0_0_12px_rgba(0,245,255,0.75)]";
                        tooltipText += "Completed";
                      } else {
                        cellStyle += "bg-white/[0.02] border border-white/[0.06] hover:border-white/15";
                        tooltipText += "Empty";
                      }

                      if (day.isToday) {
                        cellStyle += " ring-1 ring-cyan-400/50";
                      }

                      return (
                        <td key={day.date} className="py-4 text-center shrink-0 w-[24px]">
                          <button
                            onClick={() => toggleCompletion(habit.id, day.date)}
                            className={cellStyle}
                            title={tooltipText}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-white/[0.04] flex gap-4 text-[10px] text-white/40 font-bold uppercase tracking-wider select-none shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.03] border border-white/[0.04]" />
          <span>Empty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px] bg-[#00f5ff] shadow-[0_0_8px_rgba(0,245,255,0.5)]" />
          <span>Completed Circuit</span>
        </div>
      </div>

      {/* Dialogs */}
      {editHabit && (
        <EditHabitDialog
          habit={editHabit}
          open={!!editHabit}
          onOpenChange={(open) => !open && setEditHabit(null)}
        />
      )}

      {deleteHabitId && (
        <DeleteConfirmDialog
          open={!!deleteHabitId}
          onOpenChange={(open) => !open && setDeleteHabitId(null)}
          title="Delete Habit?"
          description="Are you sure you want to delete this habit and all its completions? This cannot be undone."
          onConfirm={async () => {
            if (deleteHabitId) {
              await deleteHabit(deleteHabitId);
              setDeleteHabitId(null);
            }
          }}
        />
      )}
    </div>
  );
}
