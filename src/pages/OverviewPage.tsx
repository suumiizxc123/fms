import {
  AlertTriangle,
  BarChart3,
  Fuel,
  ShieldAlert,
  TimerReset,
  Truck,
  Wallet,
  Waves,
} from "lucide-react";
import { AlertsPanel } from "@/components/AlertsPanel";
import { KPIGrid } from "@/components/KPIGrid";
import { SalesChart } from "@/components/SalesChart";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDashboardStore, useNetworkKpis } from "@/store/dashboardStore";
import { formatCompactNumber, formatMnt, formatNumber } from "@/utils/format";
import { buildFuelMix, buildLossTrend, buildStatusMix, deriveRecommendedRefill } from "@/utils/metrics";

export const OverviewPage = () => {
  const stations = useDashboardStore((state) => state.stations);
  const alerts = useDashboardStore((state) => state.alerts);
  const kpis = useNetworkKpis();

  const highRiskStations = [...stations].sort((a, b) => a.daysToStockout - b.daysToStockout).slice(0, 5);
  const hourlyNetwork = stations[0].hourlySales.map((point, index) => ({
    label: point.label,
    litres: stations.reduce((sum, station) => sum + station.hourlySales[index].litres, 0),
    revenue: stations.reduce((sum, station) => sum + station.hourlySales[index].revenue, 0),
  }));
  const statusMix = buildStatusMix(stations).map((item, index) => ({
    ...item,
    fill: ["#55D89B", "#F7B955", "#FF5D73", "#94A3B8"][index],
  }));
  const fuelMix = buildFuelMix(stations).map((item, index) => ({
    ...item,
    fill: ["#4DE2D1", "#4A9CFF", "#F7B955", "#B07CFF"][index % 4],
  }));
  const lossTrend = buildLossTrend(stations).map((item) => ({ label: item.label, loss: item.value }));
  const refillCalendar = highRiskStations.map((station) => ({
    label: station.code,
    refill: deriveRecommendedRefill(station),
  }));

  return (
    <div className="space-y-6">
      <KPIGrid
        items={[
          {
            title: "Total network fuel",
            value: `${formatCompactNumber(kpis.totalFuelLitres)} L`,
            detail: "Available across all stations and tanks.",
            icon: Fuel,
            accent: "cyan",
          },
          {
            title: "Stations online",
            value: `${kpis.stationsOnline}/${stations.length}`,
            detail: "Telemetry and pump control actively reporting.",
            icon: Waves,
            accent: "green",
          },
          {
            title: "Critical stations",
            value: String(kpis.criticalStations),
            detail: "Stations at immediate dispatch risk.",
            icon: ShieldAlert,
            accent: "red",
          },
          {
            title: "Today revenue",
            value: formatMnt(kpis.todayRevenueMnt),
            detail: `${formatCompactNumber(kpis.todayLitresSold)} litres sold today.`,
            icon: Wallet,
            accent: "blue",
          },
          {
            title: "Active alerts",
            value: String(kpis.activeAlerts),
            detail: "Unacknowledged anomalies needing review.",
            icon: AlertTriangle,
            accent: "amber",
          },
          {
            title: "Vehicles served",
            value: formatCompactNumber(kpis.vehiclesServed),
            detail: "Network-wide fueling events processed today.",
            icon: Truck,
            accent: "cyan",
          },
          {
            title: "Projected stockouts",
            value: String(kpis.projectedStockouts),
            detail: "Stations forecast to hit reserve inside 72h.",
            icon: TimerReset,
            accent: "amber",
          },
          {
            title: "Network throughput",
            value: `${formatNumber(Math.round(kpis.todayLitresSold / stations.length))} L`,
            detail: "Average litres sold per station today.",
            icon: BarChart3,
            accent: "blue",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SalesChart
          title="Hourly Network Sales"
          subtitle="Realtime litres and revenue accumulation across all stations."
          variant="area"
          data={hourlyNetwork}
          series={[
            { key: "litres", color: "#4DE2D1", name: "Litres" },
            { key: "revenue", color: "#4A9CFF", name: "Revenue" },
          ]}
        />
        <div className="grid gap-6">
          <SalesChart
            title="Stock Status Mix"
            subtitle="Station distribution by operational tank status."
            variant="radial"
            data={statusMix}
            series={[{ key: "value", color: "#4DE2D1", name: "Stations" }]}
          />
          <SalesChart
            title="Fuel Mix"
            subtitle="Network inventory by fuel type."
            variant="pie"
            data={fuelMix}
            series={[{ key: "value", color: "#4DE2D1", name: "Litres" }]}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <PanelCard>
          <SectionHeading
            eyebrow="Risk focus"
            title="High Risk Stations"
            subtitle="Most urgent stations by projected stockout window."
          />
          <div className="space-y-3">
            {highRiskStations.map((station) => (
              <div key={station.id} className="panel-soft flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-white">{station.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {station.region} · {station.daysToStockout.toFixed(1)} days remaining
                  </p>
                </div>
                <StatusBadge label={station.status} status={station.status} />
              </div>
            ))}
          </div>
        </PanelCard>
        <div className="grid gap-6">
          <SalesChart
            title="Depreciation / Loss Trend"
            subtitle="Average network fuel loss estimate by week."
            variant="line"
            data={lossTrend}
            series={[{ key: "loss", color: "#F7B955", name: "Loss %" }]}
          />
          <SalesChart
            title="Refill Pressure"
            subtitle="Recommended refill quantities for the highest-risk stations."
            variant="bar"
            data={refillCalendar}
            series={[{ key: "refill", color: "#4DE2D1", name: "Refill litres" }]}
          />
        </div>
      </div>

      <AlertsPanel alerts={alerts.slice(0, 6)} />
    </div>
  );
};
