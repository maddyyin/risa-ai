"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard" : "/signin";

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center select-none">
      <div className="max-w-xl space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <span>RISA</span>
        </div>

        {/* Hero title */}
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-white leading-[1.1]">
          Build{" "}
          <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            consistency.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-white/50 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          RISA quietly analyzes your behavioral patterns and helps you build stable, lifelong habits.
        </p>

        {/* CTA */}
        <div className="pt-4">
          <Link
            href={ctaHref}
            className="btn-primary inline-block px-8 py-3.5 text-sm select-none cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
