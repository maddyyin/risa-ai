"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Header } from "@/components/layout/Header";
import { Sparkles, Bell, Send, User, Brain, Volume2, ShieldAlert, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function IntelligencePage() {
  const { chatMessages, chatLoading, sendChatMessage, fetchChatHistory, clearChatHistory } = useHabitStore();
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("Sahil");
  const [focusEnabled, setFocusEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestion chips
  const suggestions = [
    "Plan my evening",
    "Review my week",
    "Set new habit",
    "Analyze focus",
  ];

  // Load history on mount
  useEffect(() => {
    fetchChatHistory();
    
    // Load display name from settings
    async function loadSettings() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch("/api/settings", {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.name) setUserName(data.name);
        }
      } catch (e) {
        console.warn("Failed to load settings in intelligence page:", e);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadSettings();
      }
    });

    return () => unsubscribe();
  }, [fetchChatHistory]);

  // Robust function to scroll to bottom
  const scrollToBottom = (behavior: "smooth" | "instant" = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Scroll on message list changes and on initial mount
  useEffect(() => {
    // Scroll immediately
    scrollToBottom("instant");

    // Scroll after a tiny delay to allow layout adjustments
    const timer = setTimeout(() => {
      scrollToBottom("instant");
    }, 150);

    return () => clearTimeout(timer);
  }, [chatMessages]);

  // Scroll when AI starts loading typing bubble
  useEffect(() => {
    if (chatLoading) {
      scrollToBottom("smooth");
    }
  }, [chatLoading]);

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear your chat history? This cannot be undone.")) {
      await clearChatHistory();
    }
  };

  const handleSend = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const msgToSend = customMsg || input;
    if (!msgToSend.trim() || chatLoading) return;
    
    setInput("");
    await sendChatMessage(msgToSend.trim());
  };

  const handleSuggestionClick = (sug: string) => {
    handleSend(undefined, sug);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#050811] overflow-hidden">
      
      {/* Header matching Image 1 */}
      <Header
        title={
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 select-none animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            RISA AI Companion
          </span>
        }
      >
        <div className="flex items-center gap-2 lg:gap-3.5 select-none">
          {/* Clear Chat Button */}
          <button 
            onClick={handleClearHistory}
            className="p-2.5 rounded-xl bg-[#151c2c]/40 border border-white/[0.04] text-white/50 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/35 transition-all cursor-pointer relative"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Bell Icon */}
          <button className="p-2.5 rounded-full bg-[#151c2c]/40 border border-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </button>

          {/* User Avatar Initials Badge */}
          <div className="w-9 h-9 rounded-xl border border-white/[0.08] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 flex items-center justify-center font-display font-black text-xs text-[#00f5ff] shadow-[0_0_8px_rgba(0,245,255,0.1)] select-none uppercase">
            {userName.slice(0, 2).toUpperCase() || "U"}
          </div>
        </div>
      </Header>

      {/* Main chat window container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 min-h-0 relative">
        
        {/* Scrollable conversation thread */}
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto pr-1 space-y-8 scrollbar-none mb-6 min-h-0"
        >
          {/* Top welcome landing in the chat */}
          <div className="flex flex-col items-center text-center mt-4 mb-8 select-none">
            <div className="relative w-28 h-28 rounded-full border border-[#00f5ff]/20 flex items-center justify-center bg-gradient-to-b from-[#15233c]/40 to-[#0e1422]/20 p-2 shadow-[0_0_24px_rgba(0,245,255,0.08)]">
              {/* Central glowing AI head avatar representation */}
              <div className="w-full h-full rounded-full overflow-hidden border border-[#00f5ff]/35 relative bg-slate-950 flex items-center justify-center">
                <Brain className="w-12 h-12 text-[#00f5ff] stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-1 bg-[#151c2c] border border-white/[0.08] text-[#00f5ff] font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-full shadow-lg">
                SYSTEM ONLINE
              </div>
            </div>
            
            <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight mt-5">
              Welcome back, {userName}.
            </h2>
            <p className="text-white/40 text-xs mt-1.5 font-medium max-w-[340px]">
              I've been analyzing your recent patterns. Ready to optimize your evening flow?
            </p>
          </div>

          {/* Conversation history thread */}
          <div className="space-y-6">
            
            {/* 1. MOCK INITIAL CONVERSATION (to match mockup Image 1 out-of-the-box) */}
            {/* AI message */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#151c2c] border border-white/[0.08] flex items-center justify-center text-[#00f5ff] shrink-0 shadow-md">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-[80%]">
                <div className="bg-[#151c2c]/40 border border-white/[0.04] px-4 py-3 rounded-2xl rounded-tl-none text-xs text-white/95 leading-relaxed font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  I've noticed your consistency in <strong className="text-[#00f5ff] font-semibold">"Get up early"</strong> is strong. You've hit 12 days in a row! Let's build on that today. How can I assist you?
                </div>
                <span className="text-[9px] text-white/30 font-bold px-1 select-none">
                  RISA • 10:24 AM
                </span>
              </div>
            </div>

            {/* User message */}
            <div className="flex items-start justify-end gap-4">
              <div className="flex flex-col gap-1.5 max-w-[80%] items-end">
                <div className="bg-[#15233c]/85 border border-[#00f5ff]/20 px-4 py-3 rounded-2xl rounded-tr-none text-xs text-white/95 leading-relaxed font-medium shadow-[0_4px_12px_rgba(0,245,255,0.04)]">
                  Analyze my focus today.
                </div>
                <span className="text-[9px] text-white/30 font-bold px-1 select-none">
                  {userName} • 10:25 AM
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#15233c] border border-white/[0.08] flex items-center justify-center font-display font-bold text-[10px] text-[#00f5ff] shrink-0 shadow-md select-none uppercase">
                {userName.slice(0, 2).toUpperCase() || "U"}
              </div>
            </div>

            {/* AI message with custom Focus optimizer widget */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[#151c2c] border border-white/[0.08] flex items-center justify-center text-[#00f5ff] shrink-0 shadow-md">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-[80%]">
                <div className="bg-[#151c2c]/40 border border-white/[0.04] px-4 py-4 rounded-2xl rounded-tl-none space-y-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Analyzing Metrics...
                  </div>
                  
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    Your focus score is currently <strong className="text-[#00f5ff] font-semibold">75/100</strong>. Your peak cognitive window was between 9:00 AM and 10:30 AM. You might want to prioritize <strong className="text-purple-400 font-semibold">"Complex Problem Solving"</strong> tasks now before your afternoon dip.
                  </p>

                  {/* Focus Optimizer interactive card inside message */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-white/50">
                      <Volume2 className="w-4 h-4 text-white/40" />
                      <span>Optimize deep work session?</span>
                    </div>
                    
                    <button
                      onClick={() => setFocusEnabled(!focusEnabled)}
                      className={`text-[10px] font-bold tracking-wide uppercase px-4 py-2 rounded-lg shadow-md transition-all duration-300 cursor-pointer ${
                        focusEnabled 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/15"
                      }`}
                    >
                      {focusEnabled ? "Focus Enabled" : "Enable Focus"}
                    </button>
                  </div>
                </div>
                <span className="text-[9px] text-white/30 font-bold px-1 select-none">
                  RISA • 10:25 AM
                </span>
              </div>
            </div>

            {/* 2. DYNAMIC DATABASE HISTORY CONVERSATION */}
            {chatMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex items-start gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#151c2c] border border-white/[0.08] flex items-center justify-center text-[#00f5ff] shrink-0 shadow-md">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                )}

                <div className={`flex flex-col gap-1.5 max-w-[80%] ${msg.role === "user" ? "items-end" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-medium shadow-md ${
                    msg.role === "user" 
                      ? "bg-[#15233c]/85 border border-[#00f5ff]/20 rounded-tr-none text-white/95 shadow-[0_4px_12px_rgba(0,245,255,0.04)]"
                      : "bg-[#151c2c]/40 border border-white/[0.04] rounded-tl-none text-white/95"
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-white/30 font-bold px-1 select-none">
                    {msg.role === "user" ? userName : "RISA"} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-[#15233c] border border-white/[0.08] flex items-center justify-center font-display font-bold text-[10px] text-[#00f5ff] shrink-0 shadow-md select-none uppercase">
                    {userName.slice(0, 2).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Loader bubble */}
            {chatLoading && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#151c2c] border border-white/[0.08] flex items-center justify-center text-[#00f5ff] shrink-0 shadow-md">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
                <div className="bg-[#151c2c]/40 border border-white/[0.04] px-4 py-3 rounded-2xl rounded-tl-none max-w-[80px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#00f5ff]/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-[#00f5ff]/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-[#00f5ff]/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}

            {/* Anchor ref for scrolling to bottom */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Suggestion Chips Row */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-none shrink-0 py-1 mb-3 select-none">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              disabled={chatLoading}
              onClick={() => handleSuggestionClick(sug)}
              className="text-[10px] font-bold tracking-wide uppercase px-4 py-2.5 rounded-full bg-white/[0.01] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.03] hover:border-white/[0.12] transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Input form matching Image 1 */}
        <form 
          onSubmit={handleSend}
          className="flex items-center gap-3 shrink-0 select-none bg-gradient-to-r from-[#151c2c40] to-[#0e142240] p-1.5 rounded-2xl border border-white/[0.06] shadow-md focus-within:border-[#00f5ff]/25 transition-all duration-300"
        >
          <div className="flex-1 flex items-center relative pl-3">
            <Sparkles className="w-4 h-4 text-white/20 shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell RISA what's on your mind..."
              disabled={chatLoading}
              className="w-full bg-transparent border-0 outline-none text-xs text-white placeholder-white/30 px-3.5 py-3.5 focus:ring-0 focus:outline-none"
            />
          </div>
          
          <button
            type="submit"
            disabled={chatLoading || !input.trim()}
            className="w-10 h-10 rounded-full bg-[#00f5ff] hover:bg-[#00d8e2] text-[#050811] flex items-center justify-center transition-all cursor-pointer font-bold disabled:opacity-30 shadow-[0_0_12px_rgba(0,245,255,0.2)] shrink-0 disabled:pointer-events-none"
          >
            <Send className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
        </form>

      </div>
    </div>
  );
}
