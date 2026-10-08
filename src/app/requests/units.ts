import type { SupabaseClient } from "@supabase/supabase-js";

export type ResidentUnit = {
  id: string;
  unit_no: string;
  buildingName: string;
};

export async function getResidentUnits(
  supabase: SupabaseClient,
  userId: string
): Promise<ResidentUnit[]> {
  const [{ data: owners }, { data: tenants }] = await Promise.all([
    supabase.from("owners").select("unit_id").eq("user_id", userId),
    supabase.from("tenants").select("unit_id").eq("user_id", userId),
  ]);

  const unitIds = Array.from(
    new Set(
      [...(owners ?? []), ...(tenants ?? [])]
        .map((row) => row.unit_id as string | null)
        .filter((id): id is string => !!id)
    )
  );
  if (!unitIds.length) return [];

  const { data: units } = await supabase
    .from("units")
    .select("id, unit_no, buildings(name)")
    .in("id", unitIds)
    .order("unit_no");

  return (units ?? []).map((unit) => ({
    id: unit.id as string,
    unit_no: unit.unit_no as string,
    buildingName:
      (unit.buildings as unknown as { name: string } | null)?.name ?? "",
  }));
}
