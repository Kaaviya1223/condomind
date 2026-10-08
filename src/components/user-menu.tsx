import { LogOut } from "lucide-react";

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : source.slice(0, 2);
  return letters.toUpperCase();
}

export function UserMenu({
  email,
  fullName,
  roleLabel,
}: {
  email: string;
  fullName: string | null;
  roleLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {initials(fullName, email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{fullName || email}</p>
        <p className="truncate text-xs text-slate-500">{roleLabel}</p>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          title="Sign out"
          className="flex items-center gap-1 rounded-lg p-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}
