"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: string | Date;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(endTime: string | Date): TimeLeft | null {
  const end =
    typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();
  const difference = end - Date.now();

  if (Number.isNaN(difference) || difference <= 0) {
    return null;
  }

  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function CountdownTimer({ endTime }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    getTimeLeft(endTime),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(endTime));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="mb-[22px] flex gap-3">
      {[
        { label: "hrs", value: timeLeft.hours },
        { label: "min", value: timeLeft.minutes },
        { label: "sec", value: timeLeft.seconds },
      ].map((unit) => (
        <div
          key={unit.label}
          className="min-w-[58px] rounded-[10px] border border-[var(--border-token)] bg-[var(--surface)] px-3.5 py-2.5 text-center"
        >
          <span className="block font-mono text-[21px] font-bold tabular-nums text-[var(--text)]">
            {pad(unit.value)}
          </span>
          <label className="text-[9px] uppercase tracking-[1px] text-[var(--text-muted)]">
            {unit.label}
          </label>
        </div>
      ))}
    </div>
  );
}
