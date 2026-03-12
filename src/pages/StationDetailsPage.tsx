import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CircleDollarSign,
  Fuel,
  Gauge,
  MapPinned,
  MoveRight,
  ShieldAlert,
  ThermometerSun,
  UserRound,
  Waves,
  Warehouse,
} from "lucide-react";
import { SalesChart } from "@/components/SalesChart";
import { Station3DView } from "@/components/Station3DView";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDashboardStore, useSelectedStation } from "@/store/dashboardStore";
import type { StationStatus } from "@/types";
import {
  formatCompactMnt,
  formatDateLabel,
  formatDateTime,
  formatMnt,
  formatNumber,
} from "@/utils/format";
import { deriveRecommendedRefill, sumUsableFuel } from "@/utils/metrics";

export const StationDetailsPage = () => {
  const { stationId } = useParams();
  const stations = useDashboardStore((state) => state.stations);
  const setSelectedStation = useDashboardStore((state) => state.setSelectedStation);
  const selectedStoreStation = useSelectedStation();
  const station = stations.find((item) => item.id === stationId) ?? selectedStoreStation;
  const [selectedTankId, setSelectedTankId] = useState("");

  useEffect(() => {
    if (station) {
      setSelectedStation(station.id);
    }
  }, [setSelectedStation, station]);

  useEffect(() => {
    if (!station) {
      return;
    }

    const hasCurrentTank = station.tanks.some((tank) => tank.id === selectedTankId);
    if (!hasCurrentTank) {
      setSelectedTankId(station.tanks[0]?.id ?? "");
    }
  }, [selectedTankId, station]);

  if (!station) {
    return null;
  }

  const selectedTank = station.tanks.find((tank) => tank.id === selectedTankId) ?? station.tanks[0];
  const usableStock = sumUsableFuel(station.tanks);
  const unavailableStock = station.currentFuelLitres - usableStock;
  const refillHistory = station.refillHistory.map((record) => ({
    label: formatDateLabel(record.date),
    litres: record.litres,
  }));
  const lossTrend = station.lossTrend.map((point) => ({ label: point.label, loss: point.value }));
  const thresholdTotals = useMemo(
    () => ({
      minimum: station.tanks.reduce((sum, tank) => sum + tank.inventory.minimumThresholdLitres, 0),
      reorder: station.tanks.reduce((sum, tank) => sum + tank.inventory.reorderThresholdLitres, 0),
      critical: station.tanks.reduce((sum, tank) => sum + tank.inventory.criticalThresholdLitres, 0),
    }),
    [station.tanks],
  );
  const selectedTankMetrics = useMemo(() => {
    const fillRatio =
      selectedTank.inventory.currentLitres / Math.max(selectedTank.inventory.capacityLitres, 1);
    const tankUsableStock = Math.max(
      0,
      selectedTank.inventory.currentLitres - selectedTank.inventory.unavailableLitres,
    );
    const allocatedDailyBurn =
      (station.dailySales.reduce((sum, point) => sum + point.litres, 0) / station.dailySales.length) *
      (selectedTank.inventory.capacityLitres / Math.max(station.tankCapacityLitres, 1));
    const daysRemaining = tankUsableStock / Math.max(allocatedDailyBurn, 1);
    const estimatedLossLitres =
      selectedTank.inventory.currentLitres * (selectedTank.inventory.depreciationRatePct / 100);
    const depletionTone: StationStatus =
      fillRatio <= 0.18 ? "critical" : fillRatio <= 0.34 ? "low_fuel" : "normal";

    return {
      fillRatio,
      usableStock: tankUsableStock,
      allocatedDailyBurn,
      daysRemaining,
      estimatedLossLitres,
      emptyCapacity: selectedTank.inventory.capacityLitres - selectedTank.inventory.currentLitres,
      depletionTone,
    };
  }, [selectedTank, station.dailySales, station.tankCapacityLitres]);

  const headerKpis = [
    { label: "Current stock", value: `${formatNumber(station.currentFuelLitres)} L`, tone: "text-white" },
    { label: "Usable stock", value: `${formatNumber(usableStock)} L`, tone: "text-white" },
    {
      label: "Days to stockout",
      value: `${station.daysToStockout.toFixed(1)} days`,
      tone: station.daysToStockout <= 2 ? "text-fuel-red" : "text-white",
    },
    { label: "Recommended refill", value: `${formatNumber(deriveRecommendedRefill(station))} L`, tone: "text-fuel-cyan" },
  ];

  const stationSignals = [
    { label: "Manager", value: station.manager, icon: UserRound },
    { label: "Nearest depot", value: station.nearestDepot, icon: MapPinned },
    { label: "Last refill", value: formatDateLabel(station.lastRefillDate), icon: CalendarClock },
    { label: "Predicted refill", value: formatDateLabel(station.predictedRefillDate), icon: Fuel },
  ];

  const liveStats = [
    {
      label: "Today revenue",
      value: formatCompactMnt(station.todayTugrikSold),
      icon: CircleDollarSign,
      spanClass: "sm:col-span-2",
      valueClass: "text-[1.65rem]",
    },
    {
      label: "Cars served",
      value: String(station.carsServed),
      icon: MoveRight,
      spanClass: "",
      valueClass: "text-xl",
    },
    {
      label: "Avg litres / car",
      value: `${station.averageLitresPerCar.toFixed(1)} L`,
      icon: Gauge,
      spanClass: "",
      valueClass: "text-xl",
    },
    {
      label: "Queue level",
      value: `${station.queueLevel} vehicles`,
      icon: AlertTriangle,
      spanClass: "sm:col-span-2",
      valueClass: "text-xl",
    },
  ];

  return (
    <div className="space-y-6">
      <PanelCard className="overflow-hidden">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-fuel-red/[0.16] via-fuel-amber/[0.08] to-fuel-cyan/[0.12] blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                to="/map"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to map
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="eyebrow">{station.region}</p>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {station.code}
                </p>
                <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {station.city} · {station.stationType}
                </p>
                <StatusBadge label={station.status} status={station.status} />
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white">{station.name}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Critical station control view with tank inspection, refill forecasting, and live fueling operations.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              {headerKpis.map((item) => (
                <div key={item.label} className="panel-soft p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-xl font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PanelCard>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="space-y-6">
          <Station3DView
            station={station}
            liveMetrics={station}
            vehicleEvents={station.vehicleEvents}
            selectedTankId={selectedTank.id}
            onSelectTank={setSelectedTankId}
          />

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="panel-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tank height</p>
              <p className="mt-2 text-xl font-semibold text-white">{station.fuelHeightMeters.toFixed(2)} m</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Temperature</p>
              <p className="mt-2 text-xl font-semibold text-white">{station.temperature.toFixed(1)}°C</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Humidity</p>
              <p className="mt-2 text-xl font-semibold text-white">{station.humidity.toFixed(1)}%</p>
            </div>
            <div className="panel-soft p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Loss estimate</p>
              <p className="mt-2 text-xl font-semibold text-white">{station.depreciationRate.toFixed(2)}%</p>
            </div>
          </div>

          <SalesChart
            title="Hourly Fuel Sold"
            subtitle="Live hourly litres and tugrik sold."
            variant="line"
            data={station.hourlySales.map((point) => ({
              label: point.label,
              litres: point.litres,
              revenue: point.revenue,
            }))}
            series={[
              { key: "litres", color: "#4DE2D1", name: "Litres" },
              { key: "revenue", color: "#4A9CFF", name: "Revenue" },
            ]}
            heightClass="h-[24rem]"
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SalesChart
              title="Refill History"
              subtitle="Recent refill volumes by date."
              variant="bar"
              data={refillHistory}
              series={[{ key: "litres", color: "#4DE2D1", name: "Refill litres" }]}
              heightClass="h-[20rem]"
            />
            <SalesChart
              title="Loss Trend"
              subtitle="Depreciation and evaporation estimate."
              variant="area"
              data={lossTrend}
              series={[{ key: "loss", color: "#F7B955", name: "Loss %" }]}
              heightClass="h-[20rem]"
            />
          </div>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <PanelCard>
            <SectionHeading
              eyebrow="Selected Tank"
              title={selectedTank.label}
              subtitle="Click any tank in the 3D scene to inspect depletion, loss, and stockout profile."
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{selectedTank.inventory.fuelType}</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {(selectedTankMetrics.fillRatio * 100).toFixed(0)}%
                </p>
              </div>
              <StatusBadge label={selectedTankMetrics.depletionTone} status={selectedTankMetrics.depletionTone} />
            </div>
            <div className="mt-5">
              <div className="h-4 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuel-cyan via-fuel-blue to-fuel-amber transition-all"
                  style={{ width: `${Math.max(4, selectedTankMetrics.fillRatio * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Depletion view</span>
                <span>{selectedTank.inventory.fuelHeightMeters.toFixed(2)} m level</span>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="panel-soft p-4">
                <p className="text-slate-500">Current stock</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(selectedTank.inventory.currentLitres)} L</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Usable stock</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(selectedTankMetrics.usableStock)} L</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Empty capacity</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(selectedTankMetrics.emptyCapacity)} L</p>
              </div>
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-amber">
                  <Gauge className="h-4 w-4" />
                  <span>Days to empty</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{selectedTankMetrics.daysRemaining.toFixed(1)} d</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Depreciation / loss</p>
                <p className="mt-2 text-xl font-semibold text-white">{selectedTank.inventory.depreciationRatePct.toFixed(2)}%</p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatNumber(selectedTankMetrics.estimatedLossLitres)} L estimated loss
                </p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Projected burn</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(selectedTankMetrics.allocatedDailyBurn)} L/day</p>
              </div>
            </div>
          </PanelCard>

          <PanelCard>
            <SectionHeading
              eyebrow="Station Health"
              title="Inventory Forecast"
              subtitle="Threshold pressure and safety margin for dispatch planning."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-red">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Unavailable stock</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(unavailableStock)} L</p>
              </div>
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-amber">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Risk window</span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-white">{station.daysToStockout.toFixed(1)} days</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
              <div className="panel-soft p-4">
                <p className="text-slate-500">Minimum threshold</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(thresholdTotals.minimum)} L</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Reorder threshold</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(thresholdTotals.reorder)} L</p>
              </div>
              <div className="panel-soft p-4">
                <p className="text-slate-500">Critical threshold</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(thresholdTotals.critical)} L</p>
              </div>
            </div>
          </PanelCard>

          <PanelCard>
            <SectionHeading
              eyebrow="Signals"
              title="Station Signals"
              subtitle="Metadata and depot coordination."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {stationSignals.map((item) => (
                <div key={item.label} className="panel-soft flex items-center gap-3 p-4">
                  <div className="rounded-2xl bg-white/5 p-3 text-fuel-cyan">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                    <p className="mt-1 font-medium text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
          
        </div>
      </div>

      <PanelCard>
        <SectionHeading
          eyebrow="Activity"
          title="Live Fueling Feed"
          subtitle="Station queue and live fueling."
        />
        <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {liveStats.map((item) => (
                <div key={item.label} className={`panel-soft p-4 ${item.spanClass}`}>
                  <div className="flex items-center gap-2 text-fuel-cyan">
                    <item.icon className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</span>
                  </div>
                  <p className={`mt-3 font-semibold text-white ${item.valueClass}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="panel-soft p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Operator note</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Live fueling events below update from the current station simulation. This panel is station-only and expands independently from the sticky sidebar.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {station.vehicleEvents.slice(0, 8).map((event) => (
              <div key={event.id} className="panel-soft flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    {event.vehicleType} · {event.fuelType}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Bay {event.bay} · {event.direction} · {formatDateTime(event.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {event.dispensedLitres > 0
                      ? `${event.dispensedLitres.toFixed(0)} / ${event.litres.toFixed(0)} L`
                      : `${event.litres.toFixed(0)} L`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatCompactMnt(event.amountMnt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PanelCard>
    </div>
  );
};
