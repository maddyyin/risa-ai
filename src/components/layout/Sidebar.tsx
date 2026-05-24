"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart3, Settings, LogOut } from "lucide-react";
import { useHabitStore } from "@/store/habitStore";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const stats = useHabitStore((s) => s.stats);
  const { user, logOut } = useAuth();

  const displayName = user?.email?.split("@")[0] || "User";
  const firstLetter = (user?.email?.[0] || "U").toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-white/[0.06] bg-[#0a0a0f] relative z-20">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display font-bold text-xl tracking-tight text-white">
            RISA
          </span>
        </Link>
        <p className="text-white/30 text-xs mt-0.5">habit intelligence</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                isActive
                  ? "active text-white font-medium"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] ${
                  isActive ? "text-purple-400" : ""
                }`}
              />
              <span>{link.label}</span>
              {link.href === "/habits" && stats && stats.consistencyScore > 0 && (
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400">
                  {stats.consistencyScore}%
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-xs font-semibold text-purple-300 shrink-0">
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 truncate capitalize">
              {displayName}
            </p>
            <p className="text-white/30 text-[10px] truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logOut}
          title="Sign Out"
          className="p-1.5 rounded-md hover:bg-white/[0.04] text-white/40 hover:text-white/80 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
