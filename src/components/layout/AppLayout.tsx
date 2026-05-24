"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isLandingPage = pathname === "/";

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage && !isLandingPage) {
        router.push("/signin");
      } else if (user && (isAuthPage || isLandingPage)) {
        // Redirect to dashboard if logged in user lands on signin, signup, or root landing page
        router.push("/dashboard");
      }
    }
  }, [user, loading, isAuthPage, isLandingPage, router]);

  // Loading state with dynamic premium styling
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-purple-500/20 border-t-purple-500 animate-spin" />
          <span className="absolute text-[8px] font-semibold text-purple-400 uppercase tracking-widest animate-pulse">
            RISA
          </span>
        </div>
      </div>
    );
  }

  // Prevent UI flashing during redirect
  if (!user && !isAuthPage && !isLandingPage) {
    return <div className="min-h-screen bg-[#0a0a0f]" />;
  }

  if (isAuthPage || (isLandingPage && !user)) {
    return (
      <div className="min-h-screen flex bg-[#0a0a0f] text-white w-full items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {children}
        <MobileNav />
      </div>
    </div>
  );
}
