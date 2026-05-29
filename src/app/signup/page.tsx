"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, Loader2, KeyRound, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end validations
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // AppLayout's guard will automatically redirect to /dashboard once auth state changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Sign up error:", err);
      let friendlyMessage = "Failed to create account. Please try again.";
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak. Please use a stronger password.";
      }
      setError(friendlyMessage);
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm">
      {/* Background ambient glow */}
      <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="card-surface p-8 space-y-6 w-full rounded-2xl border border-white/[0.06] bg-[#151c2c]/50 backdrop-blur-md shadow-2xl relative animate-fade-in">
        <div className="space-y-1.5 text-center">
          <h1 className="font-display font-bold text-3xl tracking-tight bg-gradient-to-r from-white via-white to-blue-400 bg-clip-text text-transparent">
            RISA
          </h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-medium">
            Initialize Behavioral Engine
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="input-minimal w-full pl-10 pr-3 py-2 bg-white/[0.02] border-white/[0.06] text-sm focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="input-minimal w-full pl-10 pr-10 py-2 bg-white/[0.02] border-white/[0.06] text-sm focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="input-minimal w-full pl-10 pr-10 py-2 bg-white/[0.02] border-white/[0.06] text-sm focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 select-none cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Initializing engine...
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center border-t border-white/[0.04] pt-4">
          <p className="text-white/40 text-xs">
            Already registered?{" "}
            <Link href="/signin" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
