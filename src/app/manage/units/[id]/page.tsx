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
    <form action={saveResident} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="unit_id" value={unitId} />
      {resident && <input type="hidden" name="id" value={resident.id} />}
      <div className="space-y-1">
        <label htmlFor={`${prefix}-name`} className={labelClass}>Full name</label>
        <input id={`${prefix}-name`} name="full_name" required defaultValue={resident?.full_name} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${prefix}-email`} className={labelClass}>Email</label>
        <input id={`${prefix}-email`} name="email" type="email" defaultValue={resident?.email ?? ""} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${prefix}-phone`} className={labelClass}>Phone</label>
        <input id={`${prefix}-phone`} name="phone" type="tel" defaultValue={resident?.phone ?? ""} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${prefix}-ic`} className={labelClass}>IC no.</label>
        <input id={`${prefix}-ic`} name="ic_no" defaultValue={resident?.ic_no ?? ""} className={inputClass} />
      </div>
      {table === "tenants" && (
        <>
          <div className="space-y-1">
            <label htmlFor={`${prefix}-start`} className={labelClass}>Lease start</label>
            <input id={`${prefix}-start`} name="lease_start" type="date" defaultValue={resident?.lease_start ?? ""} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor={`${prefix}-end`} className={labelClass}>Lease end</label>
            <input id={`${prefix}-end`} name="lease_end" type="date" defaultValue={resident?.lease_end ?? ""} className={inputClass} />
          </div>
        </>
      )}
      <div>
        <SubmitButton
          label={resident ? "Save" : `Add ${table === "owners" ? "owner" : "tenant"}`}
          pendingLabel="Saving..."
          className={resident ? secondaryButtonClass : undefined}
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
  return (
    <section className={cardClass}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {residents.length ? (
        <ul className="space-y-3">
          {residents.map((resident) => (
            <li key={resident.id} className="rounded border border-gray-500/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">{resident.full_name}</p>
                  <p className="text-gray-500">
                    {[resident.email, resident.phone].filter(Boolean).join(" · ") || "No contact details"}
                  </p>
                  {table === "tenants" && (resident.lease_start || resident.lease_end) && (
                    <p className="text-gray-500">
                      Lease {resident.lease_start ?? "?"} to {resident.lease_end ?? "?"}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {resident.user_id ? "Linked to a CondoMind account" : "No linked account yet"}
                  </p>
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
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-blue-600">Edit</summary>
                <div className="mt-3">
                  <ResidentForm table={table} unitId={unitId} resident={resident} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">None yet.</p>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-blue-600">
          Add {table === "owners" ? "an owner" : "a tenant"}
        </summary>
        <div className="mt-3">
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

  return (
    <>
      <div>
        <Link href={`/manage/buildings/${unit.building_id}`} className={`${linkClass} text-sm`}>
          ← {building?.name ?? "Building"}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Unit {unit.unit_no}</h1>
        <p className="text-gray-500">
          {label(unit.status)}
          {unit.floor_area_sqft ? ` · ${unit.floor_area_sqft} sq ft` : ""}
          {` · ${unit.share_units ?? 1} share units`}
        </p>
      </div>
      <Flash searchParams={searchParams} />

      <p className="text-sm text-gray-500">
        Owners and tenants get access to this unit when they sign up or log in with the email entered here.
      </p>

      <ResidentSection title="Owners" table="owners" unitId={unit.id} residents={owners ?? []} />
      <ResidentSection title="Tenants" table="tenants" unitId={unit.id} residents={tenants ?? []} />

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Unit details</h2>
        <form action={updateUnit} className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <input type="hidden" name="id" value={unit.id} />
          <div className="space-y-1">
            <label htmlFor="unit_no" className={labelClass}>Unit no.</label>
            <input id="unit_no" name="unit_no" required defaultValue={unit.unit_no} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" name="status" defaultValue={unit.status ?? "occupied"} className={inputClass}>
              {UNIT_STATUSES.map((status) => (
                <option key={status} value={status}>{label(status)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="floor_area_sqft" className={labelClass}>Area (sq ft)</label>
            <input id="floor_area_sqft" name="floor_area_sqft" type="number" min="0" step="any" defaultValue={unit.floor_area_sqft ?? ""} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="share_units" className={labelClass}>Share units</label>
            <input id="share_units" name="share_units" type="number" min="0" step="any" defaultValue={unit.share_units ?? 1} className={inputClass} />
          </div>
          <div>
            <SubmitButton label="Save" pendingLabel="Saving..." className={secondaryButtonClass} />
          </div>
        </form>
        <form action={deleteUnit} className="mt-6">
          <input type="hidden" name="id" value={unit.id} />
          <input type="hidden" name="building_id" value={unit.building_id} />
          <SubmitButton
            label="Delete unit"
            pendingLabel="Deleting..."
            className={dangerButtonClass}
            confirmMessage="Delete this unit with its owners, tenants and maintenance requests? This cannot be undone."
          />
        </form>
      </section>
    </>
  );
}
