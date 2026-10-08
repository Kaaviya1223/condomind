import { label } from "@/lib/labels";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-gray-200 text-gray-700",
  medium: "bg-sky-100 text-sky-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

function Badge({ className, children }: { className: string; children: string }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  const value = status ?? "open";
  return <Badge className={STATUS_STYLES[value] ?? STATUS_STYLES.closed}>{label(value)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  const value = priority ?? "medium";
  return <Badge className={PRIORITY_STYLES[value] ?? PRIORITY_STYLES.low}>{label(value)}</Badge>;
}
