import type {
  AlertSeverity,
  Depot,
  OptimizationCostBreakdown,
  OptimizationIssue,
  OptimizationResult,
  OptimizationRiskLevel,
  OptimizationRoute,
  OptimizationTask,
  OptimizationWeatherImpact,
  Station,
  Truck,
} from "@/types";
import { deriveRecommendedRefill } from "./metrics";

const weatherByRegion: Record<
  string,
  { condition: string; delayHours: number; costMultiplier: number; severity: OptimizationRiskLevel }
> = {
  Dornogovi: {
    condition: "Dust wind corridor",
    delayHours: 1.3,
    costMultiplier: 1.18,
    severity: "high",
  },
  Umnugovi: {
    condition: "Crosswind and heat shimmer",
    delayHours: 1.1,
    costMultiplier: 1.14,
    severity: "high",
  },
  Selenge: {
    condition: "Wet road and river fog",
    delayHours: 0.7,
    costMultiplier: 1.08,
    severity: "moderate",
  },
  Darkhan: {
    condition: "Night frost pockets",
    delayHours: 0.8,
    costMultiplier: 1.09,
    severity: "moderate",
  },
  Tov: {
    condition: "Stable corridor",
    delayHours: 0.2,
    costMultiplier: 1.03,
    severity: "low",
  },
};

const getWeatherProfile = (region: string) =>
  weatherByRegion[region] ?? {
    condition: "Normal route weather",
    delayHours: 0.4,
    costMultiplier: 1.05,
    severity: "low" as const,
  };

const severityFromDays = (daysToStockout: number): AlertSeverity => {
  if (daysToStockout <= 2) {
    return "critical";
  }

  if (daysToStockout <= 4) {
    return "warning";
  }

  return "info";
};

const buildTaskPipeline = (
  stations: Station[],
  depots: Depot[],
  readyTruckCount: number,
): OptimizationTask[] => [
  {
    id: "task-demand",
    title: "Demand normalization",
    description: `Ranked ${stations.length} stations by stockout pressure and refill threshold.`,
    status: "completed",
    impactLabel: `${stations.filter((station) => station.daysToStockout <= 3).length} urgent nodes`,
  },
  {
    id: "task-depot",
    title: "Depot assignment",
    description: `Matched depot capacity and fuel mix across ${depots.length} supply banks.`,
    status: "completed",
    impactLabel: `${depots.length} depots balanced`,
  },
  {
    id: "task-fleet",
    title: "Fleet load balancing",
    description: `Packed demand onto active trucks while avoiding maintenance assets.`,
    status: "completed",
    impactLabel: `${readyTruckCount} trucks scheduled`,
  },
  {
    id: "task-weather",
    title: "Weather and time penalties",
    description: "Applied route penalties for wind, wet-road slowdown, and high-risk late arrivals.",
    status: "completed",
    impactLabel: "Delay-aware scoring",
  },
  {
    id: "task-score",
    title: "Fitness scoring",
    description: "Scored route quality against cost, stockout protection, and inventory balance.",
    status: "completed",
    impactLabel: "Multi-objective score",
  },
];

const buildWeatherImpacts = (stations: Station[]): OptimizationWeatherImpact[] =>
  stations.slice(0, 4).map((station) => {
    const profile = getWeatherProfile(station.region);
    const recommendedRefill = Math.round(deriveRecommendedRefill(station));
    return {
      id: `weather-${station.id}`,
      region: station.region,
      condition: profile.condition,
      severity: profile.severity,
      delayHours: Number((profile.delayHours + recommendedRefill / 100000).toFixed(1)),
      extraCostMnt: Math.round(recommendedRefill * (profile.costMultiplier - 1) * 32),
      summary: `${station.code} faces ${profile.condition.toLowerCase()} on the current dispatch window.`,
    };
  });

const buildIssues = (
  stations: Station[],
  trucks: Truck[],
  weatherImpacts: OptimizationWeatherImpact[],
): OptimizationIssue[] => {
  const stationIssues: OptimizationIssue[] = stations.slice(0, 3).map((station, index) => ({
    id: `issue-stockout-${station.id}`,
    severity: severityFromDays(station.daysToStockout),
    title: `${station.code} stockout window`,
    description: `${station.name} falls below reorder protection in ${station.daysToStockout.toFixed(1)} days.`,
    penaltyLabel: `${Math.max(6, 18 - index * 3)} pt risk`,
  }));

  const fleetIssues: OptimizationIssue[] = trucks
    .filter((truck) => truck.status !== "Ready")
    .map((truck) => ({
      id: `issue-truck-${truck.id}`,
      severity: (truck.status === "Maintenance" ? "warning" : "info") as AlertSeverity,
      title: `${truck.name} ${truck.status.toLowerCase()}`,
      description: `Truck availability reduces route flexibility for this optimization cycle.`,
      penaltyLabel: truck.status === "Maintenance" ? "Fleet penalty" : "ETA monitored",
    }));

  const weatherIssues: OptimizationIssue[] = weatherImpacts
    .filter((impact) => impact.severity !== "low")
    .map((impact) => ({
      id: `issue-weather-${impact.id}`,
      severity: (impact.severity === "high" ? "warning" : "info") as AlertSeverity,
      title: `${impact.region} weather penalty`,
      description: `${impact.condition} adds ${impact.delayHours.toFixed(1)} hours and extra route buffering.`,
      penaltyLabel: `+${impact.extraCostMnt.toLocaleString("en-US")} MNT`,
    }));

  return [...stationIssues, ...fleetIssues, ...weatherIssues].slice(0, 6);
};

const buildRoute = (
  truck: Truck,
  depot: Depot,
  assignedStations: Station[],
  allocations: OptimizationResult["allocations"],
): OptimizationRoute => {
  const totalDistance =
    170 +
    assignedStations.length * 64 +
    assignedStations.reduce((sum, station, index) => sum + station.latitude * 0 + 18 + index * 11, 0);
  const serviceHours = assignedStations.length * 0.75;
  const weatherPenalty = assignedStations.reduce(
    (sum, station) => sum + getWeatherProfile(station.region).delayHours,
    0,
  );
  const loadLitres = allocations
    .filter((allocation) => allocation.truckId === truck.id)
    .reduce((sum, allocation) => sum + allocation.litres, 0);
  const weatherCostFactor =
    assignedStations.reduce((sum, station) => sum + getWeatherProfile(station.region).costMultiplier, 0) /
    Math.max(assignedStations.length, 1);
  const routeCostMnt = Math.round(totalDistance * 7900 + serviceHours * 145000 + loadLitres * 5.4 * weatherCostFactor);
  const dominantWeather =
    [...assignedStations]
      .sort(
        (left, right) =>
          getWeatherProfile(right.region).delayHours - getWeatherProfile(left.region).delayHours,
      )[0] ?? assignedStations[0];
  const dominantProfile = getWeatherProfile(dominantWeather?.region ?? "");
  const riskLevel =
    assignedStations.some((station) => station.daysToStockout <= 2) || dominantProfile.severity === "high"
      ? "high"
      : dominantProfile.severity === "moderate"
        ? "moderate"
        : "low";

  return {
    truckId: truck.id,
    truckName: truck.name,
    path: [depot.name, ...assignedStations.map((station) => station.code), depot.name],
    distanceKm: Math.round(totalDistance),
    loadLitres,
    etaHours: Number((totalDistance / 52 + serviceHours + weatherPenalty).toFixed(1)),
    serviceHours: Number(serviceHours.toFixed(1)),
    delayHours: Number(weatherPenalty.toFixed(1)),
    routeCostMnt,
    weatherCondition: dominantProfile.condition,
    riskLevel,
    issues: assignedStations.map((station) =>
      station.daysToStockout <= 2.5
        ? `${station.code} must be delivered first`
        : `${station.code} is a balance-delivery stop`,
    ),
    stationNames: assignedStations.map((station) => station.name),
  };
};

export const buildOptimizationResult = (
  stations: Station[],
  depots: Depot[],
  trucks: Truck[],
): OptimizationResult => {
  const demandStations = [...stations]
    .sort((a, b) => a.daysToStockout - b.daysToStockout)
    .slice(0, 6);
  const readyTrucks = trucks.filter((truck) => truck.status !== "Maintenance").slice(0, 3);
  const dispatchTrucks = readyTrucks.length > 0 ? readyTrucks : trucks.slice(0, 2);

  const allocations = demandStations.map((station, index) => {
    const truck = dispatchTrucks[index % dispatchTrucks.length];
    const primaryTank = station.tanks[0];
    return {
      stationId: station.id,
      stationName: station.name,
      litres: Math.min(Math.round(deriveRecommendedRefill(station)), truck.capacityLitres),
      fuelType: primaryTank.inventory.fuelType,
      truckId: truck.id,
    };
  });

  const routes = dispatchTrucks.map((truck, index) => {
    const depot = depots[index % depots.length];
    const assignedStations = demandStations.filter(
      (_, stationIndex) => stationIndex % dispatchTrucks.length === index,
    );
    return buildRoute(truck, depot, assignedStations, allocations);
  });

  const weather = buildWeatherImpacts(demandStations);
  const issues = buildIssues(demandStations, trucks, weather);
  const distanceCostMnt = routes.reduce((sum, route) => sum + route.distanceKm * 7900, 0);
  const timeCostMnt = routes.reduce((sum, route) => sum + (route.serviceHours + route.delayHours) * 145000, 0);
  const weatherPenaltyMnt = weather.reduce((sum, impact) => sum + impact.extraCostMnt, 0);
  const stockoutProtectionMnt = demandStations.reduce(
    (sum, station) => sum + Math.max(0, 4 - station.daysToStockout) * 310000,
    0,
  );
  const costBreakdown: OptimizationCostBreakdown[] = [
    {
      id: "cost-distance",
      label: "Distance and fuel burn",
      valueMnt: Math.round(distanceCostMnt),
    },
    {
      id: "cost-time",
      label: "Driver time and service window",
      valueMnt: Math.round(timeCostMnt),
    },
    {
      id: "cost-weather",
      label: "Weather and road penalties",
      valueMnt: weatherPenaltyMnt,
    },
    {
      id: "cost-stockout",
      label: "Stockout prevention premium",
      valueMnt: Math.round(stockoutProtectionMnt),
    },
  ];
  const totalDeliveryCostMnt = costBreakdown.reduce((sum, item) => sum + item.valueMnt, 0);
  const totalRouteTimeHours = routes.reduce((sum, route) => sum + route.etaHours, 0);
  const onTimeDeliveryPct = Number(
    Math.max(
      72,
      97 -
        weather.reduce((sum, impact) => sum + impact.delayHours, 0) * 2.4 -
        demandStations.filter((station) => station.daysToStockout <= 2).length * 3.2,
    ).toFixed(1),
  );
  const fitnessScore = Number(
    Math.min(
      98.8,
      Math.max(78.4, onTimeDeliveryPct - issues.length * 0.7 + dispatchTrucks.length * 1.8),
    ).toFixed(1),
  );

  return {
    generatedAt: new Date().toISOString(),
    totalDeliveryCostMnt,
    totalRouteTimeHours: Number(totalRouteTimeHours.toFixed(1)),
    onTimeDeliveryPct,
    fitnessScore,
    allocations,
    routes,
    tasks: buildTaskPipeline(demandStations, depots, dispatchTrucks.length),
    issues,
    weather,
    costBreakdown,
  };
};
