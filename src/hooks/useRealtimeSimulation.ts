import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export const useRealtimeSimulation = () => {
  const tickRealtime = useDashboardStore((state) => state.tickRealtime);

  useEffect(() => {
    const interval = window.setInterval(() => {
      tickRealtime();
    }, 2200);

    return () => window.clearInterval(interval);
  }, [tickRealtime]);
};
