export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-lg bg-slate-200" />
        <div className="h-4 w-80 max-w-full rounded bg-slate-200/70" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/5 rounded bg-slate-200" />
              <div className="h-3 w-1/4 rounded bg-slate-100" />
            </div>
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
