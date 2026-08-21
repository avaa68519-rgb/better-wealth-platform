"use client";

import { useEffect, useState } from "react";

type AnimatedStatProps = { value: number; prefix?: string; suffix?: string; decimals?: number };

export function AnimatedStat({ value, prefix = "", suffix = "", decimals = 0 }: AnimatedStatProps) {
  const [current, setCurrent] = useState(value * 0.76);

  useEffect(() => {
    const start = value * 0.76;
    const duration = 5000;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(start + (value - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{prefix}{current.toFixed(decimals)}{suffix}</>;
}
