import { Inbox, Wrench } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RequestRow } from "@/components/request-row";
import { Tabs } from "@/components/tabs";
import { cardClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import { oneOf } from "@/lib/form";
import {
  REQUEST_SUMMARY_COLUMNS,
  byPriorityThenDate,
  type RequestSummary,
} from "@/lib/manager-data";

const FILTERS = [
  { key: "active", label: "Open", statuses: ["open", "in_progress"] },
  { key: "needs_triage", label: "Needs triage", statuses: ["open", "in_progress"] },
  { key: "resolved", label: "Resolved", statuses: ["resolved"] },
  { key: "closed", label: "Closed", statuses: ["closed"] },
  { key: "all", label: "All", statuses: null },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matches(request: RequestSummary, key: FilterKey) {
  const filter = FILTERS.find((f) => f.key === key)!;
  if (filter.statuses && !(filter.statuses as readonly string[]).includes(request.status ?? "open")) {
    return false;
  }
  return key === "needs_triage" ? !request.ai_notes : true;
}

export default async function ManagerRequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { supabase, managedBuildingIds: buildingIds } = await requireManager();
  const filter =
    oneOf(searchParams.status ?? "active", FILTERS.map((f) => f.key)) ?? "active";

  const { data, error } = buildingIds.length
    ? await supabase
        .from("maintenance_requests")
        .select(REQUEST_SUMMARY_COLUMNS)
        .in("units.building_id", buildingIds)
        .order("submitted_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };

  const all = (data ?? []) as unknown as RequestSummary[];
  const shown = all.filter((r) => matches(r, filter));
  if (filter === "active" || filter === "needs_triage") shown.sort(byPriorityThenDate);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Requests from owners and tenants in your buildings. Open one to see the suggested triage and assign a vendor."
      />

      <Tabs
        active={filter}
        tabs={FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          href: `/manage/requests?status=${f.key}`,
          count: all.filter((r) => matches(r, f.key)).length,
        }))}
      />

      {error && <p className="text-sm text-red-600">Could not load requests: {error.message}</p>}

      {shown.length ? (
        <div className={cardClass}>
          <ul className="divide-y divide-slate-100">
            {shown.map((request) => (
              <RequestRow
                key={request.id}
                href={`/manage/requests/${request.id}`}
                title={request.title}
                status={request.status}
                priority={request.priority}
                category={request.category}
                submittedAt={request.submitted_at}
                location={`${request.units?.buildings?.name ?? ""} · Unit ${request.units?.unit_no ?? ""}`}
                needsTriage={!request.ai_notes}
              />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState icon={all.length ? Inbox : Wrench} title={all.length ? "Nothing here" : "No requests yet"}>
          {all.length
            ? "No requests match this filter."
            : "When owners or tenants report a problem, it appears here."}
        </EmptyState>
      )}
    </>
  );
}
