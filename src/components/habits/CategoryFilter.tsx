"use client";

import { useHabitStore } from "@/store/habitStore";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  const categories = useHabitStore((s) => s.categories);

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mb-1">
      <button
        onClick={() => onSelect(null)}
        className={`chip whitespace-nowrap text-xs shrink-0 ${
          selectedCategory === null ? "chip-active" : ""
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.name)}
          className={`chip whitespace-nowrap text-xs shrink-0 flex items-center gap-1.5 ${
            selectedCategory === cat.name ? "chip-active" : ""
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  );
}
