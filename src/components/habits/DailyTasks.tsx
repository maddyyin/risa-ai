"use client";

import { useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Plus, X } from "lucide-react";

export function DailyTasks() {
  const { dailyTasks, addDailyTask, toggleDailyTask, deleteDailyTask } = useHabitStore();
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    await addDailyTask(newTitle.trim(), today);
    setNewTitle("");
  };

  return (
    <div className="card-surface p-4 flex flex-col h-[280px]">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3 shrink-0">
        <span className="font-display font-semibold text-sm text-white">Daily Tasks</span>
        <span className="text-[10px] text-white/30">ephemeral list</span>
      </div>

      {/* Input */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-3 shrink-0">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a daily task..."
          className="input-minimal flex-1 px-3 py-1.5 text-xs bg-white/[0.03] border-white/[0.08]"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="btn-primary w-8 h-8 flex items-center justify-center disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {dailyTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-white/30 text-xs">No daily tasks yet.</p>
          </div>
        ) : (
          dailyTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 px-2 py-1.5 rounded bg-white/[0.02] border border-white/[0.04] group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleDailyTask(task.id)}
                  className="custom-checkbox"
                />
                <span
                  className={`text-xs truncate ${
                    task.completed ? "line-through text-white/30" : "text-white/80"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => deleteDailyTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 transition-opacity p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
