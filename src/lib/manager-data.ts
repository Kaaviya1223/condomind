import { PRIORITIES } from "@/lib/labels";

export type RequestSummary = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  ai_notes: string | null;
  submitted_at: string | null;
  units: { unit_no: string; buildings: { name: string } | null } | null;
};

export const REQUEST_SUMMARY_COLUMNS =
  "id, title, status, priority, category, ai_notes, submitted_at, units!inner(unit_no, building_id, buildings(name))";

export function byPriorityThenDate(a: RequestSummary, b: RequestSummary) {
  const rank = (p: string | null) => PRIORITIES.indexOf((p ?? "medium") as (typeof PRIORITIES)[number]);
  const diff = rank(b.priority) - rank(a.priority);
  if (diff !== 0) return diff;
  return (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "");
}
