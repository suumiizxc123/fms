import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { mockDepots, mockStations, mockTrucks } from "@/data/mockData";
import type {
  Alert,
  DashboardFilters,
  OptimizationJobState,
  Station,
  VehicleEvent,
  VehicleType,
} from "@/types";
import { buildOptimizationResult } from "@/utils/optimization";
import {
  buildNetworkKpis,
  deriveAlerts,
  deriveStationStatus,
  matchesFilters,
  sumCurrentFuel,
  sumTankCapacity,
  withDerivedStationValues,
} from "@/utils/metrics";

interface DashboardState {
  stations: Station[];
  depots: typeof mockDepots;
  trucks: typeof mockTrucks;
  filters: DashboardFilters;
  selectedStationId: string;
  alerts: Alert[];
  optimizationJob: OptimizationJobState;
  simulationTick: number;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setSelectedStation: (stationId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  runOptimization: () => void;
  tickRealtime: () => void;
}

const defaultFilters: DashboardFilters = {
  region: "All",
  stationType: "All",
  tankStatus: "All",
  fuelType: "All",
  connectivity: "All",
};

const vehicleTypes: VehicleType[] = ["Sedan", "SUV", "Truck", "Bus"];

const fuelPrices = {
  "AI-92": 2390,
  "AI-95": 2780,
  Diesel: 3290,
  LPG: 1980,
};

const serviceRateByVehicle: Record<VehicleType, number> = {
  Sedan: 8,
  SUV: 10,
  Truck: 18,
  Bus: 22,
  Tanker: 28,
};

const volumeRangeByVehicle: Record<VehicleType, [number, number]> = {
  Sedan: [24, 42],
  SUV: [32, 55],
  Truck: [70, 150],
  Bus: [100, 180],
  Tanker: [180, 300],
};

const getDemandFactor = (hour: number) => {
  if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 21)) {
    return 0.88;
  }

  if (hour >= 11 && hour <= 16) {
    return 0.62;
  }

  if (hour >= 22 || hour <= 5) {
    return 0.22;
  }

  return 0.4;
};

const buildFuelRequest = (vehicleType: VehicleType, seed: number, availableLitres: number) => {
  const [min, max] = volumeRangeByVehicle[vehicleType];
  const target = min + (seed % Math.max(1, max - min));
  return Math.max(8, Math.min(target, availableLitres));
};

const generateVehicleEvent = (
  station: Station,
  tick: number,
  arrivalIndex: number,
): VehicleEvent => {
  const eligibleTanks = station.tanks.filter((tank) => tank.inventory.currentLitres > 1200);
  const tank =
    eligibleTanks[(tick + arrivalIndex + station.name.length) % Math.max(eligibleTanks.length, 1)] ??
    station.tanks[0];
  const vehicleType = vehicleTypes[(tick + arrivalIndex + station.queueLevel) % vehicleTypes.length];
  const litres = buildFuelRequest(
    vehicleType,
    tick * 13 + arrivalIndex * 7 + station.name.length,
    tank.inventory.currentLitres,
  );
  return {
    id: `${station.id}-${tick}-${arrivalIndex}-${Date.now()}`,
    vehicleType,
    fuelType: tank.inventory.fuelType,
    litres,
    dispensedLitres: 0,
    amountMnt: litres * fuelPrices[tank.inventory.fuelType],
    timestamp: new Date().toISOString(),
    bay: ((tick + arrivalIndex) % 3) + 1,
    direction: "entering",
    progress: 0,
    active: true,
  };
};

const nextStations = (stations: Station[], simulationTick: number) =>
  stations.map((station, stationIndex) => {
    const currentHour = new Date().getHours();
    const demandFactor = getDemandFactor(currentHour);
    const shouldSellFuel = station.online && station.status !== "maintenance";
    let litresSold = 0;
    let tugrikSold = 0;
    let completedCars = 0;

    const nextTanks = station.tanks.map((tank) => {
      const drift = tank.inventory.currentLitres * (tank.inventory.depreciationRatePct / 1000);
      const currentLitres = Math.max(0, tank.inventory.currentLitres - drift);
      return {
        ...tank,
        inventory: {
          ...tank.inventory,
          currentLitres,
        },
      };
    });

    const withdrawFuel = (fuelType: VehicleEvent["fuelType"], requestedLitres: number) => {
      let remaining = requestedLitres;
      let actual = 0;

      nextTanks.forEach((tank) => {
        if (tank.inventory.fuelType !== fuelType || remaining <= 0) {
          return;
        }

        const draw = Math.min(tank.inventory.currentLitres, remaining);
        tank.inventory.currentLitres -= draw;
        remaining -= draw;
        actual += draw;
      });

      return actual;
    };

    const updatedEvents = station.vehicleEvents
      .map((event) => {
        if (!event.active) {
          return event;
        }

        if (event.direction === "entering") {
          const progress = Math.min(1, event.progress + 0.16);
          if (progress >= 1) {
            return {
              ...event,
              direction: "fueling" as const,
              progress: 0,
              timestamp: new Date().toISOString(),
            };
          }
          return { ...event, progress };
        }

        if (event.direction === "fueling") {
          const requestedLitres = shouldSellFuel
            ? Math.min(
                serviceRateByVehicle[event.vehicleType],
                Math.max(0, event.litres - event.dispensedLitres),
              )
            : 0;
          const dispensedNow = withdrawFuel(event.fuelType, requestedLitres);
          const dispensedLitres = Number((event.dispensedLitres + dispensedNow).toFixed(2));
          const progress = Math.min(1, dispensedLitres / Math.max(event.litres, 1));

          litresSold += dispensedNow;
          tugrikSold += dispensedNow * fuelPrices[event.fuelType];

          if (progress >= 1 || dispensedNow === 0) {
            completedCars += 1;
            return {
              ...event,
              dispensedLitres,
              direction: "leaving" as const,
              progress: 0,
              timestamp: new Date().toISOString(),
            };
          }

          return {
            ...event,
            dispensedLitres,
            progress,
          };
        }

        const progress = Math.min(1, event.progress + 0.12);
        return {
          ...event,
          progress,
          active: progress < 1,
        };
      })
      .filter((event) => event.active || event.direction === "leaving");

    const queueDemand = Math.round(demandFactor * 4);
    const activeServiceCount = updatedEvents.filter(
      (event) => event.active && event.direction !== "leaving",
    ).length;
    const arrivalModulo = demandFactor >= 0.8 ? 2 : demandFactor >= 0.55 ? 3 : 5;
    const shouldSpawnArrival =
      shouldSellFuel &&
      activeServiceCount < 6 &&
      (simulationTick + stationIndex) % arrivalModulo === 0;
    const arrivalCount =
      shouldSpawnArrival && demandFactor >= 0.82 && activeServiceCount <= 2 ? 2 : shouldSpawnArrival ? 1 : 0;
    const arrivals = Array.from({ length: arrivalCount }, (_, arrivalIndex) =>
      generateVehicleEvent(station, simulationTick + stationIndex, arrivalIndex),
    );
    const eventList = [...arrivals, ...updatedEvents]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, 10);

    nextTanks.forEach((tank) => {
      const fillRatio = tank.inventory.currentLitres / Math.max(tank.inventory.capacityLitres, 1);
      tank.inventory.fuelHeightMeters = Number((tank.inventory.tankHeightMeters * fillRatio).toFixed(2));
    });

    const currentHourIndex = new Date().getHours();
    const nextHourlySales = station.hourlySales.map((point, index) =>
      index === currentHourIndex
        ? {
            ...point,
            litres: point.litres + litresSold,
            revenue: point.revenue + tugrikSold,
          }
        : point,
    );
    const nextLossTrend = station.lossTrend.map((point, index, array) =>
      index === array.length - 1
        ? {
            ...point,
            value: Number((point.value + station.depreciationRate * 0.005).toFixed(2)),
          }
        : point,
    );
    const queueLevel = Math.max(
      0,
      Math.min(
        10,
        updatedEvents.filter((event) => event.active && event.direction !== "leaving").length +
          arrivals.length +
          Math.max(0, queueDemand - 2),
      ),
    );

    const nextStation = withDerivedStationValues({
      ...station,
      tanks: nextTanks,
      vehicleEvents: eventList,
      queueLevel,
      trafficLevel: queueLevel >= 7 ? "Heavy" : queueLevel >= 4 ? "Moderate" : "Light",
      todayLitresSold: station.todayLitresSold + litresSold,
      todayTugrikSold: station.todayTugrikSold + tugrikSold,
      carsServed: station.carsServed + completedCars,
      hourlySales: nextHourlySales,
      temperature: Number(
        (station.temperature + (stationIndex % 2 === 0 ? 0.18 : -0.14)).toFixed(1),
      ),
      humidity: Number(
        (station.humidity + (stationIndex % 2 === 0 ? -0.16 : 0.22)).toFixed(1),
      ),
      depreciationRate: Number(
        (
          station.depreciationRate +
          (sumTankCapacity(nextTanks) - sumCurrentFuel(nextTanks)) / sumTankCapacity(nextTanks) / 100
        ).toFixed(2),
      ),
      lossTrend: nextLossTrend,
    });

    return {
      ...nextStation,
      status: deriveStationStatus(nextStation),
    };
  });

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stations: mockStations,
  depots: mockDepots,
  trucks: mockTrucks,
  filters: defaultFilters,
  selectedStationId: mockStations[0]?.id ?? "",
  alerts: deriveAlerts(mockStations),
  simulationTick: 0,
  optimizationJob: {
    status: "idle",
    progress: 0,
    result: null,
  },
  setFilters: (filters) =>
    set((state) => ({
      filters: {
        ...state.filters,
        ...filters,
      },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setSelectedStation: (selectedStationId) => set({ selectedStationId }),
  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    })),
  runOptimization: () =>
    set({
      optimizationJob: {
        status: "loading",
        progress: 0,
        result: null,
      },
    }),
  tickRealtime: () =>
    set((state) => {
      const simulationTick = state.simulationTick + 1;
      const stations = nextStations(state.stations, simulationTick);
      const derivedAlerts = deriveAlerts(stations).map((alert) => {
        const current = state.alerts.find((item) => item.id === alert.id);
        return current ? { ...alert, acknowledged: current.acknowledged } : alert;
      });

      const nextProgress =
        state.optimizationJob.status === "loading"
          ? Math.min(100, state.optimizationJob.progress + 22)
          : state.optimizationJob.progress;
      const shouldComplete =
        state.optimizationJob.status === "loading" && nextProgress >= 100;

      return {
        stations,
        alerts: derivedAlerts,
        simulationTick,
        optimizationJob: shouldComplete
          ? {
              status: "succeeded",
              progress: 100,
              result: buildOptimizationResult(stations, state.depots, state.trucks),
            }
          : {
              ...state.optimizationJob,
              progress: nextProgress,
            },
      };
    }),
}));

export const useFilteredStations = () =>
  useDashboardStore(
    useShallow((state) =>
      state.stations.filter((station) => matchesFilters(station, state.filters)),
    ),
  );

export const useSelectedStation = () =>
  useDashboardStore((state) =>
    state.stations.find((station) => station.id === state.selectedStationId) ?? state.stations[0],
  );

export const useNetworkKpis = () =>
  useDashboardStore(useShallow((state) => buildNetworkKpis(state.stations, state.alerts)));
