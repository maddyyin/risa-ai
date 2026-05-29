"use client";

import { useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Lock, Check, X } from "lucide-react";

const COLOR_SWATCHES = [
  "#8b5cf6", "#3b82f6", "#ef4444", "#f43f5e", "#06b6d4",
  "#f59e0b", "#22c55e", "#ec4899", "#14b8a6", "#f97316",
];

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagerDialog({ open, onOpenChange }: CategoryManagerDialogProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useHabitStore();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newColor, setNewColor] = useState("#3b82f6");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory({ name: newName.trim(), icon: newIcon || "📋", color: newColor });
    setNewName("");
    setNewIcon("📋");
    setNewColor("#3b82f6");
  };

  const startEdit = (cat: { id: string; name: string; icon: string; color: string }) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    setEditColor(cat.color);
    setDeletingId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateCategory(editingId, { name: editName.trim(), icon: editIcon, color: editColor });
    setEditingId(null);
  };

  const confirmDelete = (id: string) => {
    deleteCategory(id);
    setDeletingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-[#151c2c]/95 backdrop-blur-md border-white/[0.06] text-white">
        <DialogHeader className="pb-3 border-b border-white/[0.06]">
          <DialogTitle className="font-display font-bold text-lg text-white">
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Create New */}
          <div className="space-y-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <Label className="text-white/60 text-xs">New Category</Label>
            <div className="flex gap-2">
              <Input
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="📋"
                className="input-minimal w-12 text-center bg-white/[0.03] border-white/[0.08]"
              />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="input-minimal flex-1 bg-white/[0.03] border-white/[0.08]"
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="btn-primary w-9 h-9 flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    newColor === c ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1">
            {categories.map((cat) => {
              const isPreset = !cat.isCustom;
              const isEditing = editingId === cat.id;
              const isDeleting = deletingId === cat.id;

              if (isEditing) {
                return (
                  <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <Input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="input-minimal w-10 text-center text-sm bg-white/[0.03] border-white/[0.08]"
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-minimal flex-1 text-sm bg-white/[0.03] border-white/[0.08]"
                    />
                    <div className="flex gap-1.5 flex-wrap">
                      {COLOR_SWATCHES.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            editColor === c ? "border-white" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button onClick={saveEdit} className="p-1 text-green-400 hover:text-green-300">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-white/40 hover:text-white/70">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              }

              if (isDeleting) {
                return (
                  <div key={cat.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                    <span className="text-xs text-red-300">Delete &quot;{cat.name}&quot;?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmDelete(cat.id)}
                        className="text-xs text-red-400 font-semibold hover:text-red-300"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-xs text-white/50 hover:text-white/70"
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: cat.color + "20" }}
                    >
                      {cat.icon}
                    </div>
                    <span className="text-sm text-white/80 truncate">{cat.name}</span>
                  </div>

                  {isPreset ? (
                    <Lock className="w-3.5 h-3.5 text-white/20 shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1 text-white/40 hover:text-blue-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(cat.id)}
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.08] text-white/70 hover:bg-white/[0.03]"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
