"use client";

import { Habit } from "@/types";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { EditHabitDialog } from "./EditHabitDialog";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

interface HabitRowProps {
  habit: Habit;
  days: { date: string; isToday: boolean; isFuture: boolean }[];
  onToggle: (habitId: string, date: string) => void;
}

export function HabitRow({ habit, days, onToggle }: HabitRowProps) {
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const completionDates = useMemo(() => {
    return habit.completions.map((c) => c.date);
  }, [habit.completions]);

  // Calculate streak from completions
  const currentStreak = useMemo(() => {
    if (completionDates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const hasToday = completionDates.includes(todayStr);
    const hasYesterday = completionDates.includes(yesterdayStr);

    let streak = 0;
    if (hasToday || hasYesterday) {
      const checkDate = hasToday ? new Date(today) : new Date(yesterday);
      while (true) {
        const checkStr = checkDate.toISOString().split("T")[0];
        if (completionDates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
    return streak;
  }, [completionDates]);

  // Calculate completion percentage
  const completionPercent = useMemo(() => {
    const elapsedDays = days.filter((d) => !d.isFuture);
    if (elapsedDays.length === 0) return 0;

    const completionsInDays = elapsedDays.filter((d) =>
      completionDates.includes(d.date)
    ).length;

    return Math.round((completionsInDays / elapsedDays.length) * 100);
  }, [days, completionDates]);

  return (
    <>
      <tr className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors group">
        {/* Habit Info */}
        <td className="py-3.5 pl-4 pr-3 min-w-[140px] max-w-[180px]">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">{habit.icon}</span>
            <span className="text-xs font-semibold text-white/90 truncate" title={habit.name}>
              {habit.name}
            </span>
            {/* Action buttons - visible on hover (desktop) or always on touch */}
            <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 md:transition-opacity shrink-0 max-md:opacity-100">
              <button
                onClick={() => setEditOpen(true)}
                className="p-1 rounded text-white/30 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                title="Edit habit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete habit"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-white/30 uppercase mt-0.5 tracking-wider">
            {habit.category}
          </p>
        </td>

        {/* Day Cells */}
        <td className="py-3.5 px-3">
          <div className="flex gap-[3px] overflow-x-auto scrollbar-none max-w-[280px] sm:max-w-none">
            {days.map((day) => {
              const isCompleted = completionDates.includes(day.date);
              const isFuture = day.isFuture;

              let cellClass = "habit-cell";
              if (isCompleted) cellClass += " habit-cell-done text-white";
              if (isFuture) cellClass += " habit-cell-disabled";
              if (day.isToday && !isCompleted) cellClass += " border-purple-500/40 ring-1 ring-purple-500/20";

              return (
                <button
                  key={day.date}
                  disabled={isFuture}
                  onClick={() => onToggle(habit.id, day.date)}
                  title={`${habit.name} - ${day.date}${day.isToday ? " (Today)" : ""}`}
                  className={`${cellClass} shrink-0 relative`}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                  {day.isToday && !isCompleted && (
                    <span className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-purple-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </td>

        {/* Streak */}
        <td className="py-3.5 px-3 text-center whitespace-nowrap">
          {currentStreak > 0 ? (
            <span className="streak-badge select-none">
              🔥 {currentStreak}
            </span>
          ) : (
            <span className="text-[10px] text-white/20 select-none">-</span>
          )}
        </td>

        {/* Completion % */}
        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[90px]">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] font-bold text-white/80">{completionPercent}%</span>
            <div className="w-12 progress-thin">
              <div
                className="progress-thin-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </td>
      </tr>

      {/* Edit Dialog */}
      <EditHabitDialog
        habit={habit}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete "${habit.name}"?`}
        description="This habit and all its completion history will be permanently removed. This action cannot be undone."
        onConfirm={() => deleteHabit(habit.id)}
      />
    </>
  );
}
