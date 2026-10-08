import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "manager" | "owner" | "tenant";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const user = { id: claims.sub, email: (claims.email as string | undefined) ?? "" };

  const [{ data: profile }, { data: managed }] = await Promise.all([
    supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("building_managers").select("building_id").eq("user_id", user.id),
  ]);

  return {
    supabase,
    user,
    role: (profile?.role ?? "tenant") as Role,
    fullName: (profile?.full_name ?? null) as string | null,
    managedBuildingIds: (managed ?? []).map((row) => row.building_id as string),
  };
});

export async function requireManager() {
  const current = await getCurrentUser();
  if (current.role !== "manager") {
    redirect("/requests");
  }
  return current;
}

export async function requireResident() {
  const current = await getCurrentUser();
  if (current.role === "manager") {
    redirect("/manage");
  }
  return current;
}
