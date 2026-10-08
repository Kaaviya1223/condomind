import { ClipboardList, House, Mail } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Flash } from "@/components/flash";
import { PageHeader } from "@/components/page-header";
import { RequestRow } from "@/components/request-row";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass } from "@/components/ui";
import { requireResident } from "@/lib/auth";
import { submitRequest } from "./actions";
import { getResidentUnits } from "./units";

export default async function ResidentRequestsPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, user, fullName } = await requireResident();
  const units = await getResidentUnits(supabase, user.id);
  const firstName = fullName?.split(" ")[0];
  const greeting = firstName ? `Hi, ${firstName}` : "Welcome";

  if (!units.length) {
    return (
      <>
        <PageHeader title={greeting} />
        <EmptyState icon={House} title="Your account is not linked to a unit yet">
          <p>
            Your building manager needs to add you to your unit as an owner or tenant, using
            this email address:
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-800">
            <Mail className="h-4 w-4" /> {user.email}
          </p>
          <p className="mt-3">
            Once they do, refresh this page and you can report maintenance problems here.
          </p>
        </EmptyState>
      </>
    );
  }

  const { data: requests, error } = await supabase
    .from("maintenance_requests")
    .select("id, title, status, priority, category, submitted_at, unit_id")
    .in("unit_id", units.map((unit) => unit.id))
    .order("submitted_at", { ascending: false })
    .limit(100);

  const unitName = new Map(
    units.map((unit) => [unit.id, `${unit.buildingName} · Unit ${unit.unit_no}`])
  );

  return (
    <>
      <PageHeader
        title={greeting}
        description={
          units.length === 1
            ? unitName.get(units[0].id)
            : `${units.length} units linked to your account`
        }
      />
      <Flash searchParams={searchParams} />

      <section className={`${cardClass} p-6`}>
        <h2 className="text-lg font-semibold text-slate-900">Report a problem</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tell your building manager what needs fixing. The more detail, the faster it gets sorted.
        </p>
        <form action={submitRequest} className="mt-5 space-y-4">
          {units.length === 1 ? (
            <input type="hidden" name="unit_id" value={units[0].id} />
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="unit_id" className={labelClass}>Which unit?</label>
              <select id="unit_id" name="unit_id" required className={inputClass}>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unitName.get(unit.id)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="title" className={labelClass}>What is the problem?</label>
            <input
              id="title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Water leaking from bathroom ceiling"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className={labelClass}>
              Details <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={5000}
              placeholder="Where exactly is it? When did it start? Is it getting worse?"
              className={inputClass}
            />
          </div>
          <SubmitButton label="Submit request" pendingLabel="Submitting..." />
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Your requests</h2>
        {error && <p className="text-sm text-red-600">Could not load requests: {error.message}</p>}
        {requests?.length ? (
          <div className={cardClass}>
            <ul className="divide-y divide-slate-100">
              {requests.map((request) => (
                <RequestRow
                  key={request.id}
                  href={`/requests/${request.id}`}
                  title={request.title}
                  status={request.status}
                  priority={request.priority}
                  category={request.category}
                  submittedAt={request.submitted_at}
                  location={units.length > 1 ? unitName.get(request.unit_id) : undefined}
                />
              ))}
            </ul>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No requests yet">
            Problems you report appear here so you can follow their progress.
          </EmptyState>
        )}
      </section>
    </>
  );
}
