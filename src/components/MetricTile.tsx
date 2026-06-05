type MetricTileProps = {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "warning";
};

const toneClass = {
  default: "text-slate-950",
  positive: "text-positive",
  negative: "text-negative",
  warning: "text-warning",
};

export function MetricTile({ label, value, tone = "default" }: MetricTileProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 min-h-8 break-words text-lg font-semibold ${toneClass[tone]}`}>{value}</div>
    </div>
  );
}
