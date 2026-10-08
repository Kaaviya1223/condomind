import { ManagerShell } from "@/components/manager-shell";
import { requireManager } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, fullName } = await requireManager();

  return (
    <ManagerShell email={user.email ?? ""} fullName={fullName}>
      {children}
    </ManagerShell>
  );
}
