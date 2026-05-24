"use client";

import { useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Priority, HabitFrequency } from "@/types";

const weekDays = [
  { label: "S", value: 0 },
  { label: "M", value: 1 },
  { label: "T", value: 2 },
  { label: "W", value: 3 },
  { label: "T", value: 4 },
  { label: "F", value: 5 },
  { label: "S", value: 6 },
];

export function CreateHabitDialog() {
  const createHabit = useHabitStore((s) => s.createHabit);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📌");
  const [category, setCategory] = useState("General");
  const [priority, setPriority] = useState<Priority>("medium");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [targetDays, setTargetDays] = useState<number[]>([]);

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

    await createHabit({
      name,
      icon: icon || "📌",
      color: "#8b5cf6", // Accent purple
      frequency,
      targetDays: frequency === "custom" ? targetDays : undefined,
      category: category || "General",
      priority,
    });

    // Reset Form
    setName("");
    setIcon("📌");
    setCategory("General");
    setPriority("medium");
    setFrequency("daily");
    setTargetDays([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold select-none cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            Create Habit
          </button>
        }
      />
      <DialogContent className="sm:max-w-[420px] bg-[#111118] border-white/[0.06] text-white">
        <DialogHeader className="pb-3 border-b border-white/[0.06]">
          <DialogTitle className="font-display font-bold text-lg text-white">
            Create Habit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Name & Icon */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="name" className="text-white/60 text-xs">
                Habit Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Morning Meditation"
                required
                className="input-minimal bg-white/[0.03] border-white/[0.08]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="icon" className="text-white/60 text-xs">
                Icon
              </Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📌"
                className="input-minimal text-center bg-white/[0.03] border-white/[0.08]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-white/60 text-xs">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Health, Mindfulness"
              className="input-minimal bg-white/[0.03] border-white/[0.08]"
            />
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
                    priority === p ? "chip-active" : "chip-inactive"
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
                    frequency === f ? "chip-active" : "chip-inactive"
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

          {/* Submit */}
          <div className="pt-3 border-t border-white/[0.06] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-white/[0.08] text-white/70 hover:bg-white/[0.03]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="btn-primary">
              Create Habit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
