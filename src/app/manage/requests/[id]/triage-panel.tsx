"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { secondaryButtonClass } from "@/components/ui";
import { triageMaintenanceRequest } from "../../actions";

export function TriagePanel({
  requestId,
  notes,
}: {
  requestId: string;
  notes: string | null;
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
    <div className="space-y-3">
      {pending ? (
        <p className="text-sm text-gray-500">Running suggested triage...</p>
      ) : notes ? (
        <p className="whitespace-pre-line text-sm">{notes}</p>
      ) : (
        <p className="text-sm text-gray-500">Not triaged yet.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!pending && (notes || error) && (
        <button
          type="button"
          onClick={run}
          className={secondaryButtonClass}
        >
          {notes ? "Run triage again" : "Try again"}
        </button>
      )}
      {notes && !pending && (
        <p className="text-xs text-gray-500">
          Running again replaces the category, priority and notes.
        </p>
      )}
    </div>
  );
}
