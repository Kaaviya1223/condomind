"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building, ClipboardList, LayoutDashboard, Wrench } from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  buildings: Building,
  maintenance: Wrench,
  requests: ClipboardList,
};

export type NavIcon = keyof typeof ICONS;

export function NavLink({
  href,
  icon,
  children,
  exact = false,
  compact = false,
}: {
  href: string;
  icon: NavIcon;
  children: React.ReactNode;
  exact?: boolean;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICONS[icon];

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 whitespace-nowrap rounded-lg text-sm font-medium transition-colors ${
        compact ? "px-3 py-1.5" : "px-3 py-2"
      } ${
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
      {children}
    </Link>
  );
}
