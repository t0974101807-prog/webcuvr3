import React from "react";

export function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative group overflow-hidden active:scale-[0.98] ${
        active
          ? "bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-primary)] text-white shadow-[0_4px_12px_rgba(22,86,109,0.25)] border border-white/10"
          : "text-white/80 hover:bg-white/10 hover:text-white border border-transparent"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[var(--color-accent)] rounded-full" />
      )}
      {icon && (
        <span className={`transition-transform duration-300 ${active ? "text-[var(--color-accent)] scale-110" : "text-white/70 group-hover:text-white group-hover:scale-110"}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
        </span>
      )}
      <span className="transition-all duration-300 group-hover:translate-x-0.5">
        {label}
      </span>
    </button>
  );
}
