import { notFound } from "next/navigation";
import { Mail, Phone, Plus, Users } from "lucide-react";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import {
  cardClass,
  dangerButtonClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { UNIT_STATUSES, label } from "@/lib/labels";
import { deleteResident, deleteUnit, saveResident, updateUnit } from "../../actions";

type Resident = {
  id: string;
  full_name: string;
  ic_no: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
};

type ResidentTable = "owners" | "tenants";

function formatDay(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
    : "?";
}

function ResidentForm({
  table,
  unitId,
  resident,
}: {
  table: ResidentTable;
  unitId: string;
  resident?: Resident;
}) {
  const prefix = `${table}-${resident?.id ?? "new"}`;
  return (
    <form action={saveResident} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="unit_id" value={unitId} />
      {resident && <input type="hidden" name="id" value={resident.id} />}
      <div className="space-y-1.5">
        <label htmlFor={`${prefix}-name`} className={labelClass}>Full name</label>
        <input id={`${prefix}-name`} name="full_name" required defaultValue={resident?.full_name} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${prefix}-email`} className={labelClass}>Email</label>
        <input id={`${prefix}-email`} name="email" type="email" defaultValue={resident?.email ?? ""} className={inputClass} />
        <p className="text-xs text-slate-500">They get access when they sign up with this email.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${prefix}-phone`} className={labelClass}>Phone</label>
        <input id={`${prefix}-phone`} name="phone" type="tel" defaultValue={resident?.phone ?? ""} className={inputClass} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${prefix}-ic`} className={labelClass}>IC number</label>
        <input id={`${prefix}-ic`} name="ic_no" defaultValue={resident?.ic_no ?? ""} className={inputClass} />
      </div>
      {table === "tenants" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor={`${prefix}-start`} className={labelClass}>Lease start</label>
            <input id={`${prefix}-start`} name="lease_start" type="date" defaultValue={resident?.lease_start ?? ""} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${prefix}-end`} className={labelClass}>Lease end</label>
            <input id={`${prefix}-end`} name="lease_end" type="date" defaultValue={resident?.lease_end ?? ""} className={inputClass} />
          </div>
        </>
      )}
      <div className="sm:col-span-2">
        <SubmitButton
          label={resident ? "Save changes" : `Add ${table === "owners" ? "owner" : "tenant"}`}
          pendingLabel="Saving..."
        />
      </div>
    </form>
  );
}

function ResidentSection({
  title,
  table,
  unitId,
  residents,
}: {
  title: string;
  table: ResidentTable;
  unitId: string;
  residents: Resident[];
}) {
  const singular = table === "owners" ? "owner" : "tenant";
  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {residents.length}
          </span>
        </h2>
      </div>

      {residents.length ? (
        <ul className="divide-y divide-slate-100">
          {residents.map((resident) => (
            <li key={resident.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                    {resident.full_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                      {resident.full_name}
                      {resident.user_id ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Has account
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
                          Not signed up yet
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {resident.email && (
                        <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{resident.email}</span>
                      )}
                      {resident.phone && (
                        <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{resident.phone}</span>
                      )}
                      {!resident.email && !resident.phone && <span>No contact details</span>}
                    </div>
                    {table === "tenants" && (resident.lease_start || resident.lease_end) && (
                      <p className="text-sm text-slate-500">
                        Lease: {formatDay(resident.lease_start)} to {formatDay(resident.lease_end)}
                      </p>
                    )}
                  </div>
                </div>
                <form action={deleteResident}>
                  <input type="hidden" name="table" value={table} />
                  <input type="hidden" name="unit_id" value={unitId} />
                  <input type="hidden" name="id" value={resident.id} />
                  <SubmitButton
                    label="Remove"
                    className={dangerButtonClass}
                    confirmMessage={`Remove ${resident.full_name} from this unit?`}
                  />
                </form>
              </div>
              <details className="mt-3 pl-12">
                <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Edit details
                </summary>
                <div className="mt-4">
                  <ResidentForm table={table} unitId={unitId} resident={resident} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-6 text-sm text-slate-500">No {singular}s added yet.</p>
      )}

      <details className="border-t border-slate-200" open={!residents.length}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-medium text-indigo-600 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <Plus className="h-4 w-4" /> Add {table === "owners" ? "an owner" : "a tenant"}
        </summary>
        <div className="px-5 pb-5 pt-2">
          <ResidentForm table={table} unitId={unitId} />
        </div>
      </details>
    </section>
  );
}

export default async function UnitPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  if (!isUuid(params.id)) notFound();
  const { supabase } = await requireManager();

  const [{ data: unit }, { data: owners }, { data: tenants }] = await Promise.all([
    supabase
      .from("units")
      .select("id, building_id, unit_no, floor_area_sqft, share_units, status, buildings(name)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("owners")
      .select("id, full_name, ic_no, email, phone, user_id")
      .eq("unit_id", params.id)
      .order("created_at"),
    supabase
      .from("tenants")
      .select("id, full_name, ic_no, email, phone, user_id, lease_start, lease_end")
      .eq("unit_id", params.id)
      .order("created_at"),
  ]);

  if (!unit || !unit.building_id) notFound();
  const building = unit.buildings as unknown as { name: string } | null;
  const facts = [
    label(unit.status),
    unit.floor_area_sqft ? `${unit.floor_area_sqft} sq ft` : null,
    `${unit.share_units ?? 1} share units`,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title={`Unit ${unit.unit_no}`}
        back={{ href: `/manage/buildings/${unit.building_id}`, label: building?.name ?? "Building" }}
        description={facts.join(" · ")}
      />
      <Flash searchParams={searchParams} />

      <div className="flex items-start gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <Users className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Owners and tenants can report problems for this unit once they sign up with the email you enter here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResidentSection title="Owners" table="owners" unitId={unit.id} residents={owners ?? []} />
        <ResidentSection title="Tenants" table="tenants" unitId={unit.id} residents={tenants ?? []} />
      </div>

      <section className={`${cardClass} p-6`}>
        <h2 className="font-semibold text-slate-900">Unit details</h2>
        <form action={updateUnit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="id" value={unit.id} />
          <div className="space-y-1.5">
            <label htmlFor="unit_no" className={labelClass}>Unit number</label>
            <input id="unit_no" name="unit_no" required defaultValue={unit.unit_no} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" name="status" defaultValue={unit.status ?? "occupied"} className={inputClass}>
              {UNIT_STATUSES.map((status) => (
                <option key={status} value={status}>{label(status)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="floor_area_sqft" className={labelClass}>Floor area (sq ft)</label>
            <input id="floor_area_sqft" name="floor_area_sqft" type="number" min="0" step="any" defaultValue={unit.floor_area_sqft ?? ""} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="share_units" className={labelClass}>Share units</label>
            <input id="share_units" name="share_units" type="number" min="0" step="any" defaultValue={unit.share_units ?? 1} className={inputClass} />
          </div>
          <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-4">
            <SubmitButton label="Save changes" pendingLabel="Saving..." className={secondaryButtonClass} />
          </div>
        </form>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <form action={deleteUnit}>
            <input type="hidden" name="id" value={unit.id} />
            <input type="hidden" name="building_id" value={unit.building_id} />
            <SubmitButton
              label="Delete unit"
              pendingLabel="Deleting..."
              className={dangerButtonClass}
              confirmMessage="Delete this unit with its owners, tenants and maintenance requests? This cannot be undone."
            />
          </form>
        </div>
      </section>
    </>
  );
}
