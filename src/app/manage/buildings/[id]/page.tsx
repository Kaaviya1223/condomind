import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, DoorOpen, MapPin, UserPlus } from "lucide-react";
import { CollapsibleForm } from "@/components/collapsible-form";
import { EmptyState } from "@/components/empty-state";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Tabs } from "@/components/tabs";
import {
  cardClass,
  dangerButtonClass,
  hintClass,
  inputClass,
  labelClass,
} from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { isUuid, oneOf } from "@/lib/form";
import { UNIT_STATUSES, label } from "@/lib/labels";
import {
  createUnit,
  deleteBuilding,
  inviteManager,
  removeManager,
  updateBuilding,
} from "../../actions";

const TABS = ["units", "managers", "settings"] as const;

const UNIT_STATUS_STYLES: Record<string, string> = {
  occupied: "bg-green-50 text-green-700 ring-green-600/20",
  vacant: "bg-slate-100 text-slate-600 ring-slate-500/20",
  under_renovation: "bg-amber-50 text-amber-800 ring-amber-600/20",
};

function count(value: unknown) {
  return (value as { count: number }[] | null)?.[0]?.count ?? 0;
}

export default async function BuildingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { tab?: string; error?: string; message?: string };
}) {
  if (!isUuid(params.id)) notFound();
  const { supabase, user } = await requireManager();
  const tab = oneOf(searchParams.tab ?? "units", TABS) ?? "units";
  const base = `/manage/buildings/${params.id}`;

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
  const unitList = units ?? [];
  const managerList = managers ?? [];

  return (
    <>
      <PageHeader
        title={building.name}
        back={{ href: "/manage/buildings", label: "Buildings" }}
        description={
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {building.address}
          </span>
        }
      />

      <Tabs
        active={tab}
        tabs={[
          { key: "units", label: "Units", href: base, count: unitList.length },
          { key: "managers", label: "Managers", href: `${base}?tab=managers`, count: managerList.length },
          { key: "settings", label: "Settings", href: `${base}?tab=settings` },
        ]}
      />
      <Flash searchParams={searchParams} />

      {tab === "units" && (
        <div className="space-y-4">
          <CollapsibleForm
            label="Add a unit"
            description="Add each unit, then open it to add its owners and tenants."
            open={!unitList.length}
          >
            <form action={createUnit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="building_id" value={building.id} />
              <div className="space-y-1.5">
                <label htmlFor="unit_no" className={labelClass}>Unit number</label>
                <input id="unit_no" name="unit_no" required placeholder="e.g. A-12-03" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="status" className={labelClass}>Status</label>
                <select id="status" name="status" className={inputClass} defaultValue="occupied">
                  {UNIT_STATUSES.map((status) => (
                    <option key={status} value={status}>{label(status)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="floor_area_sqft" className={labelClass}>Floor area (sq ft)</label>
                <input id="floor_area_sqft" name="floor_area_sqft" type="number" min="0" step="any" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="share_units" className={labelClass}>Share units</label>
                <input id="share_units" name="share_units" type="number" min="0" step="any" defaultValue="1" className={inputClass} />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <SubmitButton label="Add unit" pendingLabel="Adding..." />
              </div>
            </form>
          </CollapsibleForm>

          {unitList.length ? (
            <div className={`${cardClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Unit</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Floor area</th>
                      <th className="px-5 py-3 font-medium">Owners</th>
                      <th className="px-5 py-3 font-medium">Tenants</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unitList.map((unit) => {
                      const status = unit.status ?? "occupied";
                      return (
                        <tr key={unit.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">
                            <Link href={`/manage/units/${unit.id}`} className="hover:text-indigo-600">
                              {unit.unit_no}
                            </Link>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${UNIT_STATUS_STYLES[status] ?? UNIT_STATUS_STYLES.vacant}`}>
                              {label(status)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            {unit.floor_area_sqft ? `${unit.floor_area_sqft} sq ft` : "–"}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{count(unit.owners)}</td>
                          <td className="px-5 py-3 text-slate-600">{count(unit.tenants)}</td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/manage/units/${unit.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              Manage <ChevronRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState icon={DoorOpen} title="No units yet">
              Use &ldquo;Add a unit&rdquo; above to add the first one.
            </EmptyState>
          )}
        </div>
      )}

      {tab === "managers" && (
        <div className="space-y-4">
          <div className={cardClass}>
            <ul className="divide-y divide-slate-100">
              {managerList.map((manager) => {
                const profile = manager.profiles as unknown as { full_name: string | null } | null;
                const isYou = manager.user_id === user.id;
                const name = profile?.full_name || "Unnamed manager";
                return (
                  <li key={manager.user_id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {name}
                          {isYou && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">You</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          Manager since{" "}
                          {manager.created_at
                            ? new Date(manager.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
                            : "–"}
                        </p>
                      </div>
                    </div>
                    {managerList.length > 1 && (
                      <form action={removeManager}>
                        <input type="hidden" name="building_id" value={building.id} />
                        <input type="hidden" name="user_id" value={manager.user_id} />
                        <SubmitButton
                          label={isYou ? "Leave" : "Remove"}
                          className={dangerButtonClass}
                          confirmMessage={isYou ? "Stop managing this building?" : `Remove ${name} as a manager of this building?`}
                        />
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <UserPlus className="h-4 w-4" />
              </span>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Invite a manager</h2>
                  <p className={hintClass}>
                    They need a confirmed CondoMind account first. If they are an owner or tenant, they become a manager instead.
                  </p>
                </div>
                <form action={inviteManager} className="flex flex-wrap gap-2">
                  <input type="hidden" name="building_id" value={building.id} />
                  <label htmlFor="invite_email" className="sr-only">Email</label>
                  <input
                    id="invite_email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className={`${inputClass} max-w-sm flex-1`}
                  />
                  <SubmitButton
                    label="Send invite"
                    pendingLabel="Adding..."
                    confirmMessage="This person becomes a manager. If they are an owner or tenant, they lose that role. Continue?"
                  />
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          <form action={updateBuilding} className={`${cardClass} max-w-2xl space-y-5 p-6`}>
            <input type="hidden" name="id" value={building.id} />
            <h2 className="font-semibold text-slate-900">Building details</h2>
            <div className="space-y-1.5">
              <label htmlFor="b_name" className={labelClass}>Building name</label>
              <input id="b_name" name="name" defaultValue={building.name} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="b_address" className={labelClass}>Address</label>
              <input id="b_address" name="address" defaultValue={building.address} required className={inputClass} />
            </div>
            <SubmitButton label="Save changes" pendingLabel="Saving..." />
          </form>

          <div className={`${cardClass} max-w-2xl border-red-200 p-6`}>
            <h2 className="font-semibold text-red-700">Delete building</h2>
            <p className="mt-1 text-sm text-slate-600">
              Permanently deletes this building with all its units, owners, tenants and maintenance requests.
            </p>
            <form action={deleteBuilding} className="mt-4">
              <input type="hidden" name="id" value={building.id} />
              <SubmitButton
                label="Delete building"
                pendingLabel="Deleting..."
                className={dangerButtonClass}
                confirmMessage="Delete this building with all its units, owners, tenants and maintenance requests? This cannot be undone."
              />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
