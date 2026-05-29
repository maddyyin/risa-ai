"use client";

interface HeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-sidebar"));
    }
  };

  return (
    <header className="shrink-0 px-4 py-4 lg:px-8 lg:py-6 border-b border-white/[0.04] bg-[#050811]/95 backdrop-blur-md">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          {/* Hamburger menu button visible only on mobile */}
          <button
            onClick={openSidebar}
            className="p-2 -ml-2 rounded-lg hover:bg-white/[0.04] transition-colors lg:hidden text-white/70 hover:text-white cursor-pointer"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            {title && (
              <div className="font-display font-extrabold text-2xl lg:text-3xl tracking-tight text-white">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-white/40 text-xs lg:text-sm mt-0.5 lg:mt-1">{subtitle}</div>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-2 lg:gap-3.5">{children}</div>
        )}
      </div>
    </header>
  );
}
