import { OptimizationPanel } from "@/components/OptimizationPanel";
import { useDashboardStore } from "@/store/dashboardStore";

export const DistributionOptimizationPage = () => {
  const depots = useDashboardStore((state) => state.depots);
  const stations = useDashboardStore((state) => state.stations);
  const trucks = useDashboardStore((state) => state.trucks);
  const optimizationJob = useDashboardStore((state) => state.optimizationJob);
  const runOptimization = useDashboardStore((state) => state.runOptimization);

  return (
    <OptimizationPanel
      depots={depots}
      stationDemands={[...stations].sort((a, b) => a.daysToStockout - b.daysToStockout)}
      trucks={trucks}
      result={optimizationJob.result}
      status={optimizationJob.status}
      progress={optimizationJob.progress}
      onRun={runOptimization}
    />
  );
};
