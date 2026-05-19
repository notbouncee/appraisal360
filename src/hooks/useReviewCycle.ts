import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewCycle {
  id: string;
  year: number;
  quarter: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

function computePhaseStatus(cycle: { start_date: string; end_date: string }, now: Date) {
  const start = new Date(cycle.start_date + "T00:00:00");
  const end = new Date(cycle.end_date + "T23:59:59");

  if (now < start) return "upcoming" as const;
  if (now > end) return "completed" as const;
  return "active" as const;
}

function computeProgress(cycle: { start_date: string; end_date: string }, now: Date): number {
  const start = new Date(cycle.start_date + "T00:00:00").getTime();
  const end = new Date(cycle.end_date + "T23:59:59").getTime();
  const current = now.getTime();

  if (current <= start) return 0;
  if (current >= end) return 100;
  return Math.round(((current - start) / (end - start)) * 100);
}

function daysLeft(endDate: string, now: Date): number {
  const end = new Date(endDate + "T23:59:59").getTime();
  const diff = end - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function useReviewCycles() {
  const [now, setNow] = useState(() => new Date());
  const currentYear = now.getFullYear();

  // Tick every 60 seconds so progress/days-left update live
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["review-cycles", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_cycles")
        .select("*")
        .eq("year", currentYear)
        .order("quarter", { ascending: true });
      if (error) throw error;
      return data as ReviewCycle[];
    },
  });

  // Find the current active phase, or the next upcoming one, or the last completed one
  const activeCycle = cycles.find(
    (c) => computePhaseStatus(c, now) === "active"
  );
  const nextUpcoming = cycles.find(
    (c) => computePhaseStatus(c, now) === "upcoming"
  );
  const lastCompleted = [...cycles]
    .reverse()
    .find((c) => computePhaseStatus(c, now) === "completed");

  const currentCycle = activeCycle || nextUpcoming || lastCompleted || null;

  const currentStatus = currentCycle ? computePhaseStatus(currentCycle, now) : null;
  const currentProgress = currentCycle ? computeProgress(currentCycle, now) : 0;
  const currentDaysLeft = currentCycle ? daysLeft(currentCycle.end_date, now) : 0;

  return {
    cycles,
    currentCycle,
    currentStatus,
    currentProgress,
    currentDaysLeft,
    isLoading,
  };
}
