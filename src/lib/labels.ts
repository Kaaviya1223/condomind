export const REQUEST_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "plumbing",
  "electrical",
  "air_conditioning",
  "lift",
  "structural",
  "pest_control",
  "security",
  "cleaning",
  "common_area",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNIT_STATUSES = ["occupied", "vacant", "under_renovation"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export function label(value: string | null | undefined) {
  if (!value) return "";
  const text = value.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
