import Link from "next/link";
import { ArrowRight, Building, ClipboardList, Sparkles, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { RequestRow } from "@/components/request-row";
import { buttonClass, cardClass, linkClass } from "@/components/ui";
import { requireManager } from "@/lib/auth";
import {
  REQUEST_SUMMARY_COLUMNS,
  byPriorityThenDate,
  type RequestSummary,
} from "@/lib/manager-data";

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  icon: typeof Building;
  tone: string;
  href: string;
}) {
  return (
    <Link href={href} className={`${cardClass} flex items-center gap-4 p-5 hover:border-indigo-300`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Link>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, managedBuildingIds: buildingIds, fullName } = await requireManager();
  const firstName = fullName?.split(" ")[0];

  if (!buildingIds.length) {
    return (
      <>
        <PageHeader title={firstName ? `Welcome, ${firstName}` : "Welcome"} />
        <Flash searchParams={searchParams} />
        <EmptyState
          icon={Building}
          title="Add your first building"
          action={
            <Link href="/manage/buildings/new" className={buttonClass}>
              Add building
            </Link>
          }
        >
          Start by adding a building you manage. Then add its units, owners and tenants so
          residents can report problems.
        </EmptyState>
      </>
    );
  }

  const [{ data: buildings }, { data: activeData }] = await Promise.all([
    supabase.from("buildings").select("id, units(count)").in("id", buildingIds),
    supabase
      .from("maintenance_requests")
      .select(REQUEST_SUMMARY_COLUMNS)
      .in("units.building_id", buildingIds)
      .in("status", ["open", "in_progress"])
      .limit(500),
  ]);

  const active = ((activeData ?? []) as unknown as RequestSummary[]).sort(byPriorityThenDate);
  const urgent = active.filter((r) => r.priority === "urgent" || r.priority === "high").length;
  const needsTriage = active.filter((r) => !r.ai_notes).length;
  const unitCount = (buildings ?? []).reduce(
    (sum, b) => sum + ((b.units as unknown as { count: number }[])[0]?.count ?? 0),
    0
  );

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description="Here is what needs your attention across your buildings."
      />
      <Flash searchParams={searchParams} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open requests" value={active.length} icon={ClipboardList} tone="bg-indigo-50 text-indigo-600" href="/manage/requests" />
        <StatCard label="High or urgent" value={urgent} icon={TriangleAlert} tone="bg-red-50 text-red-600" href="/manage/requests" />
        <StatCard label="Need triage" value={needsTriage} icon={Sparkles} tone="bg-violet-50 text-violet-600" href="/manage/requests" />
        <StatCard label={`Units in ${buildingIds.length} building${buildingIds.length === 1 ? "" : "s"}`} value={unitCount} icon={Building} tone="bg-slate-100 text-slate-600" href="/manage/buildings" />
      </div>

      <section className={cardClass}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Needs attention</h2>
            <p className="text-sm text-slate-500">Open requests, most urgent first</p>
          </div>
          <Link href="/manage/requests" className={`${linkClass} inline-flex items-center gap-1 text-sm`}>
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {active.length ? (
          <ul className="divide-y divide-slate-100">
            {active.slice(0, 8).map((request) => (
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
        ) : (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No open requests. Everything is taken care of.
          </p>
        )}
      </section>
    </>
  );
}
