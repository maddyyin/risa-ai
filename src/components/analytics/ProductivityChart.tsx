"use client";

import { useMemo } from "react";
import { HeatmapDay } from "@/types";

interface ProductivityChartProps {
  data: HeatmapDay[];
  days?: number;
}

export function ProductivityChart({ data = [], days = 30 }: ProductivityChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Take the last N days
    return data.slice(-days);
  }, [data, days]);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-white/30 text-xs">
        No productivity data available yet.
      </div>
    );
  }

  // Calculate max possible completions to scale the Y axis
  const maxTotal = Math.max(...chartData.map((d) => d.total), 1);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const yMax = Math.max(maxTotal, maxCount, 5); // Ensure at least a scale of 5

  // SVG dimensions
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Generate points for the line/area
  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (d.count / yMax) * innerHeight;
    return { x, y, date: d.date, count: d.count, total: d.total };
  });

  // Create path strings
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

  // Generate Y axis markers
  const yMarkers = [0, Math.round(yMax / 2), yMax];

  return (
    <div className="w-full relative select-none">
      <div className="flex justify-between items-end mb-4 px-2">
        <div>
          <h3 className="font-display font-bold text-sm text-white">30-Day Productivity Trend</h3>
          <p className="text-[10px] text-white/30">habits completed per day</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none">
        <div className="min-w-[600px] w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible" preserveAspectRatio="none">
            {/* Y Axis Grid Lines */}
            {yMarkers.map((marker, i) => {
              const y = padding.top + innerHeight - (marker / yMax) * innerHeight;
              return (
                <g key={`y-${i}`}>
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {marker}
                  </text>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    strokeDasharray={marker !== 0 ? "4 4" : "none"}
                  />
                </g>
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#purpleGradient)" opacity="0.4" />

            {/* Line Path */}
            <path
              d={linePath}
              fill="none"
              stroke="rgb(168, 85, 247)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            />

            {/* Data Points */}
            {points.map((p, i) => (
              <circle
                key={`point-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.count > 0 ? 4 : 3}
                fill="#111118"
                stroke={p.count > 0 ? "rgb(192, 132, 252)" : "rgba(255,255,255,0.2)"}
                strokeWidth="2"
                className="transition-all duration-200 hover:r-[6px] cursor-pointer"
              >
                <title>{`${new Date(p.date + "T12:00:00").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${p.count} completions`}</title>
              </circle>
            ))}

            {/* X Axis Labels (Sparse to avoid clutter) */}
            {points.map((p, i) => {
              const isFirst = i === 0;
              const isLast = i === points.length - 1;
              // roughly every 7 days, but don't show if it's too close to the last day (within 4 days)
              const isInterval = i > 0 && i < points.length - 1 && i % Math.max(1, Math.floor(chartData.length / 4)) === 0;
              const tooCloseToEnd = (points.length - 1 - i) < 4;

              if (isFirst || isLast || (isInterval && !tooCloseToEnd)) {
                const d = new Date(p.date + "T12:00:00");
                return (
                  <text
                    key={`x-${i}`}
                    x={p.x}
                    y={height - 5}
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                  >
                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </text>
                );
              }
              return null;
            })}

            {/* Gradients */}
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
