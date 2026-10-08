import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/badges";
import { Flash } from "@/components/flash";
import { SubmitButton } from "@/components/submit-button";
import { cardClass, inputClass, labelClass, linkClass } from "@/components/ui";
import { requireResident } from "@/lib/auth";
import { submitRequest } from "./actions";
import { getResidentUnits } from "./units";

export default async function ResidentRequestsPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const { supabase, user } = await requireResident();
  const units = await getResidentUnits(supabase, user.id);

  if (!units.length) {
    return (
      <>
        <h1 className="text-2xl font-bold">Maintenance requests</h1>
        <div className={cardClass}>
          <p className="font-medium">Your account is not linked to a unit yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Ask your building manager to add you as an owner or tenant using {user.email}.
            Your unit appears here once they do.
          </p>
        </div>
      </>
    );
  }

  const { data: requests, error } = await supabase
    .from("maintenance_requests")
    .select("id, title, status, priority, submitted_at, unit_id")
    .in("unit_id", units.map((unit) => unit.id))
    .order("submitted_at", { ascending: false })
    .limit(100);

  const unitName = new Map(
    units.map((unit) => [unit.id, `${unit.buildingName} · Unit ${unit.unit_no}`])
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Maintenance requests</h1>
      <Flash searchParams={searchParams} />

      <section className={cardClass}>
        <h2 className="mb-4 text-lg font-semibold">Report a problem</h2>
        <form action={submitRequest} className="space-y-4">
          {units.length === 1 ? (
            <>
              <input type="hidden" name="unit_id" value={units[0].id} />
              <p className="text-sm text-gray-500">{unitName.get(units[0].id)}</p>
            </>
          ) : (
            <div className="space-y-1">
              <label htmlFor="unit_id" className={labelClass}>Unit</label>
              <select id="unit_id" name="unit_id" required className={inputClass}>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unitName.get(unit.id)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1">
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
          <div className="space-y-1">
            <label htmlFor="description" className={labelClass}>Details</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={5000}
              placeholder="Where is it, when did it start, how bad is it?"
              className={inputClass}
            />
          </div>
          <SubmitButton label="Submit request" pendingLabel="Submitting..." />
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your requests</h2>
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {requests?.length ? (
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link href={`/requests/${request.id}`} className={`${linkClass} font-medium`}>
                      {request.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {unitName.get(request.unit_id)}
                      {request.submitted_at &&
                        ` · ${new Date(request.submitted_at).toLocaleDateString("en-MY")}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">You have not submitted any requests yet.</p>
        )}
      </section>
    </>
  );
}
