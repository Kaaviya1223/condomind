import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { cardClass, linkClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { oneOf } from "@/lib/form";
import { REQUEST_STATUSES, label } from "@/lib/labels";

const FILTERS = ["active", "all", ...REQUEST_STATUSES] as const;

export default async function ManagerRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { supabase, user } = await requireManager();
  const filter = oneOf(searchParams.status ?? "active", FILTERS) ?? "active";

  const { data: links } = await supabase
    .from("building_managers")
    .select("building_id")
    .eq("user_id", user.id);
  const buildingIds = (links ?? []).map((link) => link.building_id);

  let requests: {
    id: string;
    title: string;
    status: string | null;
    priority: string | null;
    category: string | null;
    ai_notes: string | null;
    submitted_at: string | null;
    units: unknown;
  }[] = [];
  let errorMessage: string | null = null;

  if (buildingIds.length) {
    let query = supabase
      .from("maintenance_requests")
      .select("id, title, status, priority, category, ai_notes, submitted_at, units!inner(unit_no, building_id, buildings(name))")
      .in("units.building_id", buildingIds)
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (filter === "active") {
      query = query.in("status", ["open", "in_progress"]);
    } else if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    requests = data ?? [];
    errorMessage = error?.message ?? null;
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Maintenance requests</h1>

      <nav className="flex flex-wrap gap-2 text-sm">
        {FILTERS.map((value) => (
          <Link
            key={value}
            href={`/manage/requests?status=${value}`}
            className={`rounded-full border px-3 py-1 ${
              value === filter
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-400 hover:bg-gray-500/10"
            }`}
          >
            {label(value)}
          </Link>
        ))}
      </nav>

      {errorMessage && <p className="text-red-600">Error: {errorMessage}</p>}

      {requests.length ? (
        <ul className="space-y-3">
          {requests.map((request) => {
            const unit = request.units as {
              unit_no: string;
              buildings: { name: string } | null;
            };
            return (
              <li key={request.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/manage/requests/${request.id}`} className={`${linkClass} font-medium`}>
                      {request.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {unit.buildings?.name} · Unit {unit.unit_no}
                      {request.submitted_at &&
                        ` · ${new Date(request.submitted_at).toLocaleDateString("en-MY")}`}
                      {request.category && ` · ${label(request.category)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!request.ai_notes && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Not triaged
                      </span>
                    )}
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500">No requests match this filter.</p>
      )}
    </>
  );
}
