"use client";

interface StockBarProps {
  current: number;
  total: number;
  reservedToday?: number;
}

export function StockBar({ current, total, reservedToday = 0 }: StockBarProps) {
  const safeTotal = Math.max(total, current, 1);
  const percent = Math.max(0, Math.min(100, Math.round((current / safeTotal) * 100)));

  return (
    <div>
      <div className="mb-1.5 h-[5px] max-w-[340px] overflow-hidden rounded bg-[var(--surface)]">
        <div className="td-stock-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="mb-5 font-mono text-[11px] text-[var(--molten)]">
        {percent}% left
        {reservedToday > 0 ? ` · ${reservedToday} reserved today` : null}
      </p>
    </div>
  );
}
