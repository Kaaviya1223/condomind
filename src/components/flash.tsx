export function Flash({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  if (searchParams.error) {
    return (
      <p className="rounded bg-red-50 p-3 text-sm text-red-700">
        {searchParams.error}
      </p>
    );
  }
  if (searchParams.message) {
    return (
      <p className="rounded bg-green-50 p-3 text-sm text-green-700">
        {searchParams.message}
      </p>
    );
  }
  return null;
}
