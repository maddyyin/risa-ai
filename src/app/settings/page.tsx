"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Save, User, Sliders, Clock, Check } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type Aggressiveness = "low" | "balanced" | "high";
type Tone = "supportive" | "neutral" | "direct";

interface RisaSettings {
  name: string;
  motivationTone: Tone;
  aggressiveness: Aggressiveness;
  focusStart: string;
  focusEnd: string;
}

// Helper to retrieve Authorization headers containing current Firebase ID Token
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export default function SettingsPage() {
  const { logOut } = useAuth();
  const [name, setName] = useState("User");
  const [tone, setTone] = useState<Tone>("supportive");
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>("balanced");
  const [focusStart, setFocusStart] = useState("09:00");
  const [focusEnd, setFocusEnd] = useState("18:00");
  const [saved, setSaved] = useState(false);

  // Load from database on mount / auth state ready
  useEffect(() => {
    async function loadSettings() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/settings", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.name) setName(data.name);
          if (data.motivationTone) setTone(data.motivationTone);
          if (data.aggressiveness) setAggressiveness(data.aggressiveness);
          if (data.focusStart) setFocusStart(data.focusStart);
          if (data.focusEnd) setFocusEnd(data.focusEnd);
        }
      } catch (e) {
        console.warn("Failed to load settings from database:", e);
      }
    }

    // Wait until auth state is checked or try immediately
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSettings();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const settings: RisaSettings = {
      name,
      motivationTone: tone,
      aggressiveness,
      focusStart,
      focusEnd,
    };

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (e) {
      console.error("Save settings error:", e);
      alert("Failed to save preferences. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header title="Settings" subtitle="preferences" />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-xl mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6 animate-fade-in">
          {/* Section A: Profile */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-1">
              <User className="w-4 h-4 text-purple-400" />
              <span className="font-display font-bold text-sm text-white">Profile settings</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-name" className="text-white/60 text-xs font-medium">
                Your Name
              </label>
              <input
                id="user-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sahil"
                className="input-minimal w-full px-3 py-2 text-sm bg-white/[0.03] border-white/[0.08]"
                required
              />
            </div>
          </div>

          {/* Section B: AI Behavior */}
          <div className="card-surface p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-1">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="font-display font-bold text-sm text-white">AI Behavioral Adjustments</span>
            </div>

            {/* Aggressiveness */}
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium">AI Coach Aggressiveness</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "balanced", "high"] as Aggressiveness[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAggressiveness(val)}
                    className={`chip capitalize text-center ${
                      aggressiveness === val ? "chip-active" : "chip-inactive"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30">
                Determines how direct and challenging RISA is with your skipped routines.
              </p>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium">Motivation Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {(["supportive", "neutral", "direct"] as Tone[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTone(val)}
                    className={`chip capitalize text-center ${
                      tone === val ? "chip-active" : "chip-inactive"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30">
                Chooses the primary emotional alignment of your AI insights and reflection coach.
              </p>
            </div>
          </div>

          {/* Section C: Focus Hours */}
          <div className="card-surface p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-1">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="font-display font-bold text-sm text-white">Focus Timeframes</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="focus-start" className="text-white/60 text-xs font-medium">
                  Start Hour
                </label>
                <input
                  id="focus-start"
                  type="time"
                  value={focusStart}
                  onChange={(e) => setFocusStart(e.target.value)}
                  className="input-minimal w-full px-3 py-2 text-sm bg-white/[0.03] border-white/[0.08]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="focus-end" className="text-white/60 text-xs font-medium">
                  End Hour
                </label>
                <input
                  id="focus-end"
                  type="time"
                  value={focusEnd}
                  onChange={(e) => setFocusEnd(e.target.value)}
                  className="input-minimal w-full px-3 py-2 text-sm bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>
          </div>

          {/* Submit Save & Sign Out */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={logOut}
              className="text-xs text-red-400/70 hover:text-red-400 font-medium transition-colors cursor-pointer select-none"
            >
              Sign Out Account
            </button>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-xs text-purple-400 font-semibold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  Settings saved
                </span>
              )}
              <button
                type="submit"
                className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 select-none cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
