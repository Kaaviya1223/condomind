import Link from "next/link";
import type { Role } from "@/lib/auth";

const LINKS: Record<Role, { href: string; label: string }[]> = {
  manager: [
    { href: "/manage", label: "Buildings" },
    { href: "/manage/requests", label: "Maintenance" },
  ],
  owner: [{ href: "/requests", label: "My requests" }],
  tenant: [{ href: "/requests", label: "My requests" }],
};

export function AppHeader({
  email,
  fullName,
  role,
}: {
  email: string;
  fullName: string | null;
  role: Role;
}) {
  return (
    <header className="border-b border-gray-500/30">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            CondoMind
          </Link>
          <nav className="flex gap-4 text-sm">
            {LINKS[role].map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {fullName ? `${fullName} · ` : ""}
            {email}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded border border-gray-400 px-3 py-1 text-sm hover:bg-gray-500/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
