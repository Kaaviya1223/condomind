import { AppHeader } from "@/components/app-header";
import { requireResident } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, fullName } = await requireResident();

  return (
    <>
      <AppHeader email={user.email ?? ""} fullName={fullName} role={role} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">{children}</main>
    </>
  );
}
