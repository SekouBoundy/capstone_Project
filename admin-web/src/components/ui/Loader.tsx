export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function FullPageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fill">
      <div className="flex flex-col items-center gap-3 text-ink-2">
        <Spinner className="size-5" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <div
              key={colIndex}
              className="h-3 rounded bg-line"
              style={{ width: colIndex === 0 ? '30%' : `${Math.max(12, 70 / cols)}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
