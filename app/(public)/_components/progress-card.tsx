type ProgressCardProps = {
  currentPageIndex: number;
  pageCount: number;
  progress: number;
};

export function ProgressCard({
  currentPageIndex,
  pageCount,
  progress,
}: ProgressCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-cloud-panel)]">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-cloud-heading">
          Page {currentPageIndex + 1} of {pageCount}
        </span>
        <span className="text-cloud-muted">{progress}% complete</span>
      </div>
      <div className="h-2 rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
