"use client";

import { useState, useEffect } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Habit, Priority, HabitFrequency } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const weekDays = [
  { label: "S", value: 0 },
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
];

interface EditHabitDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditHabitDialog({ habit, open, onOpenChange }: EditHabitDialogProps) {
  const updateHabit = useHabitStore((s) => s.updateHabit);
  const categories = useHabitStore((s) => s.categories);

  const [name, setName] = useState(habit.name);
  const [icon, setIcon] = useState(habit.icon);
  const [category, setCategory] = useState(habit.category);
  const [priority, setPriority] = useState<Priority>(habit.priority);
  const [frequency, setFrequency] = useState<HabitFrequency>(habit.frequency);
  const [targetDays, setTargetDays] = useState<number[]>(habit.targetDays || []);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime || "");

  // Re-sync form when habit prop changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setName(habit.name);
    setIcon(habit.icon);
    setCategory(habit.category);
    setPriority(habit.priority);
    setFrequency(habit.frequency);
    setTargetDays(habit.targetDays || []);
    setReminderTime(habit.reminderTime || "");
  }, [habit]);

  const handleToggleDay = (dayValue: number) => {
    if (targetDays.includes(dayValue)) {
      setTargetDays(targetDays.filter((d) => d !== dayValue));
    } else {
      setTargetDays([...targetDays, dayValue]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateHabit(habit.id, {
      name: name.trim(),
      icon: icon || "📌",
      category: category || "General",
      priority,
      frequency,
      targetDays: frequency === "custom" ? targetDays : undefined,
      reminderTime: reminderTime || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#111118] border-white/[0.06] text-white">
        <DialogHeader className="pb-3 border-b border-white/[0.06]">
          <DialogTitle className="font-display font-bold text-lg text-white">
            Edit Habit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Name & Icon */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="edit-name" className="text-white/60 text-xs">
                Habit Name
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Meditation"
                required
                className="input-minimal bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-icon" className="text-white/60 text-xs">
                Icon
              </Label>
              <Input
                id="edit-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📌"
                className="input-minimal text-center bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`chip text-xs flex items-center gap-1 ${
                    category === cat.name ? "chip-active" : ""
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`chip capitalize text-center ${
                    priority === p ? "chip-active" : ""
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Frequency</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["daily", "weekdays", "custom"] as HabitFrequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`chip capitalize text-center ${
                    frequency === f ? "chip-active" : ""
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {frequency === "custom" && (
              <div className="space-y-1.5 animate-fade-in-up mt-2">
                <Label className="text-white/40 text-[10px]">Select Target Days</Label>
                <div className="flex gap-1.5 justify-between">
                  {weekDays.map((day) => {
                    const isSelected = targetDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleToggleDay(day.value)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                            : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:bg-white/[0.05]"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reminder Time */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-reminder" className="text-white/60 text-xs">
              Reminder Time (optional)
            </Label>
            <Input
              id="edit-reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="input-minimal bg-white/[0.03] border-white/[0.08] w-full"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/[0.08] text-white/70 hover:bg-white/[0.03]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="btn-primary">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
