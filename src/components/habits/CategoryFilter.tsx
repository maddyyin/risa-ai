"use client";

import { useHabitStore } from "@/store/habitStore";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  const categories = useHabitStore((s) => s.categories);

  // We filter to a representative set of categories or show all available categories.
  // Showing all available categories is better for functionality! Let's style them all.
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mb-1 select-none">
      <button
        onClick={() => onSelect(null)}
        className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
          selectedCategory === null
            ? "bg-white text-[#050811] shadow-[0_4px_12px_rgba(255,255,255,0.15)] font-bold"
            : "bg-white/[0.02] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
        }`}
      >
        All
      </button>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.name;
        
        // Custom color overriding for standard ones to match mockup closely
        let dotColor = cat.color;
        if (cat.name.toLowerCase() === "health") dotColor = "#22c55e"; // green
        if (cat.name.toLowerCase() === "work" || cat.name.toLowerCase() === "coding") dotColor = "#a855f7"; // purple
        if (cat.name.toLowerCase() === "mindfulness" || cat.name.toLowerCase() === "meditation") dotColor = "#00f5ff"; // cyan
        if (cat.name.toLowerCase() === "learning" || cat.name.toLowerCase() === "study") dotColor = "#ec4899"; // pink

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.name)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2 transition-all duration-200 cursor-pointer whitespace-nowrap ${
              isSelected
                ? "bg-white text-[#050811] shadow-[0_4px_12px_rgba(255,255,255,0.15)] font-bold"
                : "bg-white/[0.02] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            {!isSelected && (
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: dotColor }}
              />
            )}
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
