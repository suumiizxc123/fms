import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PanelCard } from "@/components/ui/PanelCard";
import { useRealtimeSimulation } from "@/hooks/useRealtimeSimulation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const OverviewPage = lazy(() =>
  import("@/pages/OverviewPage").then((module) => ({ default: module.OverviewPage })),
);
const MapViewPage = lazy(() =>
  import("@/pages/MapViewPage").then((module) => ({ default: module.MapViewPage })),
);
const StationDetailsPage = lazy(() =>
  import("@/pages/StationDetailsPage").then((module) => ({ default: module.StationDetailsPage })),
);
const SalesAnalyticsPage = lazy(() =>
  import("@/pages/SalesAnalyticsPage").then((module) => ({ default: module.SalesAnalyticsPage })),
);
const InventoryMonitoringPage = lazy(() =>
  import("@/pages/InventoryMonitoringPage").then((module) => ({
    default: module.InventoryMonitoringPage,
  })),
);
const DistributionOptimizationPage = lazy(() =>
  import("@/pages/DistributionOptimizationPage").then((module) => ({
    default: module.DistributionOptimizationPage,
  })),
);
const AlertsPage = lazy(() =>
  import("@/pages/AlertsPage").then((module) => ({ default: module.AlertsPage })),
);

const App = () => {
  useRealtimeSimulation();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen p-4 lg:p-6">
          <div className="mx-auto max-w-[1720px]">
            <PanelCard className="flex min-h-[220px] items-center justify-center text-slate-300">
              Loading operational view...
            </PanelCard>
          </div>
        </div>
      }
    >
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="/map" element={<MapViewPage />} />
          <Route path="/stations/:stationId" element={<StationDetailsPage />} />
          <Route path="/stations" element={<Navigate to="/" replace />} />
          <Route path="/analytics" element={<SalesAnalyticsPage />} />
          <Route path="/inventory" element={<InventoryMonitoringPage />} />
          <Route path="/optimization" element={<DistributionOptimizationPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
