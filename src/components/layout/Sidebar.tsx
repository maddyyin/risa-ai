"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart3, Settings, X, User, Plus, HelpCircle, Brain } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreateHabitDialog } from "../habits/CreateHabitDialog";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/intelligence", label: "Intelligence", icon: Brain },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Profile", icon: User },
];

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const containerClass = isMobile
    ? "flex flex-col w-full h-full bg-[#050811] relative z-20"
    : "hidden lg:flex flex-col w-60 border-r border-white/[0.04] bg-[#050811] relative z-20 shrink-0";

  return (
    <aside className={containerClass}>
      {/* Logo Section */}
      <div className="px-6 pt-8 pb-6 flex flex-col justify-start">
        <Link href="/" className="flex items-center justify-between gap-2" onClick={onClose}>
          <span className="font-display font-black text-3xl tracking-tight text-white uppercase">
            RISA
          </span>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </Link>
        <p className="text-white/30 text-[10px] font-semibold tracking-wider uppercase mt-1">
          Habit Intelligence
        </p>
      </div>

      {/* Main Nav */}
      <nav className="px-3 py-4 space-y-1.5">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || (link.href !== "#" && pathname.startsWith(link.href + "/"));
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#00f5ff] text-[#050811] shadow-[0_0_16px_rgba(0,245,255,0.3)] font-semibold"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${
                  isActive ? "text-[#050811]" : "text-white/40"
                }`}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-6 mt-auto space-y-4 border-t border-white/[0.04]">
        {/* Create Habit button */}
        <CreateHabitDialog
          trigger={
            <button className="w-full bg-[#00f5ff] text-[#050811] hover:bg-[#00d8e2] font-bold text-sm py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all cursor-pointer">
              <Plus className="w-4 h-4 stroke-[3]" />
              New Habit
            </button>
          }
        />

        {/* Support & Settings Links */}
        <div className="space-y-1">
          <Link
            href="#"
            className="sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-full text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all"
          >
            <HelpCircle className="w-[18px] h-[18px] text-white/40" />
            <span>Support</span>
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className={`sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all ${
              pathname === "/settings"
                ? "bg-[#00f5ff] text-[#050811] shadow-[0_0_16px_rgba(0,245,255,0.3)] font-semibold"
                : "text-white/50 hover:text-white/80 hover:bg-white/[0.03]"
            }`}
          >
            <Settings className="w-[18px] h-[18px] text-white/40" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
