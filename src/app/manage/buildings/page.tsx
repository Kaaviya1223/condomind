import Link from "next/link";
import { Building, ChevronRight, MapPin, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { buttonClass, cardClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";

export default async function BuildingsPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, managedBuildingIds: buildingIds } = await requireManager();

  const { data: buildings, error } = buildingIds.length
    ? await supabase
        .from("buildings")
        .select("id, name, address, units(count)")
        .in("id", buildingIds)
        .order("name")
    : { data: [], error: null };

  const addButton = (
    <Link href="/manage/buildings/new" className={buttonClass}>
      <Plus className="h-4 w-4" /> Add building
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Buildings"
        description="The buildings you manage. Open one to manage its units, residents and managers."
        actions={buildings?.length ? addButton : undefined}
      />
      <Flash searchParams={searchParams} />
      {error && <Flash searchParams={{ error: error.message }} />}

      {buildings?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((building) => {
            const units = (building.units as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <li key={building.id}>
                <Link
                  href={`/manage/buildings/${building.id}`}
                  className={`${cardClass} group flex h-full flex-col p-5 transition hover:border-indigo-300 hover:shadow`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Building className="h-5 w-5" />
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" />
                  </div>
                  <p className="mt-4 font-semibold text-slate-900">{building.name}</p>
                  <p className="mt-1 flex items-start gap-1 text-sm text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {building.address}
                  </p>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    {units} unit{units === 1 ? "" : "s"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Building} title="No buildings yet" action={addButton}>
          Add a building you manage to start tracking its units, residents and maintenance.
        </EmptyState>
      )}
    </>
  );
}
