"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Target, BarChart3, Settings } from "lucide-react";

const mobileLinks = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden shrink-0 pb-6 px-4 bg-[#0a0a0f] relative z-40">
      <div className="card-surface-flat p-1.5 flex items-center justify-around">
        {mobileLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                isActive ? "bg-purple-500/15" : ""
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-purple-400" : "text-white/40"
                }`}
              />
              <span
                className={`text-[10px] ${
                  isActive
                    ? "text-purple-400 font-medium"
                    : "text-white/40"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
