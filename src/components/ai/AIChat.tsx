"use client";

import { useEffect, useRef, useState } from "react";
import { useHabitStore } from "@/store/habitStore";
import { Send, Sparkles } from "lucide-react";

const placeholders = [
  "Ask RISA about your habits...",
  "Why do I procrastinate on Gym?",
  "How can I improve consistency?",
  "Why do I skip coding on weekends?",
  "What is my focus score telling me?",
];

const suggestions = [
  "Why do I procrastinate?",
  "How can I improve consistency?",
  "Why do I skip workouts?",
];

export function AIChat() {
  const { chatMessages, chatLoading, sendChatMessage, fetchChatHistory } = useHabitStore();
  const [input, setInput] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Rotate placeholders every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;
    const msg = input;
    setInput("");
    await sendChatMessage(msg);
  };

  const handleSuggestionClick = async (text: string) => {
    if (chatLoading) return;
    await sendChatMessage(text);
  };

  return (
    <div className="card-surface p-4 flex flex-col h-[380px]">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-3 shrink-0">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="font-display font-semibold text-sm text-white">Ask RISA</span>
        <span className="text-[10px] text-white/30 ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
          coach is online
        </span>
      </div>

      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1 space-y-3 mb-3 scrollbar-thin">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
              Ask me about your habits, consistency, routines, or productivity patterns.
            </p>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user" ? "chat-user text-purple-200" : "chat-ai text-white/90"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="chat-ai px-3.5 py-2.5 max-w-[85%]">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="flex gap-1.5 mb-2.5 overflow-x-auto scrollbar-none shrink-0 py-0.5">
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            disabled={chatLoading}
            onClick={() => handleSuggestionClick(sug)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white/90 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[placeholderIdx]}
          disabled={chatLoading}
          className="input-minimal flex-1 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40 bg-white/[0.03] border-white/[0.08] transition-all"
        />
        <button
          type="submit"
          disabled={chatLoading || !input.trim()}
          className="btn-primary p-2 flex items-center justify-center w-9 h-9 shrink-0 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
