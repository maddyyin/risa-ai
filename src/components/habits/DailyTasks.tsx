"use client";

import { useState, useRef, useEffect } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Plus, X, Pencil, Check } from "lucide-react";

export function DailyTasks() {
  const { dailyTasks, addDailyTask, toggleDailyTask, updateDailyTask, deleteDailyTask } = useHabitStore();
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Helper to parse priority tag from task title
  const parseTaskTitle = (title: string) => {
    const match = title.match(/\[(high|med|low)\]$/i);
    if (match) {
      const priority = match[1].toUpperCase();
      const cleanTitle = title.replace(/\[(high|med|low)\]$/i, "").trim();
      return { title: cleanTitle, priority };
    }
    return { title, priority: null };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const todayObj = new Date();
    const today = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    await addDailyTask(newTitle.trim(), today);
    setNewTitle("");
  };

  const handleClearDone = async () => {
    const completedTasks = dailyTasks.filter((t) => t.completed);
    await Promise.all(completedTasks.map((t) => deleteDailyTask(t.id)));
  };

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditText(title);
    setDeletingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    await updateDailyTask(editingId, { title: editText.trim() });
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="card-surface p-6 flex flex-col h-[340px] bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4 shrink-0">
        <span className="font-display font-bold text-base text-white">Daily Tasks</span>
        <button
          onClick={handleClearDone}
          className="text-[10px] text-white/40 hover:text-white/80 font-bold uppercase tracking-wider transition-colors cursor-pointer select-none"
        >
          Clear Done
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none mb-4">
        {dailyTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-white/30 text-xs">No daily tasks yet.</p>
          </div>
        ) : (
          dailyTasks.map((task) => {
            const isEditing = editingId === task.id;
            const isDeleting = deletingId === task.id;
            const { title, priority } = parseTaskTitle(task.title);

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08]"
                >
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="input-minimal flex-1 px-2.5 py-1 text-xs bg-white/[0.02] border-white/[0.08]"
                  />
                  <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300 cursor-pointer">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 text-white/40 hover:text-white/70 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            if (isDeleting) {
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/20"
                >
                  <span className="text-[10px] text-red-300 font-medium">Delete this task?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { deleteDailyTask(task.id); setDeletingId(null); }}
                      className="text-[10px] text-red-400 font-bold hover:text-red-300 cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] text-white/50 hover:text-white/70 cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.01] border border-white/[0.04] group transition-all duration-200 hover:border-white/[0.08]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Custom Checkbox wrapper */}
                  <label className="relative flex items-center justify-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleDailyTask(task.id)}
                      className="peer sr-only"
                    />
                    <div className="w-[18px] h-[18px] rounded-[5px] border border-white/20 bg-transparent transition-all peer-checked:bg-[#00f5ff] peer-checked:border-[#00f5ff] flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#050811] stroke-[3.5] opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </label>

                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`text-xs font-medium truncate ${
                        task.completed ? "line-through text-white/25" : "text-white/85"
                      }`}
                    >
                      {title}
                    </span>
                    {priority && !task.completed && (
                      <span
                        className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full select-none ${
                          priority === "HIGH"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : priority === "MED"
                            ? "bg-white/[0.05] text-white/60 border border-white/[0.08]"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {priority}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(task.id, task.title)}
                    className="p-1 text-white/30 hover:text-[#00f5ff] transition-colors cursor-pointer"
                    title="Edit task"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(task.id)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete task"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form at bottom */}
      <form onSubmit={handleAdd} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a quick task..."
          className="input-minimal flex-1 px-4 py-2.5 text-xs bg-white/[0.02] border-white/[0.08] focus:border-[#00f5ff]/40 rounded-xl"
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="bg-[#00f5ff] text-[#050811] hover:bg-[#00d8e2] rounded-full w-9 h-9 flex items-center justify-center transition-all cursor-pointer font-bold disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_12px_rgba(0,245,255,0.2)]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </form>
    </div>
  );
}
