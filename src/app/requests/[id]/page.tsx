import Link from "next/link";
import { notFound } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { cardClass, linkClass } from "@/components/ui";
import { requireResident } from "@/lib/auth";
import { isUuid } from "@/lib/form";
import { label } from "@/lib/labels";

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })
    : "–";
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

  return (
    <>
      <div>
        <Link href="/requests" className={`${linkClass} text-sm`}>
          ← My requests
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{request.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <StatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
          {unit && <span>{unit.buildings?.name} · Unit {unit.unit_no}</span>}
        </div>
      </div>
      <Flash searchParams={searchParams} />

      <section className={cardClass}>
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
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd>{label(request.category) || "Not set yet"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Vendor</dt>
            <dd>{request.assigned_vendor_id ? "Assigned" : "Not assigned yet"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
