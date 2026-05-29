"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sliders, User, Check, Shield, LogOut, RotateCcw, Save } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, updateEmail } from "firebase/auth";

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
  const { logOut, user: authUser } = useAuth();
  
  // Settings values
  const [name, setName] = useState("Alex Sterling");
  const [email, setEmail] = useState("alex.sterling@intelligence.io");
  const [tone, setTone] = useState<Tone>("supportive");
  const [aggressiveness, setAggressiveness] = useState<Aggressiveness>("balanced");
  const [focusStart, setFocusStart] = useState("09:00");
  const [focusEnd, setFocusEnd] = useState("18:00");
  
  // Custom states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load from database on mount / auth state ready
  useEffect(() => {
    async function loadSettings() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/settings", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            setName(data.name);
            setTempName(data.name);
          }
          if (data.motivationTone) setTone(data.motivationTone);
          if (data.aggressiveness) setAggressiveness(data.aggressiveness);
          if (data.focusStart) setFocusStart(data.focusStart);
          if (data.focusEnd) setFocusEnd(data.focusEnd);
        }
      } catch (e) {
        console.warn("Failed to load settings from database:", e);
      }
    }

    if (authUser) {
      setEmail(authUser.email || "alex.sterling@intelligence.io");
      setTempEmail(authUser.email || "alex.sterling@intelligence.io");
      loadSettings();
    }
  }, [authUser]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const settings = {
      name,
      email,
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
      }, 2500);
    } catch (e) {
      console.error("Save settings error:", e);
      alert("Failed to save preferences. Please try again.");
    }
  };

  const handleReset = () => {
    setResetting(true);
    setName("Alex Sterling");
    setTone("supportive");
    setAggressiveness("balanced");
    setFocusStart("09:00");
    setFocusEnd("18:00");
    
    setTimeout(() => {
      setResetting(false);
      handleSave();
    }, 500);
  };

  const saveProfileEdit = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Update Firebase Auth Display Name if changed
        if (tempName !== name) {
          await updateProfile(user, { displayName: tempName });
        }

        // Update Firebase Auth Email if changed
        if (tempEmail !== email) {
          try {
            await updateEmail(user, tempEmail);
          } catch (authErr: any) {
            console.warn("Failed to update email in Firebase Auth:", authErr);
            if (authErr.code === "auth/requires-recent-login") {
              alert("Changing your email address requires a recent login. Please log out, sign in again, and retry.");
              return;
            } else {
              alert(`Firebase Auth Error: ${authErr.message}`);
              return;
            }
          }
        }

        // Sync settings to database
        const headers = await getAuthHeaders();
        const res = await fetch("/api/settings", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: tempName,
            email: tempEmail,
            motivationTone: tone,
            aggressiveness,
            focusStart,
            focusEnd,
          }),
        });

        if (!res.ok) throw new Error("Failed to save settings in DB");

        setName(tempName);
        setEmail(tempEmail);
        setIsEditingProfile(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error("Save profile error:", e);
      alert("Failed to update profile. Please try again.");
    }
  };

  // Convert settings fields to percentage and readable text
  const aggressivenessPercent = aggressiveness === "low" ? "25%" : aggressiveness === "balanced" ? "50%" : "75%";
  const frequencyLabel = tone === "supportive" ? "Low" : tone === "neutral" ? "Medium" : "High";

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#050811] overflow-hidden">
      {/* Top section header tag */}
      <div className="px-6 lg:px-8 pt-5 lg:pt-6 -mb-4 select-none">
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          System Configuration
        </span>
      </div>

      <Header
        title="Preferences"
        subtitle="Refine your interaction model, manage personal data, and schedule RISA's proactive interventions."
      />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full overflow-y-auto">
        <div className="grid lg:grid-cols-5 gap-6 items-start animate-fade-in">
          
          {/* LEFT COLUMN: Profile & Quick Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* User Profile Card */}
            <div className="card-surface p-6 flex flex-col items-center text-center relative bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
              {/* Initials-based Avatar badge */}
              <div className="relative w-20 h-20 rounded-2xl border-2 border-[#00f5ff]/40 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 flex items-center justify-center font-display font-black text-2xl text-[#00f5ff] shadow-[0_0_20px_rgba(0,245,255,0.15)] mb-5 select-none">
                {name.slice(0, 2).toUpperCase() || "U"}
              </div>

              {isEditingProfile ? (
                <div className="w-full space-y-3.5 mt-1 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Display Name</label>
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="input-minimal w-full px-3 py-1.5 text-xs bg-white/[0.03] border-white/[0.08]"
                      placeholder="Display Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="input-minimal w-full px-3 py-1.5 text-xs bg-white/[0.03] border-white/[0.08]"
                      placeholder="Email Address"
                    />
                  </div>
                  <div className="flex justify-center gap-2 pt-2 select-none">
                    <button
                      onClick={saveProfileEdit}
                      className="px-4 py-2 rounded-xl bg-[#00f5ff] text-[#050811] text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.04] text-white/50 border border-white/[0.06] text-[10px] font-bold tracking-wider uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-display font-bold text-lg text-white tracking-tight">
                    {name}
                  </h2>
                  <p className="text-white/40 text-xs mt-1 leading-none font-medium mb-5">
                    {email}
                  </p>
                </>
              )}

              {/* Edit Profile & Account Security Row */}
              {!isEditingProfile && (
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      setTempName(name);
                      setTempEmail(email);
                      setIsEditingProfile(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-white/70 hover:text-white transition-all text-xs font-semibold tracking-wide cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-white/70 hover:text-white hover:bg-white/[0.05] text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer">
                    <Shield className="w-3.5 h-3.5 text-white/50" />
                    <span>Security</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats Card */}
            <div className="card-surface p-6 flex flex-col relative bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
              <h3 className="font-display font-bold text-sm text-white/90 tracking-wide mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.02]">
                  <span className="text-xs text-white/40 font-medium">Sync Status</span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 select-none animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.02]">
                  <span className="text-xs text-white/40 font-medium">Intelligence Level</span>
                  <span className="text-xs text-white/80 font-bold select-none">V4.2 Pro</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40 font-medium">Last Optimization</span>
                  <span className="text-xs text-white/80 font-semibold select-none">2h ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Behavioral Adjustments */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* AI Behavioral Adjustments */}
            <div className="card-surface p-6 flex flex-col relative bg-gradient-to-b from-[#151c2c80] to-[#0e142280] border border-white/[0.06] rounded-2xl transition-all duration-300">
              <div className="flex items-center gap-2 mb-6 select-none text-white/90">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-sm tracking-wide">
                  AI Behavioral Adjustments
                </h3>
              </div>

              <div className="space-y-8">
                {/* Slider 1: Coach Aggressiveness */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-bold text-white/90">Coach Aggressiveness</h4>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        Determines how firm RISA is with habit reminders.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#00f5ff] select-none">
                      {aggressivenessPercent}
                    </span>
                  </div>

                  {/* Interactive slider component */}
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={aggressiveness === "low" ? 0 : aggressiveness === "balanced" ? 1 : 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setAggressiveness(val === 0 ? "low" : val === 1 ? "balanced" : "high");
                      }}
                      className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-[#00f5ff] focus:outline-none"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase mt-2.5 px-0.5 select-none">
                      <span className={aggressiveness === "low" ? "text-cyan-400" : ""}>Passive</span>
                      <span className={aggressiveness === "balanced" ? "text-cyan-400" : ""}>Encouraging</span>
                      <span className={aggressiveness === "high" ? "text-cyan-400" : ""}>Unyielding</span>
                    </div>
                  </div>
                </div>

                {/* Slider 2: Insight Frequency */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-bold text-white/90">Insight Frequency</h4>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        How often the system surfaces behavioral patterns.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#00f5ff] select-none">
                      {frequencyLabel}
                    </span>
                  </div>

                  <div className="relative pt-1">
                    <input
                      type="range"
                      min="0"
                      max="2"
                      value={tone === "supportive" ? 0 : tone === "neutral" ? 1 : 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTone(val === 0 ? "supportive" : val === 1 ? "neutral" : "direct");
                      }}
                      className="w-full h-1 bg-white/[0.06] rounded-lg appearance-none cursor-pointer accent-[#00f5ff] focus:outline-none"
                    />
                    <div className="flex justify-between text-[9px] font-bold text-white/30 uppercase mt-2.5 px-0.5 select-none">
                      <span className={tone === "supportive" ? "text-cyan-400" : ""}>Low</span>
                      <span className={tone === "neutral" ? "text-cyan-400" : ""}>Medium</span>
                      <span className={tone === "direct" ? "text-cyan-400" : ""}>High</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions: Save and Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.04] select-none">
          <button
            type="button"
            onClick={logOut}
            className="text-xs text-red-400/50 hover:text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Account</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-white/20 text-white/70 hover:text-white transition-all text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer select-none"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white/50" />
              <span>Reset to Default</span>
            </button>

            <button
              onClick={() => handleSave()}
              className="bg-[#00f5ff] text-[#050811] hover:bg-[#00d8e2] font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(0,245,255,0.25)] transition-all cursor-pointer select-none"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Saved Successfully</span>
                </>
              ) : resetting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
