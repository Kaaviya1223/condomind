import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass, linkClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { CATEGORIES, PRIORITIES, REQUEST_STATUSES, label } from "@/lib/labels";
import { updateRequest } from "../../actions";
import { TriagePanel } from "./triage-panel";

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })
    : "–";
}

export default async function ManagerRequestPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  if (!isUuid(params.id)) notFound();
  const { supabase } = await requireManager();

  const [{ data: request }, { data: vendors }] = await Promise.all([
    supabase
      .from("maintenance_requests")
      .select(
        "id, title, description, category, priority, status, ai_notes, assigned_vendor_id, submitted_at, resolved_at, units(id, unit_no, buildings(name))"
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("vendors")
      .select("id, company_name, service_type")
      .order("company_name"),
  ]);

  if (!request) notFound();
  const unit = request.units as unknown as {
    id: string;
    unit_no: string;
    buildings: { name: string } | null;
  } | null;

  return (
    <>
      <div>
        <Link href="/manage/requests" className={`${linkClass} text-sm`}>
          ← All requests
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{request.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {unit && (
            <Link href={`/manage/units/${unit.id}`} className={linkClass}>
              {unit.buildings?.name} · Unit {unit.unit_no}
            </Link>
          )}
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <section className={cardClass}>
        <h2 className="mb-2 text-lg font-semibold">Description</h2>
        <p className="whitespace-pre-line text-sm">
          {request.description || "No description given."}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Submitted</dt>
            <dd>{formatDate(request.submitted_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Resolved</dt>
            <dd>{formatDate(request.resolved_at)}</dd>
          </div>
        </dl>
      </section>

      <section className={cardClass}>
        <h2 className="mb-2 text-lg font-semibold">Suggested triage</h2>
        <TriagePanel requestId={request.id} notes={request.ai_notes} />
      </section>

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Update</h2>
        <form
          key={[request.status, request.priority, request.category, request.assigned_vendor_id].join("|")}
          action={updateRequest}
          className="grid gap-4 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={request.id} />
          <div className="space-y-1">
            <label htmlFor="status" className={labelClass}>Status</label>
            <select id="status" name="status" defaultValue={request.status ?? "open"} className={inputClass}>
              {REQUEST_STATUSES.map((value) => (
                <option key={value} value={value}>{label(value)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="priority" className={labelClass}>Priority</label>
            <select id="priority" name="priority" defaultValue={request.priority ?? "medium"} className={inputClass}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>{label(value)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="category" className={labelClass}>Category</label>
            <select id="category" name="category" defaultValue={request.category ?? ""} className={inputClass}>
              <option value="">Not set</option>
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>{label(value)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="vendor" className={labelClass}>Assigned vendor</label>
            <select
              id="vendor"
              name="assigned_vendor_id"
              defaultValue={request.assigned_vendor_id ?? ""}
              className={inputClass}
            >
              <option value="">Not assigned</option>
              {(vendors ?? []).map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                  {vendor.service_type ? ` (${vendor.service_type})` : ""}
                </option>
              ))}
            </select>
            {!vendors?.length && (
              <p className="text-xs text-gray-500">
                No vendors yet. Add them in the Supabase dashboard.
              </p>
            )}
          </div>
          <div>
            <SubmitButton label="Save changes" pendingLabel="Saving..." />
          </div>
        </form>
      </section>
    </>
  );
}
