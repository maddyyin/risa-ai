"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  const isLandingPage = pathname === "/";

  // Close sidebar on route change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!loading) {
      if (!user && !isAuthPage && !isLandingPage) {
        router.push("/signin");
      } else if (user && (isAuthPage || isLandingPage)) {
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
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0a0a0f] border-r border-white/[0.06] transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden shrink-0 sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/[0.04] transition-colors"
              aria-label="Open navigation"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-display font-bold text-sm tracking-tight text-white">
              RISA
            </span>
            <div className="w-9" />
          </div>
        </div>

        {children}
        <MobileNav />
      </div>
    </div>
  );
}
