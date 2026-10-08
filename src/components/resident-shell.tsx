import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

export function ResidentShell({
  email,
  fullName,
  roleLabel,
  children,
}: {
  email: string;
  fullName: string | null;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo href="/requests" />
          <div className="max-w-[60%] sm:max-w-xs">
            <UserMenu email={email} fullName={fullName} roleLabel={roleLabel} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
