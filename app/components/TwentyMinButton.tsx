"use client";

import { useState, useEffect } from "react";
import { Clock, Circle, CheckCircle2, Loader2 } from "lucide-react";

const TWENTY_MIN_MS = 20 * 60 * 1000; // 20 minutes in milliseconds

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return "";
  if (minutes === 1) return "1分钟";
  return `${minutes}分钟`;
}

interface TwentyMinButtonProps {
  taskLogId: number;
  status: boolean;
  createdAt: string | number | Date | null;
  onToggle: (id: number, currentStatus: boolean) => void;
  isToggling: boolean;
}

export default function TwentyMinButton({ taskLogId, status, createdAt, onToggle, isToggling }: TwentyMinButtonProps) {
  const [mounted, setMounted] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(0);

  // Calculate remaining minutes from createdAt + 20min deadline
  const calcRemaining = (): number => {
    if (!createdAt) return 0;
    const created = new Date(createdAt).getTime();
    if (isNaN(created)) return 0;
    const deadline = created + TWENTY_MIN_MS;
    const remaining = Math.min(TWENTY_MIN_MS, Math.max(0, deadline - Date.now()));
    return Math.ceil(remaining / 60000); // convert to minutes, rounded up
  };

  useEffect(() => {
    setMounted(true);
    if (status) return; // already completed, no need for countdown

    const update = () => setRemainingMinutes(calcRemaining());
    update(); // initial calculation

    // Only set interval if countdown is still active
    if (calcRemaining() <= 0) return;

    const interval = setInterval(update, 60000); // update every minute
    return () => clearInterval(interval);
  }, [status, createdAt]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button disabled className="mr-2 flex-shrink-0 opacity-60 cursor-not-allowed">
        <Clock className="w-6 h-6 text-amber-400 dark:text-amber-500" />
      </button>
    );
  }

  // Loading state
  if (isToggling) {
    return (
      <button disabled className="mr-2 flex-shrink-0">
        <Loader2 className="w-6 h-6 text-amber-400 dark:text-amber-500 animate-spin" />
      </button>
    );
  }

  // Completed state — clickable to undo
  if (status) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(taskLogId, true); }}
        className="mr-2 focus:outline-none flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
        title="点击取消打卡"
      >
        <CheckCircle2 className="w-6 h-6 text-amber-400 dark:text-amber-500" />
      </button>
    );
  }

  // Countdown state
  if (remainingMinutes > 0) {
    return (
      <button
        disabled
        className="mr-2 flex-shrink-0 opacity-60 cursor-not-allowed"
        title={`${remainingMinutes}分钟后可打卡`}
      >
        <Clock className="w-6 h-6 text-amber-400 dark:text-amber-500 animate-pulse" />
      </button>
    );
  }

  // Active state — clickable
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(taskLogId, false); }}
      className="mr-2 focus:outline-none flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
      title="20分钟复习打卡"
    >
      <Circle className="w-6 h-6 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300" />
    </button>
  );
}

export { formatCountdown, TWENTY_MIN_MS };
