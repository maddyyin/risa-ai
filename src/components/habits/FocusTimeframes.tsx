"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, Info, Check, Play, Pause, RotateCcw } from "lucide-react";
import { auth } from "@/lib/firebase";

type FocusRhythm = "pomodoro" | "deep-work" | "flow-state";

// Helper to retrieve Authorization headers containing current Firebase ID Token
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export function FocusTimeframes() {
  const [focusRhythm, setFocusRhythm] = useState<FocusRhythm>("pomodoro");
  const [focusStart, setFocusStart] = useState("09:00");
  const [focusEnd, setFocusEnd] = useState("18:00");
  const [saved, setSaved] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(1500);

  // Load from database on mount / auth state ready
  useEffect(() => {
    async function loadSettings() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/settings", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.focusStart) setFocusStart(data.focusStart);
          if (data.focusEnd) setFocusEnd(data.focusEnd);
          
          // Deduce focus rhythm based on times
          let rhythm: FocusRhythm = "pomodoro";
          let dur = 1500;
          if (data.focusStart === "09:00" && data.focusEnd === "18:00") {
            rhythm = "pomodoro";
            dur = 1500; // 25 min
          } else if (data.focusStart === "08:00" && data.focusEnd === "17:00") {
            rhythm = "deep-work";
            dur = 3000; // 50 min
          } else if (data.focusStart === "10:00" && data.focusEnd === "19:00") {
            rhythm = "flow-state";
            dur = 5400; // 90 min
          }
          
          setFocusRhythm(rhythm);
          setDuration(dur);
          setTimeLeft(dur);
        }
      } catch (e) {
        console.warn("Failed to load settings in FocusTimeframes:", e);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSettings();
      }
    });

    return () => unsubscribe();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const selectFocusRhythm = async (rhythm: FocusRhythm) => {
    setFocusRhythm(rhythm);
    setIsRunning(false);

    let start = "09:00";
    let end = "18:00";
    let dur = 1500;

    if (rhythm === "pomodoro") {
      start = "09:00";
      end = "18:00";
      dur = 25 * 60;
    } else if (rhythm === "deep-work") {
      start = "08:00";
      end = "17:00";
      dur = 50 * 60;
    } else if (rhythm === "flow-state") {
      start = "10:00";
      end = "19:00";
      dur = 90 * 60;
    }

    setFocusStart(start);
    setFocusEnd(end);
    setDuration(dur);
    setTimeLeft(dur);

    // Save automatically to the database
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          focusStart: start,
          focusEnd: end,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Save focus rhythm error:", e);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="card-surface p-6 flex flex-col relative bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4 select-none">
        <div className="flex items-center gap-2 text-white/90">
          <Clock className="w-[18px] h-[18px] text-cyan-400" />
          <h3 className="font-display font-bold text-sm tracking-wide">
            Focus Timeframes
          </h3>
        </div>
        {saved && (
          <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-1 animate-fade-in select-none">
            <Check className="w-3 h-3 stroke-[3]" />
            SYNCED
          </span>
        )}
      </div>

      <p className="text-xs text-white/50 leading-relaxed font-medium mb-5">
        Select your primary work rhythm to calibrate ambient sounds and notifications.
      </p>

      {/* Segmented rhythm controls */}
      <div className="grid grid-cols-3 gap-2 bg-white/[0.01] border border-white/[0.04] p-1 rounded-xl mb-5 select-none">
        {(["pomodoro", "deep-work", "flow-state"] as FocusRhythm[]).map((r) => {
          const isActive = focusRhythm === r;
          const label = r === "pomodoro" ? "Pomodoro" : r === "deep-work" ? "Deep Work" : "Flow State";

          return (
            <button
              key={r}
              type="button"
              onClick={() => selectFocusRhythm(r)}
              className={`py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer select-none ${
                isActive
                  ? "bg-[#15233c]/80 border border-[#00f5ff]/30 text-[#00f5ff] font-bold shadow-[0_0_8px_rgba(0,245,255,0.06)]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.01]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Rhythm Info Alert */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex gap-3 text-xs text-white/60 font-medium mb-5">
        <Info className="w-4.5 h-4.5 text-[#00f5ff] shrink-0 mt-0.5" />
        <div>
          {focusRhythm === "pomodoro" && (
            <p className="leading-relaxed">
              Currently configured for <strong className="text-[#00f5ff] font-semibold">Pomodoro</strong> (25m / 5m). RISA will dim secondary interfaces and activate Noise Cancellation on paired devices during active cycles.
            </p>
          )}
          {focusRhythm === "deep-work" && (
            <p className="leading-relaxed">
              Currently configured for <strong className="text-[#00f5ff] font-semibold">Deep Work</strong> (50m / 10m). RISA will suppress all external communications and dim secondary notifications to protect cognitive throughput.
            </p>
          )}
          {focusRhythm === "flow-state" && (
            <p className="leading-relaxed">
              Currently configured for <strong className="text-[#00f5ff] font-semibold">Flow State</strong> (90m / 15m). RISA will activate structural routine shielding, block all distractive tools, and queue ambient focusing sounds.
            </p>
          )}
          <p className="text-[10px] text-white/30 font-bold tracking-wide uppercase mt-2.5">
            FOCUS PERIOD: {focusStart} - {focusEnd}
          </p>
        </div>
      </div>

      {/* Active Timer Controls */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] select-none gap-4">
        {/* Timer Digital Clock */}
        <div className="text-3xl font-mono font-extrabold text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
          {formatTime(timeLeft)}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
              isRunning
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                : "bg-[#00f5ff] text-[#050811] hover:bg-[#00d8e2] shadow-[0_0_8px_rgba(0,245,255,0.3)]"
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-[#050811]" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            onClick={resetTimer}
            className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
            title="Reset Timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
