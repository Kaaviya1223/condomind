import { ResidentShell } from "@/components/resident-shell";
import { requireResident } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, fullName } = await requireResident();

  return (
    <ResidentShell
      email={user.email ?? ""}
      fullName={fullName}
      roleLabel={role === "owner" ? "Owner" : "Tenant"}
    >
      {children}
    </ResidentShell>
  );
}
