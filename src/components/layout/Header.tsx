"use client";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <header className="shrink-0 px-6 lg:px-8 py-5 lg:py-6 border-b border-white/[0.06]">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          {title && (
            <h1 className="font-display font-bold text-2xl tracking-tight text-white">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-3">{children}</div>
        )}
      </div>
    </header>
  );
}
