interface UrgencyCounterProps {
  count: number;
}

export function UrgencyCounter({ count }: UrgencyCounterProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <p className="font-mono text-sm text-molten">
      <span className="mr-1.5 inline-block size-1.5 rounded-full bg-molten" />
      {count} reserved in the last 24h
    </p>
  );
}
