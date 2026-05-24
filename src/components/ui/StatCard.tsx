"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  sublabel?: string;
}

export function StatCard({ label, value, suffix, sublabel }: StatCardProps) {
  return (
    <div className="card-surface-flat p-4 flex-1 min-w-[130px] select-none">
      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-display font-extrabold text-2xl tracking-tight text-white">
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-semibold text-white/50">{suffix}</span>
        )}
      </div>
      {sublabel && (
        <p className="text-[10px] text-white/30 mt-0.5 truncate">{sublabel}</p>
      )}
    </div>
  );
}
