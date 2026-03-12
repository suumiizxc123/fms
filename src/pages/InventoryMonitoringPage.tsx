import { InventoryCard } from "@/components/InventoryCard";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDashboardStore } from "@/store/dashboardStore";
import { formatNumber } from "@/utils/format";
import { deriveRecommendedRefill } from "@/utils/metrics";

export const InventoryMonitoringPage = () => {
  const stations = useDashboardStore((state) => state.stations);
  const sortedStations = [...stations].sort((a, b) => a.daysToStockout - b.daysToStockout);

  const reorderSoon = sortedStations.filter((station) => station.daysToStockout <= 5).length;
  const criticalSoon = sortedStations.filter((station) => station.daysToStockout <= 2).length;
  const overdue = sortedStations.filter((station) => {
    const days = (Date.now() - new Date(station.lastRefillDate).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 10;
  }).length;

  return (
    <div className="space-y-6">
      <PanelCard>
        <SectionHeading
          eyebrow="Inventory"
          title="Inventory Monitoring"
          subtitle="Usable stock, thresholds, projected consumption, and refill recommendation by station."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Reorder soon</p>
            <p className="mt-2 text-2xl font-semibold text-white">{reorderSoon}</p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Critical within 48h</p>
            <p className="mt-2 text-2xl font-semibold text-white">{criticalSoon}</p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Refill overdue</p>
            <p className="mt-2 text-2xl font-semibold text-white">{overdue}</p>
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-2">
        {sortedStations.map((station) => (
          <InventoryCard key={station.id} station={station} />
        ))}
      </div>

      <PanelCard>
        <SectionHeading
          eyebrow="Forecast"
          title="Network Inventory Table"
          subtitle="Thresholds, days remaining, and recommended dispatch quantities."
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase tracking-[0.25em] text-slate-500">
              <tr>
                <th className="pb-3 pr-4">Station</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Current stock</th>
                <th className="pb-3 pr-4">Days remaining</th>
                <th className="pb-3 pr-4">Projected consumption</th>
                <th className="pb-3 pr-4">Recommended refill</th>
              </tr>
            </thead>
            <tbody>
              {sortedStations.map((station) => {
                const projectedDaily = station.dailySales.reduce((sum, point) => sum + point.litres, 0) / station.dailySales.length;
                return (
                  <tr key={station.id} className="border-t border-white/[0.06]">
                    <td className="py-4 pr-4 text-white">{station.name}</td>
                    <td className="py-4 pr-4"><StatusBadge label={station.status} status={station.status} /></td>
                    <td className="py-4 pr-4">{formatNumber(station.currentFuelLitres)} L</td>
                    <td className="py-4 pr-4">{station.daysToStockout.toFixed(1)} days</td>
                    <td className="py-4 pr-4">{formatNumber(projectedDaily)} L/day</td>
                    <td className="py-4 pr-4 text-fuel-cyan">{formatNumber(deriveRecommendedRefill(station))} L</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PanelCard>
    </div>
  );
};
