import Link from "next/link";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { createBuilding } from "./actions";

export default async function ManageHome({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, user } = await requireManager();

  const { data: links } = await supabase
    .from("building_managers")
    .select("building_id")
    .eq("user_id", user.id);
  const buildingIds = (links ?? []).map((link) => link.building_id);

  const { data: buildings, error } = buildingIds.length
    ? await supabase
        .from("buildings")
        .select("id, name, address, units(count)")
        .in("id", buildingIds)
        .order("name")
    : { data: [], error: null };

  return (
    <>
      <h1 className="text-2xl font-bold">Your buildings</h1>
      <Flash searchParams={searchParams} />
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {buildings?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {buildings.map((building) => (
            <li key={building.id}>
              <Link
                href={`/manage/buildings/${building.id}`}
                className={`${cardClass} block hover:border-blue-500`}
              >
                <p className="font-semibold">{building.name}</p>
                <p className="text-sm text-gray-500">{building.address}</p>
                <p className="mt-2 text-sm">
                  {(building.units as unknown as { count: number }[])[0]?.count ?? 0} units
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">You do not manage any buildings yet.</p>
      )}

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Add a building</h2>
        <form action={createBuilding} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="name" className={labelClass}>Name</label>
            <input id="name" name="name" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="address" className={labelClass}>Address</label>
            <input id="address" name="address" required className={inputClass} />
          </div>
          <div>
            <SubmitButton label="Add building" pendingLabel="Adding..." />
          </div>
        </form>
      </section>
    </>
  );
}
