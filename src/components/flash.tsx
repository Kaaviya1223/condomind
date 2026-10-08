import { CircleCheck, TriangleAlert } from "lucide-react";

export function Flash({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  if (searchParams.error) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{searchParams.error}</p>
      </div>
    );
  }
  if (searchParams.message) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{searchParams.message}</p>
      </div>
    );
  }
  return null;
}
