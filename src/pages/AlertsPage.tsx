import { AlertsPanel } from "@/components/AlertsPanel";
import { useDashboardStore } from "@/store/dashboardStore";

export const AlertsPage = () => {
  const alerts = useDashboardStore((state) => state.alerts);
  const acknowledgeAlert = useDashboardStore((state) => state.acknowledgeAlert);

  return <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />;
};
