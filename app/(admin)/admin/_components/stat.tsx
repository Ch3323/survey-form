export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-cloud-muted text-center">{label}</p>
      <p className="text-lg font-semibold text-cloud-heading text-center">{value}</p>
    </div>
  );
}
