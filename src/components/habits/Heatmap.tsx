"use client";

import { HeatmapDay } from "@/types";
import { useMemo } from "react";

interface HeatmapProps {
  data: HeatmapDay[];
  days?: number;
}

export function Heatmap({ data = [], days = 90 }: HeatmapProps) {
  const grid = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter to last N days
    const sliced = data.slice(-days);

    // Group into weeks (columns)
    // We want a 2D array: weeks[colIndex][rowIndex] where rowIndex 0 is Sunday, 6 is Saturday
    const weeks: (HeatmapDay | null)[][] = [];
    let currentWeek: (HeatmapDay | null)[] = Array(7).fill(null);

    // Pad the beginning so the first day aligns with its day of week
    const firstDate = new Date(sliced[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 = Sunday, 6 = Saturday

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek[i] = null;
    }

    sliced.forEach((day) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      currentWeek[dayOfWeek] = day;

      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    });

    // Push the last partial week if it contains elements
    if (currentWeek.some((d) => d !== null)) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [data, days]);

  // Labels for months
  const monthLabels = useMemo(() => {
    if (!grid || grid.length === 0) return [];
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;

    grid.forEach((week, colIndex) => {
      // Find the first valid day in the week
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const date = new Date(validDay.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          const monthStr = date.toLocaleString("default", { month: "short" });
          labels.push({ text: monthStr, colIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [grid]);

  if (!grid || grid.length === 0) {
    return (
      <div className="h-[140px] flex items-center justify-center text-white/30 text-xs">
        No consistency data recorded yet.
      </div>
    );
  }

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="w-full overflow-x-auto scrollbar-thin select-none">
      <div className="min-w-[400px] py-3">
        {/* Month headers */}
        <div className="flex text-[10px] text-white/40 font-semibold mb-3 ml-[24px] relative h-5">
          {monthLabels.map((label, i) => (
            <div
              key={i}
              className="absolute"
              style={{ left: `${label.colIndex * 24}px` }}
            >
              {label.text}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[4px]">
          {/* Day indicators */}
          <div className="flex flex-col gap-[4px] text-[9px] text-white/30 font-semibold w-[24px] pr-2 shrink-0">
            {dayNames.map((day, idx) => (
              <div key={idx} className="h-[20px] flex items-center justify-end">
                <span className={idx % 2 === 0 ? "opacity-0" : ""}>
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Grid columns */}
          <div className="flex gap-[4px] flex-1">
            {grid.map((week, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-[4px]">
                {week.map((day, rowIdx) => {
                  if (!day) {
                    return (
                      <div
                        key={rowIdx}
                        className="w-[20px] h-[20px] rounded-[4px] bg-transparent"
                      />
                    );
                  }

                  const levelClass = `heatmap-cell-${day.level}`;
                  const title = `${new Date(day.date).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}: ${day.count}/${day.total} habits completed`;

                  return (
                    <div
                      key={rowIdx}
                      title={title}
                      className={`w-[20px] h-[20px] rounded-[4px] ${levelClass} transition-colors duration-150 hover:ring-1 hover:ring-white/40 cursor-help`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-medium justify-end mt-3 pr-2">
          <span>Less</span>
          <div className="w-[12px] h-[12px] rounded-[2px] heatmap-cell-0" />
          <div className="w-[12px] h-[12px] rounded-[2px] heatmap-cell-1" />
          <div className="w-[12px] h-[12px] rounded-[2px] heatmap-cell-2" />
          <div className="w-[12px] h-[12px] rounded-[2px] heatmap-cell-3" />
          <div className="w-[12px] h-[12px] rounded-[2px] heatmap-cell-4" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
