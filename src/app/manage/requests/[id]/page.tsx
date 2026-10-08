import Link from "next/link";
import { notFound } from "next/navigation";
import { Building, CalendarClock, CircleCheck } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { CATEGORIES, PRIORITIES, REQUEST_STATUSES, label } from "@/lib/labels";
import { updateRequest } from "../../actions";
import { TriagePanel } from "./triage-panel";

function formatDateTime(value: string | null) {
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
      <PageHeader title={request.title} back={{ href: "/manage/requests", label: "Maintenance" }}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </div>
      </PageHeader>
      <Flash searchParams={searchParams} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={`${cardClass} p-5`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              What the resident reported
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">
              {request.description || "No details given."}
            </p>
          </section>

          <TriagePanel
            requestId={request.id}
            notes={request.ai_notes}
            category={request.category}
            priority={request.priority}
          />
        </div>

        <div className="space-y-6">
          <section className={`${cardClass} p-5`}>
            <h2 className="font-semibold text-slate-900">Manage request</h2>
            <form
              key={[request.status, request.priority, request.category, request.assigned_vendor_id].join("|")}
              action={updateRequest}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={request.id} />
              <div className="space-y-1.5">
                <label htmlFor="status" className={labelClass}>Status</label>
                <select id="status" name="status" defaultValue={request.status ?? "open"} className={inputClass}>
                  {REQUEST_STATUSES.map((value) => (
                    <option key={value} value={value}>{label(value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="priority" className={labelClass}>Priority</label>
                <select id="priority" name="priority" defaultValue={request.priority ?? "medium"} className={inputClass}>
                  {PRIORITIES.map((value) => (
                    <option key={value} value={value}>{label(value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category" className={labelClass}>Category</label>
                <select id="category" name="category" defaultValue={request.category ?? ""} className={inputClass}>
                  <option value="">Not set</option>
                  {CATEGORIES.map((value) => (
                    <option key={value} value={value}>{label(value)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
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
                  <p className="text-xs text-slate-500">
                    No vendors yet. Add them in the Supabase dashboard under vendors.
                  </p>
                )}
              </div>
              <SubmitButton label="Save changes" pendingLabel="Saving..." className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60" />
            </form>
          </section>

          <section className={`${cardClass} p-5`}>
            <h2 className="font-semibold text-slate-900">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {unit && (
                <div className="flex items-start gap-3">
                  <Building className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <dt className="text-slate-500">Location</dt>
                    <dd>
                      <Link href={`/manage/units/${unit.id}`} className="font-medium text-indigo-600 hover:underline">
                        {unit.buildings?.name} · Unit {unit.unit_no}
                      </Link>
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <dt className="text-slate-500">Submitted</dt>
                  <dd className="text-slate-900">{formatDateTime(request.submitted_at)}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CircleCheck className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <dt className="text-slate-500">Resolved</dt>
                  <dd className="text-slate-900">{formatDateTime(request.resolved_at)}</dd>
                </div>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
