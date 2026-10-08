import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "manager" | "owner" | "tenant";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    role: (profile?.role ?? "tenant") as Role,
    fullName: (profile?.full_name ?? null) as string | null,
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
