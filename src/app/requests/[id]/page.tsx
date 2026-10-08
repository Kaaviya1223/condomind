import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { cardClass } from "@/components/ui";
import { requireResident } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { label } from "@/lib/labels";

const STEPS = [
  { key: "open", label: "Submitted", hint: "Your manager has your request" },
  { key: "in_progress", label: "In progress", hint: "Someone is working on it" },
  { key: "resolved", label: "Resolved", hint: "The problem has been fixed" },
] as const;

function stepIndex(status: string | null) {
  if (status === "in_progress") return 1;
  if (status === "resolved" || status === "closed") return 2;
  return 0;
}

function formatDateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })
    : null;
}

export default async function ResidentRequestPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; message?: string };
}) {
  if (!isUuid(params.id)) notFound();
  const { supabase } = await requireResident();

  const { data: request } = await supabase
    .from("maintenance_requests")
    .select("id, title, description, category, priority, status, assigned_vendor_id, submitted_at, resolved_at, units(unit_no, buildings(name))")
    .eq("id", params.id)
    .maybeSingle();

  if (!request) notFound();
  const unit = request.units as unknown as {
    unit_no: string;
    buildings: { name: string } | null;
  } | null;
  const current = stepIndex(request.status);

  return (
    <>
      <PageHeader
        title={request.title}
        back={{ href: "/requests", label: "Your requests" }}
        description={unit ? `${unit.buildings?.name} · Unit ${unit.unit_no}` : undefined}
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </div>
      </PageHeader>
      <Flash searchParams={searchParams} />

      <section className={`${cardClass} p-6`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Progress</h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const done = index < current || (index === current && index === STEPS.length - 1);
            const active = index === current && !done;
            return (
              <li key={step.key} className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    done
                      ? "bg-indigo-600 text-white"
                      : active
                        ? "border-2 border-indigo-600 bg-white text-indigo-600"
                        : "border-2 border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <div>
                  <p className={`text-sm font-medium ${done || active ? "text-slate-900" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {index === 0
                      ? formatDateTime(request.submitted_at) ?? step.hint
                      : index === 2 && request.resolved_at
                        ? formatDateTime(request.resolved_at)
                        : step.hint}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {request.status === "closed" && (
          <p className="mt-5 text-sm text-slate-500">This request has been closed by your manager.</p>
        )}
      </section>

      <section className={`${cardClass} p-6`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your report</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-800">
          {request.description || "No details given."}
        </p>
        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium text-slate-900">{label(request.category) || "Not set yet"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Contractor</dt>
            <dd className="font-medium text-slate-900">
              {request.assigned_vendor_id ? "Assigned" : "Not assigned yet"}
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
