import { useMemo, useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDashboardStore, useSelectedStation } from "@/store/dashboardStore";
import { formatDateLabel, formatMnt, formatNumber } from "@/utils/format";

export const SalesAnalyticsPage = () => {
  const [scope, setScope] = useState<"network" | "station">("network");
  const stations = useDashboardStore((state) => state.stations);
  const selectedStation = useSelectedStation();

  const sourceStations = scope === "network" ? stations : [selectedStation];
  const activeLabel = scope === "network" ? "Network-wide" : selectedStation.name;

  const hourly = useMemo(
    () =>
      sourceStations[0].hourlySales.map((point, index) => ({
        label: point.label,
        litres: sourceStations.reduce((sum, station) => sum + station.hourlySales[index].litres, 0),
        revenue: sourceStations.reduce((sum, station) => sum + station.hourlySales[index].revenue, 0),
      })),
    [sourceStations],
  );

  const daily = useMemo(
    () =>
      sourceStations[0].dailySales.map((point, index) => ({
        label: point.label,
        litres: sourceStations.reduce((sum, station) => sum + station.dailySales[index].litres, 0),
        revenue: sourceStations.reduce((sum, station) => sum + station.dailySales[index].revenue, 0),
      })),
    [sourceStations],
  );

  const weekly = useMemo(
    () =>
      sourceStations[0].weeklySales.map((point, index) => ({
        label: point.label,
        litres: sourceStations.reduce((sum, station) => sum + station.weeklySales[index].litres, 0),
        revenue: sourceStations.reduce((sum, station) => sum + station.weeklySales[index].revenue, 0),
      })),
    [sourceStations],
  );

  const byFuelType = useMemo(() => {
    const summary = new Map<string, number>();
    sourceStations.forEach((station) => {
      station.tanks.forEach((tank) => {
        summary.set(
          tank.inventory.fuelType,
          (summary.get(tank.inventory.fuelType) ?? 0) + tank.inventory.currentLitres,
        );
      });
    });
    return Array.from(summary.entries()).map(([name, litres], index) => ({
      label: name,
      "AI-92": name === "AI-92" ? litres : 0,
      "AI-95": name === "AI-95" ? litres : 0,
      Diesel: name === "Diesel" ? litres : 0,
      LPG: name === "LPG" ? litres : 0,
      fill: ["#4DE2D1", "#4A9CFF", "#F7B955", "#B07CFF"][index % 4],
    }));
  }, [sourceStations]);

  const refills = selectedStation.refillHistory.map((entry) => ({
    label: formatDateLabel(entry.date),
    litres: entry.litres,
  }));
  const stockout = sourceStations
    .slice(0, 6)
    .map((station) => ({ label: station.code, days: Number(station.daysToStockout.toFixed(1)) }));

  return (
    <div className="space-y-6">
      <PanelCard>
        <SectionHeading
          eyebrow="Analytics"
          title="Fuel Sales Analytics"
          subtitle={`${activeLabel} sales trends, fuel mix, refill cadence, and stockout forecasts.`}
          action={
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              {(["network", "station"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={`rounded-full px-4 py-2 text-sm ${scope === option ? "bg-fuel-cyan text-ink-950" : "text-slate-300"}`}
                >
                  {option === "network" ? "Network-wide" : "Selected station"}
                </button>
              ))}
            </div>
          }
        />
        <div className="grid gap-4 md:grid-cols-4">
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Total litres sold</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatNumber(sourceStations.reduce((sum, station) => sum + station.todayLitresSold, 0))} L
            </p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Total tugrik revenue</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatMnt(sourceStations.reduce((sum, station) => sum + station.todayTugrikSold, 0))}
            </p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Estimated stockout date</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatDateLabel(selectedStation.predictedRefillDate)}
            </p>
          </div>
          <div className="panel-soft p-4">
            <p className="text-sm text-slate-500">Daily average</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatNumber(daily.reduce((sum, point) => sum + Number(point.litres), 0) / daily.length)} L
            </p>
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SalesChart
          title="Hourly Sales"
          subtitle="Realtime hourly fuel sold and revenue."
          variant="line"
          data={hourly}
          series={[
            { key: "litres", color: "#4DE2D1", name: "Litres" },
            { key: "revenue", color: "#4A9CFF", name: "Revenue" },
          ]}
        />
        <SalesChart
          title="Daily Sales"
          subtitle="Daily network sales accumulation."
          variant="bar"
          data={daily}
          series={[
            { key: "litres", color: "#4DE2D1", name: "Litres" },
            { key: "revenue", color: "#4A9CFF", name: "Revenue" },
          ]}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SalesChart
          title="Weekly Fuel Sold"
          subtitle="Weekly sales and demand momentum."
          variant="area"
          data={weekly}
          series={[
            { key: "litres", color: "#4DE2D1", name: "Litres" },
            { key: "revenue", color: "#F7B955", name: "Revenue" },
          ]}
        />
        <SalesChart
          title="Estimated Stockout Horizon"
          subtitle="Days remaining before reorder is required."
          variant="bar"
          data={stockout}
          series={[{ key: "days", color: "#FF5D73", name: "Days remaining" }]}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SalesChart
          title="Sales By Fuel Type"
          subtitle="Inventory and active sales exposure per fuel type."
          variant="stacked-bar"
          data={byFuelType}
          series={[
            { key: "AI-92", color: "#4DE2D1", name: "AI-92" },
            { key: "AI-95", color: "#4A9CFF", name: "AI-95" },
            { key: "Diesel", color: "#F7B955", name: "Diesel" },
            { key: "LPG", color: "#B07CFF", name: "LPG" },
          ]}
        />
        <SalesChart
          title="Tank Refill History"
          subtitle="Recent refill volumes for the selected station."
          variant="bar"
          data={refills}
          series={[{ key: "litres", color: "#4DE2D1", name: "Refill litres" }]}
        />
      </div>
    </div>
  );
};
