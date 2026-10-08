import { Logo } from "./logo";
import { NavLink } from "./nav-link";
import { UserMenu } from "./user-menu";

const LINKS = [
  { href: "/manage", icon: "dashboard", label: "Dashboard", exact: true },
  { href: "/manage/buildings", icon: "buildings", label: "Buildings", exact: false },
  { href: "/manage/requests", icon: "maintenance", label: "Maintenance", exact: false },
] as const;

export function ManagerShell({
  email,
  fullName,
  children,
}: {
  email: string;
  fullName: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo href="/manage" />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} icon={link.icon} exact={link.exact}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <UserMenu email={email} fullName={fullName} roleLabel="Building manager" />
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo href="/manage" />
          <div className="max-w-[60%]">
            <UserMenu email={email} fullName={fullName} roleLabel="Manager" />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} icon={link.icon} exact={link.exact} compact>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
