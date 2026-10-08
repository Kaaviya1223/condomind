import { label } from "@/lib/labels";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 ring-blue-600/20",
  in_progress: "bg-amber-50 text-amber-800 ring-amber-600/20",
  resolved: "bg-green-50 text-green-700 ring-green-600/20",
  closed: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const STATUS_DOTS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-green-500",
  closed: "bg-slate-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 ring-slate-500/20",
  medium: "bg-sky-50 text-sky-700 ring-sky-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  urgent: "bg-red-50 text-red-700 ring-red-600/20",
};

const badgeBase =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset";

export function StatusBadge({ status }: { status: string | null }) {
  const value = status ?? "open";
  return (
    <span className={`${badgeBase} ${STATUS_STYLES[value] ?? STATUS_STYLES.closed}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[value] ?? STATUS_DOTS.closed}`} />
      {label(value)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  const value = priority ?? "medium";
  return (
    <span className={`${badgeBase} ${PRIORITY_STYLES[value] ?? PRIORITY_STYLES.low}`}>
      {label(value)} priority
    </span>
  );
}

export function NeedsTriageBadge() {
  return (
    <span className={`${badgeBase} bg-violet-50 text-violet-700 ring-violet-600/20`}>
      Needs triage
    </span>
  );
}
