import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NeedsTriageBadge, PriorityBadge, StatusBadge } from "@/components/badges";
import { label } from "@/lib/labels";

export function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
    : "";
}

export function RequestRow({
  href,
  title,
  status,
  priority,
  category,
  submittedAt,
  location,
  needsTriage = false,
}: {
  href: string;
  title: string;
  status: string | null;
  priority: string | null;
  category?: string | null;
  submittedAt: string | null;
  location?: string;
  needsTriage?: boolean;
}) {
  const details = [location, category ? label(category) : null, formatDate(submittedAt)].filter(Boolean);

  return (
    <li>
      <Link href={href} className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{title}</p>
          <p className="mt-0.5 truncate text-sm text-slate-500">{details.join(" · ")}</p>
          <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
            {needsTriage && <NeedsTriageBadge />}
            <PriorityBadge priority={priority} />
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {needsTriage && <NeedsTriageBadge />}
          <PriorityBadge priority={priority} />
          <StatusBadge status={status} />
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </Link>
    </li>
  );
}
