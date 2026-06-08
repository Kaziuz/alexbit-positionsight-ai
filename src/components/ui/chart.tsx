import type { CSSProperties, ReactNode } from "react";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

type ChartContainerProps = {
  config: ChartConfig;
  className?: string;
  children: ReactNode;
};

export function ChartContainer({ config, className = "", children }: ChartContainerProps) {
  const style = Object.fromEntries(
    Object.entries(config).map(([key, item]) => [`--color-${key}`, item.color]),
  ) as CSSProperties;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export function ChartLegend({ config }: { config: ChartConfig }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      {Object.entries(config).map(([key, item]) => (
        <div key={key} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
