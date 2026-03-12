import {
  AlertTriangle,
  BrainCircuit,
  CloudSun,
  Fuel,
  Route,
  TimerReset,
  Truck as TruckIcon,
  Waves,
} from "lucide-react";
import type {
  AlertSeverity,
  Depot,
  OptimizationResult,
  OptimizationRiskLevel,
  Station,
  Truck,
} from "@/types";
import {
  formatCompactMnt,
  formatCompactNumber,
  formatHours,
  formatMnt,
  formatNumber,
  formatPercent,
} from "@/utils/format";
import { deriveRecommendedRefill } from "@/utils/metrics";
import { PanelCard } from "./ui/PanelCard";
import { SectionHeading } from "./ui/SectionHeading";

interface OptimizationPanelProps {
  depots: Depot[];
  stationDemands: Station[];
  trucks: Truck[];
  result: OptimizationResult | null;
  status: "idle" | "loading" | "succeeded";
  progress: number;
  onRun: () => void;
}

const riskTone: Record<OptimizationRiskLevel, string> = {
  low: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  moderate: "border-fuel-amber/30 bg-fuel-amber/10 text-fuel-amber",
  high: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

const severityTone: Record<AlertSeverity, string> = {
  info: "border-fuel-cyan/30 bg-fuel-cyan/10 text-fuel-cyan",
  warning: "border-fuel-amber/30 bg-fuel-amber/10 text-fuel-amber",
  critical: "border-rose-400/30 bg-rose-500/10 text-rose-200",
};

export const OptimizationPanel = ({
  depots,
  stationDemands,
  trucks,
  result,
  status,
  progress,
  onRun,
}: OptimizationPanelProps) => {
  const focusStations = stationDemands.slice(0, 5);
  const totalDemandLitres = focusStations.reduce(
    (sum, station) => sum + Math.round(deriveRecommendedRefill(station)),
    0,
  );
  const readyTrucks = trucks.filter((truck) => truck.status === "Ready").length;
  const matrixStations = focusStations.slice(0, 4);
  const matrixValues = depots.map((depot, depotIndex) =>
    matrixStations.map((station, stationIndex) =>
      Math.round(
        160 +
          depotIndex * 29 +
          stationIndex * 24 +
          Math.abs(station.latitude - 46.8) * 7 +
          Math.abs(station.longitude - 106.9) * 3,
      ),
    ),
  );
  const maxMatrix = Math.max(...matrixValues.flat(), 1);
  const routeCount = result?.routes.length ?? Math.min(readyTrucks || trucks.length, 3);
  const totalCost = result?.totalDeliveryCostMnt ?? Math.round(totalDemandLitres * 22 + routeCount * 1900000);
  const totalHours = result?.totalRouteTimeHours ?? Number((routeCount * 5.8).toFixed(1));
  const onTime = result?.onTimeDeliveryPct ?? 93.2;
  const fitness = result?.fitnessScore ?? 0;

  return (
    <div className="space-y-6">
      <PanelCard className="overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_38%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.86))]" />
        <div className="relative space-y-6">
          <SectionHeading
            eyebrow="Optimization Command"
            title="Distribution Optimization"
            subtitle="Visual dispatch planning for demand pressure, route timing, weather penalties, and delivery cost control."
            action={
              <button
                type="button"
                onClick={onRun}
                disabled={status === "loading"}
                className="inline-flex items-center gap-2 rounded-full bg-fuel-cyan px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-white disabled:cursor-wait disabled:bg-slate-500 disabled:text-slate-100"
              >
                <BrainCircuit className="h-4 w-4" />
                {status === "loading" ? "Optimizing..." : "Run Genetic Optimization"}
              </button>
            }
          />

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="panel-soft p-4">
                <p className="eyebrow">Dispatch demand</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {formatCompactNumber(totalDemandLitres)} L
                </p>
                <p className="mt-2 text-sm text-slate-400">{focusStations.length} high-pressure stations</p>
              </div>
              <div className="panel-soft p-4">
                <p className="eyebrow">Delivery cost</p>
                <p className="mt-3 text-2xl font-semibold text-white">{formatCompactMnt(totalCost)}</p>
                <p className="mt-2 text-sm text-slate-400">Distance, time, weather, stockout protection</p>
              </div>
              <div className="panel-soft p-4">
                <p className="eyebrow">Route time</p>
                <p className="mt-3 text-2xl font-semibold text-white">{formatHours(totalHours)}</p>
                <p className="mt-2 text-sm text-slate-400">{routeCount} truck routes in active plan</p>
              </div>
              <div className="panel-soft p-4">
                <p className="eyebrow">Fitness / on-time</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {result ? `${fitness} / ${formatPercent(onTime)}` : "--"}
                </p>
                <p className="mt-2 text-sm text-slate-400">Multi-objective score and service confidence</p>
              </div>
            </div>

            <div className="panel-soft p-5">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Optimization cycle</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-fuel-cyan via-sky-400 to-fuel-blue transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Minimize transport cost",
                  "Prevent critical stockout",
                  "Balance station inventory",
                  "Reduce fuel loss exposure",
                ].map((goal) => (
                  <div
                    key={goal}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200"
                  >
                    {goal}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {readyTrucks} trucks ready
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {depots.length} depots online
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  Weather-aware routing
                </span>
              </div>
            </div>
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard>
          <SectionHeading
            eyebrow="Dispatch Visual"
            title="Route Command Board"
            subtitle="Truck-by-truck movement plan with delivery order, route time, and weather drag."
          />
          {result ? (
            <div className="space-y-4">
              {result.routes.map((route) => (
                <div key={route.truckId} className="panel-soft overflow-hidden p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-fuel-cyan">
                        <TruckIcon className="h-4 w-4" />
                        <p className="text-sm font-medium text-white">{route.truckName}</p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${riskTone[route.riskLevel]}`}
                        >
                          {route.riskLevel} risk
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{route.path.join(" -> ")}</p>
                    </div>
                    <div className="grid min-w-[240px] gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Route cost</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCompactMnt(route.routeCostMnt)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">ETA</p>
                        <p className="mt-2 text-lg font-semibold text-white">{formatHours(route.etaHours)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                        <span>Route flow</span>
                        <span>{formatCompactNumber(route.loadLitres)} L assigned</span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                        {route.path.map((stop, index) => (
                          <div key={`${route.truckId}-${stop}-${index}`} className="flex items-center gap-2">
                            <div className="min-w-[130px] rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                              {stop}
                            </div>
                            {index < route.path.length - 1 ? (
                              <div className="h-[2px] w-10 rounded-full bg-gradient-to-r from-fuel-cyan to-fuel-blue" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/5">
                        <div className="flex h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-fuel-cyan"
                            style={{ width: `${Math.min(82, (route.distanceKm / 420) * 100)}%` }}
                          />
                          <div
                            className="bg-fuel-amber"
                            style={{ width: `${Math.min(24, route.delayHours * 10)}%` }}
                          />
                          <div className="flex-1 bg-white/[0.04]" />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {route.stationNames.map((stationName) => (
                          <span
                            key={stationName}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300"
                          >
                            {stationName}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                      <div className="flex items-center gap-2 text-fuel-amber">
                        <CloudSun className="h-4 w-4" />
                        <p className="text-sm font-medium text-white">{route.weatherCondition}</p>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Distance</p>
                          <p className="mt-1 text-base font-semibold text-white">{route.distanceKm} km</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Service time</p>
                          <p className="mt-1 text-base font-semibold text-white">
                            {formatHours(route.serviceHours)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Delay drag</p>
                          <p className="mt-1 text-base font-semibold text-white">{formatHours(route.delayHours)}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {route.issues.map((issue) => (
                          <div
                            key={issue}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300"
                          >
                            {issue}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-soft flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Route className="h-12 w-12 text-fuel-cyan" />
              <p className="mt-4 text-lg font-medium text-white">Run an optimization cycle to render routes</p>
              <p className="mt-2 max-w-lg text-sm text-slate-400">
                The route board will show truck dispatch order, weather drag, route time, route cost, and
                prioritized deliveries for the most exposed stations.
              </p>
            </div>
          )}
        </PanelCard>

        <div className="space-y-6">
          <PanelCard>
            <SectionHeading
              eyebrow="Optimization Tasks"
              title="Task Pipeline"
              subtitle="Explain what the mock optimizer solved during the dispatch cycle."
            />
            <div className="space-y-3">
              {(result?.tasks ?? []).length > 0 ? (
                result?.tasks.map((task, index) => (
                  <div key={task.id} className="panel-soft flex gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-fuel-cyan/20 bg-fuel-cyan/10 text-fuel-cyan">
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-200">
                          {task.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{task.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-fuel-cyan">{task.impactLabel}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="panel-soft p-4 text-sm text-slate-400">
                  Run the optimizer to see demand scoring, depot assignment, truck balancing, and weather
                  penalty steps.
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard>
            <SectionHeading
              eyebrow="Issues"
              title="Constraint and Time Risks"
              subtitle="Weather, fleet, and stockout pressure that can distort the dispatch plan."
            />
            <div className="space-y-3">
              {(result?.issues ?? []).length > 0 ? (
                result?.issues.map((issue) => (
                  <div key={issue.id} className="panel-soft p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border ${severityTone[issue.severity]}`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{issue.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{issue.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                        {issue.penaltyLabel}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="panel-soft p-4 text-sm text-slate-400">
                  No issues loaded yet. After a run, this board will flag delay and cost pressure.
                </div>
              )}
            </div>
          </PanelCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <PanelCard>
            <SectionHeading
              eyebrow="Supply Inputs"
              title="Depots, Demand, and Fleet"
              subtitle="Operational inputs feeding the optimization window."
            />
            <div className="space-y-4">
              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-cyan">
                  <Fuel className="h-4 w-4" />
                  <p className="text-sm font-medium text-white">Depot capacity</p>
                </div>
                <div className="mt-4 space-y-3">
                  {depots.map((depot) => (
                    <div key={depot.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="text-white">{depot.name}</p>
                        <p className="text-slate-500">{depot.region}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-200">{formatCompactNumber(depot.availableLitres)} L</p>
                        <p className="text-slate-500">{depot.storageType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-amber">
                  <TimerReset className="h-4 w-4" />
                  <p className="text-sm font-medium text-white">Demand queue</p>
                </div>
                <div className="mt-4 space-y-3">
                  {focusStations.map((station) => (
                    <div key={station.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{station.name}</p>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                            {station.code} • {station.region}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                          {station.daysToStockout.toFixed(1)} d left
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                        <span>Recommended refill</span>
                        <span>{formatCompactNumber(deriveRecommendedRefill(station))} L</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-soft p-4">
                <div className="flex items-center gap-2 text-fuel-blue">
                  <TruckIcon className="h-4 w-4" />
                  <p className="text-sm font-medium text-white">Fleet readiness</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {trucks.map((truck) => (
                    <div key={truck.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{truck.name}</p>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          {truck.driver} • {formatCompactNumber(truck.capacityLitres)} L
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${
                          truck.status === "Ready"
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                            : truck.status === "En route"
                              ? "border-fuel-cyan/20 bg-fuel-cyan/10 text-fuel-cyan"
                              : "border-fuel-amber/20 bg-fuel-amber/10 text-fuel-amber"
                        }`}
                      >
                        {truck.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PanelCard>
              <SectionHeading
                eyebrow="Weather"
                title="Weather Impact Board"
                subtitle="Regional delay and extra dispatch cost applied to the current run."
              />
              <div className="space-y-3">
                {(result?.weather ?? []).length > 0 ? (
                  result?.weather.map((impact) => (
                    <div key={impact.id} className="panel-soft p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${riskTone[impact.severity]}`}
                          >
                            <Waves className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{impact.region}</p>
                            <p className="text-sm text-slate-400">{impact.condition}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${riskTone[impact.severity]}`}
                        >
                          {impact.severity}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                        <span>{formatHours(impact.delayHours)} delay</span>
                        <span>{formatCompactMnt(impact.extraCostMnt)}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{impact.summary}</p>
                    </div>
                  ))
                ) : (
                  <div className="panel-soft p-4 text-sm text-slate-400">
                    Weather penalties appear after the optimization run.
                  </div>
                )}
              </div>
            </PanelCard>

            <PanelCard>
              <SectionHeading
                eyebrow="Cost Stack"
                title="Time and Cost Drivers"
                subtitle="What is making the plan expensive right now."
              />
              <div className="space-y-3">
                {(result?.costBreakdown ?? []).length > 0 ? (
                  result?.costBreakdown.map((item) => {
                    const width = Math.max(18, (item.valueMnt / Math.max(totalCost, 1)) * 100);
                    return (
                      <div key={item.id} className="panel-soft p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm text-slate-200">{item.label}</p>
                          <p className="text-sm font-medium text-white">{formatCompactMnt(item.valueMnt)}</p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/5">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-fuel-cyan to-fuel-blue"
                            style={{ width: `${Math.min(100, width)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="panel-soft p-4 text-sm text-slate-400">
                    Cost stack will break down distance, driver time, weather penalties, and emergency
                    stockout protection.
                  </div>
                )}
              </div>
            </PanelCard>
          </div>

          <PanelCard>
            <SectionHeading
              eyebrow="Distance Matrix"
              title="Depot to Station Distance Matrix"
              subtitle="Heat-mapped travel distance for the highest-pressure stations."
            />
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm text-slate-300">
                <thead className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Depot</th>
                    {matrixStations.map((station) => (
                      <th key={station.id} className="pb-2 pr-4">
                        {station.code}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {depots.map((depot, depotIndex) => (
                    <tr key={depot.id}>
                      <td className="rounded-l-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-white">
                        {depot.name}
                      </td>
                      {matrixStations.map((station, stationIndex) => {
                        const distance = matrixValues[depotIndex][stationIndex];
                        const alpha = 0.18 + (distance / maxMatrix) * 0.42;
                        return (
                          <td
                            key={station.id}
                            className="border-y border-r border-white/8 px-4 py-3"
                            style={{
                              backgroundColor: `rgba(34, 211, 238, ${alpha})`,
                            }}
                          >
                            <div className="font-medium text-white">{distance} km</div>
                            <div className="mt-1 text-xs text-slate-900/80">
                              {formatNumber(Math.round(distance * 8200))} MNT
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
};
