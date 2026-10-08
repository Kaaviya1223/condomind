import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import {
  cardClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  linkClass,
  secondaryButtonClass,
} from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { UNIT_STATUSES, label } from "@/lib/labels";
import {
  createUnit,
  deleteBuilding,
  inviteManager,
  removeManager,
  updateBuilding,
} from "../../actions";

export default async function BuildingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  if (!isUuid(params.id)) notFound();
  const { supabase, user } = await requireManager();

  const [{ data: building }, { data: units }, { data: managers }] = await Promise.all([
    supabase.from("buildings").select("id, name, address").eq("id", params.id).maybeSingle(),
    supabase
      .from("units")
      .select("id, unit_no, floor_area_sqft, share_units, status, owners(count), tenants(count)")
      .eq("building_id", params.id)
      .order("unit_no"),
    supabase
      .from("building_managers")
      .select("user_id, created_at, profiles(full_name)")
      .eq("building_id", params.id)
      .order("created_at"),
  ]);

  if (!building) notFound();

  return (
    <>
      <div>
        <Link href="/manage" className={`${linkClass} text-sm`}>
          ← All buildings
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{building.name}</h1>
        <p className="text-gray-500">{building.address}</p>
      </div>
      <Flash searchParams={searchParams} />

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Units</h2>
        {units?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Unit</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Area (sq ft)</th>
                  <th className="py-2 pr-4">Share units</th>
                  <th className="py-2 pr-4">Owners</th>
                  <th className="py-2 pr-4">Tenants</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-t border-gray-500/20">
                    <td className="py-2 pr-4">
                      <Link href={`/manage/units/${unit.id}`} className={linkClass}>
                        {unit.unit_no}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{label(unit.status)}</td>
                    <td className="py-2 pr-4">{unit.floor_area_sqft ?? "–"}</td>
                    <td className="py-2 pr-4">{unit.share_units ?? "–"}</td>
                    <td className="py-2 pr-4">
                      {(unit.owners as unknown as { count: number }[])[0]?.count ?? 0}
                    </td>
                    <td className="py-2 pr-4">
                      {(unit.tenants as unknown as { count: number }[])[0]?.count ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No units yet.</p>
        )}

        <form action={createUnit} className="mt-6 grid gap-4 sm:grid-cols-5 sm:items-end">
          <input type="hidden" name="building_id" value={building.id} />
          <div className="space-y-1">
            <label htmlFor="unit_no" className={labelClass}>Unit no.</label>
            <input id="unit_no" name="unit_no" required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" name="status" className={inputClass} defaultValue="occupied">
              {UNIT_STATUSES.map((status) => (
                <option key={status} value={status}>{label(status)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="floor_area_sqft" className={labelClass}>Area (sq ft)</label>
            <input id="floor_area_sqft" name="floor_area_sqft" type="number" min="0" step="any" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="share_units" className={labelClass}>Share units</label>
            <input id="share_units" name="share_units" type="number" min="0" step="any" defaultValue="1" className={inputClass} />
          </div>
          <div>
            <SubmitButton label="Add unit" pendingLabel="Adding..." />
          </div>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Managers</h2>
        <ul className="space-y-2">
          {(managers ?? []).map((manager) => {
            const profile = manager.profiles as unknown as { full_name: string | null } | null;
            const isYou = manager.user_id === user.id;
            return (
              <li key={manager.user_id} className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {profile?.full_name || "Unnamed manager"}
                  {isYou && <span className="text-gray-500"> (you)</span>}
                </span>
                {(managers?.length ?? 0) > 1 && (
                  <form action={removeManager}>
                    <input type="hidden" name="building_id" value={building.id} />
                    <input type="hidden" name="user_id" value={manager.user_id} />
                    <SubmitButton
                      label={isYou ? "Leave" : "Remove"}
                      className={dangerButtonClass}
                      confirmMessage={
                        isYou
                          ? "Stop managing this building?"
                          : "Remove this manager from the building?"
                      }
                    />
                  </form>
                )}
              </li>
            );
          })}
        </ul>

        <form action={inviteManager} className="mt-6 space-y-2">
          <input type="hidden" name="building_id" value={building.id} />
          <label htmlFor="invite_email" className={labelClass}>Add a manager by email</label>
          <div className="flex flex-wrap gap-2">
            <input
              id="invite_email"
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className={`${inputClass} max-w-sm`}
            />
            <SubmitButton
              label="Add manager"
              pendingLabel="Adding..."
              confirmMessage="This person becomes a manager. If they are an owner or tenant, they lose that role. Continue?"
            />
          </div>
          <p className="text-xs text-gray-500">
            The person must already have a confirmed CondoMind account.
          </p>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Building details</h2>
        <form action={updateBuilding} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={building.id} />
          <div className="space-y-1">
            <label htmlFor="b_name" className={labelClass}>Name</label>
            <input id="b_name" name="name" defaultValue={building.name} required className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="b_address" className={labelClass}>Address</label>
            <input id="b_address" name="address" defaultValue={building.address} required className={inputClass} />
          </div>
          <div>
            <SubmitButton label="Save" pendingLabel="Saving..." className={secondaryButtonClass} />
          </div>
        </form>
        <form action={deleteBuilding} className="mt-6">
          <input type="hidden" name="id" value={building.id} />
          <SubmitButton
            label="Delete building"
            pendingLabel="Deleting..."
            className={dangerButtonClass}
            confirmMessage="Delete this building with all its units, owners, tenants and maintenance requests? This cannot be undone."
          />
        </form>
      </section>
    </>
  );
}
