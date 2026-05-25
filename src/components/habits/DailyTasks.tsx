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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const todayObj = new Date();
    const today = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    await addDailyTask(newTitle.trim(), today);
    setNewTitle("");
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
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {dailyTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-white/30 text-xs">No daily tasks yet.</p>
          </div>
        ) : (
          dailyTasks.map((task) => {
            const isEditing = editingId === task.id;
            const isDeleting = deletingId === task.id;

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded bg-purple-500/5 border border-purple-500/20"
                >
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="input-minimal flex-1 px-2 py-1 text-xs bg-white/[0.03] border-white/[0.08]"
                  />
                  <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={cancelEdit} className="p-1 text-white/40 hover:text-white/70">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            if (isDeleting) {
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded bg-red-500/5 border border-red-500/20"
                >
                  <span className="text-[10px] text-red-300">Delete this task?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { deleteDailyTask(task.id); setDeletingId(null); }}
                      className="text-[10px] text-red-400 font-semibold hover:text-red-300"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] text-white/50 hover:text-white/70"
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
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(task.id, task.title)}
                    className="p-1 text-white/30 hover:text-purple-400 transition-colors"
                    title="Edit task"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeletingId(task.id)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors"
                    title="Delete task"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
