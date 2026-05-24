"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/store/habitStore";
import { useAuth } from "@/context/AuthContext";

export function StoreInitializer() {
  const { user } = useAuth();
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const fetchStats = useHabitStore((s) => s.fetchStats);
  const fetchDailyTasks = useHabitStore((s) => s.fetchDailyTasks);

  useEffect(() => {
    if (!user) return; // Only run data fetching and background polling if user is authenticated

    const today = new Date().toISOString().split("T")[0];
    fetchHabits();
    fetchStats();
    fetchDailyTasks(today);

    // Soft polling every 30 seconds
    const interval = setInterval(() => {
      fetchHabits();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchHabits, fetchStats, fetchDailyTasks]);

  return null;
}
