import { Plus } from "lucide-react";
import { cardClass } from "./ui";

export function CollapsibleForm({
  label,
  description,
  open = false,
  children,
}: {
  label: string;
  description?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={`${cardClass} group`} open={open}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition group-open:rotate-45">
          <Plus className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-semibold text-slate-900">{label}</span>
          {description && <span className="block text-xs text-slate-500">{description}</span>}
        </span>
      </summary>
      <div className="border-t border-slate-100 px-5 py-5">{children}</div>
    </details>
  );
}
