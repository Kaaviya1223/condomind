import { redirect } from "next/navigation";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): value is string {
  return !!value && UUID_PATTERN.test(value);
}

export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null;
}

export function optionalNumber(formData: FormData, name: string) {
  const value = text(formData, name);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function oneOf<T extends string>(
  value: string,
  allowed: readonly T[]
): T | null {
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function uuidField(formData: FormData, name: string) {
  const value = text(formData, name);
  return isUuid(value) ? value : null;
}

function withParam(path: string, key: string, value: string) {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  return `${base}?${params}`;
}

export function fail(path: string, message: string): never {
  redirect(withParam(path, "error", message));
}

export function succeed(path: string, message: string): never {
  redirect(withParam(path, "message", message));
}
