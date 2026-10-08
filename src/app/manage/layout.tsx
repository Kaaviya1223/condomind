import { AppHeader } from "@/components/app-header";
import { requireManager } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, fullName } = await requireManager();

  return (
    <>
      <AppHeader email={user.email ?? ""} fullName={fullName} role={role} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">{children}</main>
    </>
  );
}
