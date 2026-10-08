"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";
import { triageMaintenanceRequest } from "../../actions";

export function TriagePanel({
  requestId,
  notes,
  category,
  priority,
}: {
  requestId: string;
  notes: string | null;
  category: string | null;
  priority: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await triageMaintenanceRequest(requestId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  useEffect(() => {
    if (!notes && !started.current) {
      started.current = true;
      run();
    }
    // Runs once for an untriaged request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  return (
    <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-violet-900">
          <Sparkles className="h-4 w-4 text-violet-600" />
          Suggested triage
        </h2>
        {notes && !pending && (
          <button
            type="button"
            onClick={run}
            title="Running again replaces the category, priority and notes"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Run again
          </button>
        )}
      </div>

      <div className="mt-3">
        {pending ? (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-violet-800">Reading the request and suggesting next steps...</p>
            <div className="h-3 w-3/4 animate-pulse rounded bg-violet-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-violet-100" />
          </div>
        ) : notes ? (
          <div className="space-y-3">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{notes}</p>
            <p className="text-xs text-violet-700">
              Applied: {category ? category.replace(/_/g, " ") : "no category"} · {priority ?? "medium"} priority.
              You can change both on the right.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Not triaged yet.</p>
        )}
        {error && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={run}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
