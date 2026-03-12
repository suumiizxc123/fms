import type {
  Alert,
  DashboardFilters,
  FuelType,
  NetworkKpis,
  Station,
  StationStatus,
  Tank,
  TrendPoint,
} from "@/types";

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const sumTankCapacity = (tanks: Tank[]) =>
  tanks.reduce((total, tank) => total + tank.inventory.capacityLitres, 0);

export const sumCurrentFuel = (tanks: Tank[]) =>
  tanks.reduce((total, tank) => total + tank.inventory.currentLitres, 0);

export const sumUsableFuel = (tanks: Tank[]) =>
  tanks.reduce(
    (total, tank) =>
      total + Math.max(0, tank.inventory.currentLitres - tank.inventory.unavailableLitres),
    0,
  );

export const deriveFuelHeight = (tanks: Tank[]) => {
  if (!tanks.length) {
    return 0;
  }

  const ratios = tanks.map(
    (tank) => tank.inventory.currentLitres / Math.max(tank.inventory.capacityLitres, 1),
  );
  const heights = tanks.map((tank) => tank.inventory.tankHeightMeters);
  const weighted = ratios.reduce((sum, ratio, index) => sum + ratio * heights[index], 0);
  return weighted / tanks.length;
};

export const deriveAverageDailySales = (station: Station) =>
  station.dailySales.reduce((sum, point) => sum + point.litres, 0) / Math.max(station.dailySales.length, 1);

export const deriveDaysToStockout = (station: Station) => {
  const usable = sumUsableFuel(station.tanks);
  const averageDaily = Math.max(deriveAverageDailySales(station), 1);
  return usable / averageDaily;
};

export const deriveStationStatus = (station: Station): StationStatus => {
  if (!station.online) {
    return "maintenance";
  }

  const minRatio = Math.min(
    ...station.tanks.map(
      (tank) => tank.inventory.currentLitres / Math.max(tank.inventory.capacityLitres, 1),
    ),
  );

  if (station.daysToStockout <= 1.5 || minRatio <= 0.15) {
    return "critical";
  }

  if (station.daysToStockout <= 3.5 || minRatio <= 0.3) {
    return "low_fuel";
  }

  return "normal";
};

export const getStatusTone = (status: StationStatus) => {
  switch (status) {
    case "normal":
      return "text-fuel-green bg-fuel-green/[0.15] border-fuel-green/25";
    case "low_fuel":
      return "text-fuel-amber bg-fuel-amber/[0.15] border-fuel-amber/25";
    case "critical":
      return "text-fuel-red bg-fuel-red/[0.15] border-fuel-red/25";
    case "maintenance":
      return "text-slate-300 bg-slate-500/[0.15] border-slate-400/20";
    default:
      return "text-slate-200 bg-white/10 border-white/10";
  }
};

export const matchesFilters = (station: Station, filters: DashboardFilters) => {
  const regionMatch = filters.region === "All" || station.region === filters.region;
  const typeMatch = filters.stationType === "All" || station.stationType === filters.stationType;
  const tankMatch = filters.tankStatus === "All" || station.status === filters.tankStatus;
  const fuelMatch =
    filters.fuelType === "All" || station.fuelTypes.includes(filters.fuelType as FuelType);
  const onlineMatch =
    filters.connectivity === "All" ||
    (filters.connectivity === "Online" ? station.online : !station.online);

  return regionMatch && typeMatch && tankMatch && fuelMatch && onlineMatch;
};

export const deriveRecommendedRefill = (station: Station) => {
  const targetFill = station.tankCapacityLitres * 0.84;
  return Math.max(0, targetFill - station.currentFuelLitres);
};

export const deriveAlerts = (stations: Station[]): Alert[] => {
  const now = new Date().toISOString();

  return stations.flatMap((station) => {
    const alerts: Alert[] = [];

    if (!station.online) {
      alerts.push({
        id: `${station.id}-offline`,
        stationId: station.id,
        stationName: station.name,
        severity: "critical",
        type: "offline",
        message: "Station telemetry offline and pump control unavailable.",
        timestamp: now,
        acknowledged: false,
      });
    }

    if (station.status === "critical") {
      alerts.push({
        id: `${station.id}-critical`,
        stationId: station.id,
        stationName: station.name,
        severity: "critical",
        type: "critical_tank",
        message: "Critical tank reserve. Immediate dispatch review required.",
        timestamp: now,
        acknowledged: false,
      });
    } else if (station.status === "low_fuel") {
      alerts.push({
        id: `${station.id}-low`,
        stationId: station.id,
        stationName: station.name,
        severity: "warning",
        type: "low_fuel",
        message: "Fuel reserve below target threshold.",
        timestamp: now,
        acknowledged: false,
      });
    }

    if (station.temperature >= 30) {
      alerts.push({
        id: `${station.id}-temp`,
        stationId: station.id,
        stationName: station.name,
        severity: "warning",
        type: "high_temperature",
        message: "Ambient temperature elevated beyond operating comfort band.",
        timestamp: now,
        acknowledged: false,
      });
    }

    if (station.humidity >= 72 || station.humidity <= 16) {
      alerts.push({
        id: `${station.id}-humidity`,
        stationId: station.id,
        stationName: station.name,
        severity: "warning",
        type: "abnormal_humidity",
        message: "Humidity trend outside expected storage environment range.",
        timestamp: now,
        acknowledged: false,
      });
    }

    if (station.depreciationRate >= 1.35) {
      alerts.push({
        id: `${station.id}-loss`,
        stationId: station.id,
        stationName: station.name,
        severity: "warning",
        type: "fuel_loss",
        message: "Fuel loss estimate trending above baseline.",
        timestamp: now,
        acknowledged: false,
      });
    }

    if (station.daysToStockout <= 2.25) {
      alerts.push({
        id: `${station.id}-stockout`,
        stationId: station.id,
        stationName: station.name,
        severity: "critical",
        type: "stockout_soon",
        message: "Projected stockout inside the next 48 hours.",
        timestamp: now,
        acknowledged: false,
      });
    }

    const refillAgeDays =
      (Date.now() - new Date(station.lastRefillDate).getTime()) / (1000 * 60 * 60 * 24);
    if (refillAgeDays >= 10) {
      alerts.push({
        id: `${station.id}-refill`,
        stationId: station.id,
        stationName: station.name,
        severity: "info",
        type: "refill_overdue",
        message: "Refill cycle exceeds the standard operating cadence.",
        timestamp: now,
        acknowledged: false,
      });
    }

    return alerts;
  });
};

export const buildNetworkKpis = (stations: Station[], alerts: Alert[]): NetworkKpis => ({
  totalFuelLitres: stations.reduce((sum, station) => sum + station.currentFuelLitres, 0),
  stationsOnline: stations.filter((station) => station.online).length,
  criticalStations: stations.filter((station) => station.status === "critical").length,
  todayLitresSold: stations.reduce((sum, station) => sum + station.todayLitresSold, 0),
  todayRevenueMnt: stations.reduce((sum, station) => sum + station.todayTugrikSold, 0),
  activeAlerts: alerts.filter((alert) => !alert.acknowledged).length,
  vehiclesServed: stations.reduce((sum, station) => sum + station.carsServed, 0),
  projectedStockouts: stations.filter((station) => station.daysToStockout <= 3).length,
});

export const buildFuelMix = (stations: Station[]) => {
  const mix = new Map<FuelType, number>();

  stations.forEach((station) => {
    station.tanks.forEach((tank) => {
      const previous = mix.get(tank.inventory.fuelType) ?? 0;
      mix.set(tank.inventory.fuelType, previous + tank.inventory.currentLitres);
    });
  });

  return Array.from(mix.entries()).map(([name, value]) => ({ name, value }));
};

export const buildStatusMix = (stations: Station[]) => {
  const counts = ["normal", "low_fuel", "critical", "maintenance"].map((status) => ({
    name: status,
    value: stations.filter((station) => station.status === status).length,
  }));
  return counts;
};

export const buildLossTrend = (stations: Station[]): TrendPoint[] => {
  const weeks = stations[0]?.lossTrend.map((point) => point.label) ?? [];
  return weeks.map((label, index) => ({
    label,
    value:
      stations.reduce((sum, station) => sum + (station.lossTrend[index]?.value ?? 0), 0) /
      Math.max(stations.length, 1),
  }));
};

export const withDerivedStationValues = (station: Station): Station => {
  const currentFuelLitres = sumCurrentFuel(station.tanks);
  const tankCapacityLitres = sumTankCapacity(station.tanks);
  const daysToStockout = deriveDaysToStockout({ ...station, currentFuelLitres, tankCapacityLitres });

  const nextStation = {
    ...station,
    currentFuelLitres,
    tankCapacityLitres,
    fuelHeightMeters: deriveFuelHeight(station.tanks),
    daysToStockout,
    averageLitresPerCar: station.todayLitresSold / Math.max(station.carsServed, 1),
    predictedRefillDate: addDays(Math.max(1, Math.round(daysToStockout))),
  };

  return {
    ...nextStation,
    status: deriveStationStatus(nextStation),
  };
};
