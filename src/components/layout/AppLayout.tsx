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

  // Listen for open-sidebar event from headers
  useEffect(() => {
    const handleOpen = () => setSidebarOpen(true);
    window.addEventListener("open-sidebar", handleOpen);
    return () => window.removeEventListener("open-sidebar", handleOpen);
  }, []);

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
      <div className="min-h-screen flex flex-col bg-[#050811] text-white items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-blue-500/20 border-t-blue-500 animate-spin" />
          <span className="absolute text-[8px] font-semibold text-blue-400 uppercase tracking-widest animate-pulse">
            RISA
          </span>
        </div>
      </div>
    );
  }

  // Prevent UI flashing during redirect
  if (!user && !isAuthPage && !isLandingPage) {
    return <div className="min-h-screen bg-[#050811]" />;
  }

  if (isAuthPage || (isLandingPage && !user)) {
    return (
      <div className="min-h-screen flex bg-[#050811] text-white w-full items-center justify-center p-4">
        {children}
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] flex bg-[#050811] text-white overflow-hidden">
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#050811] border-r border-white/[0.06] transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isMobile onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
          {children}
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
