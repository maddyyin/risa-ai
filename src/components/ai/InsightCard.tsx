"use client";

import { Eye, AlertTriangle, Heart, Lightbulb, Sparkles } from "lucide-react";
import { InsightCard as InsightCardProps } from "@/types";
import { useMemo } from "react";

const icons = {
  observation: Eye,
  warning: AlertTriangle,
  encouragement: Heart,
  tip: Lightbulb,
};

const borderClasses = {
  observation: "insight-observation",
  warning: "insight-warning",
  encouragement: "insight-encouragement",
  tip: "insight-tip",
};

export function InsightCard({ type, message, habitName }: InsightCardProps) {
  const Icon = icons[type] || Lightbulb;
  const borderClass = borderClasses[type] || "insight-tip";

  // Split message into a headline and secondary recommendation
  const { headline, subtext } = useMemo(() => {
    if (!message) return { headline: "", subtext: "" };
    
    // Split on first period followed by space
    const index = message.indexOf(". ");
    if (index === -1) {
      return { headline: message, subtext: "" };
    }
    
    const first = message.substring(0, index + 1);
    const rest = message.substring(index + 2);
    
    return {
      headline: first,
      subtext: rest,
    };
  }, [message]);

  return (
    <div className={`card-surface p-4 flex gap-4 ${borderClass} animate-fade-in-up items-start`}>
      {/* Icon with glowing backdrop */}
      <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center relative ${
        type === "warning" ? "text-amber-400 bg-amber-400/5 shadow-[0_0_12px_rgba(245,158,11,0.15)]" :
        type === "observation" ? "text-blue-400 bg-blue-400/5 shadow-[0_0_12px_rgba(59,130,246,0.15)]" :
        type === "encouragement" ? "text-emerald-400 bg-emerald-400/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]" :
        "text-purple-400 bg-purple-400/5 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
      }`}>
        <Icon className="w-4 h-4 relative z-10" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-purple-400/70" />
            {type}
          </span>
          {habitName && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/[0.04]">
              {habitName}
            </span>
          )}
        </div>

        {/* Headline (Large readable text) */}
        <h4 className="font-display font-bold text-sm text-white/95 leading-snug">
          {headline}
        </h4>

        {/* Supportive recommendation (Small subtext) */}
        {subtext && (
          <p className="text-[11px] text-white/50 leading-relaxed mt-1 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

