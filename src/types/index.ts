export type FuelType = "AI-92" | "AI-95" | "Diesel" | "LPG";
export type StationStatus = "normal" | "low_fuel" | "critical" | "maintenance";
export type StationType = "Urban" | "Highway" | "Industrial" | "Airport";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "low_fuel"
  | "critical_tank"
  | "high_temperature"
  | "abnormal_humidity"
  | "fuel_loss"
  | "stockout_soon"
  | "offline"
  | "refill_overdue";
export type VehicleType = "Sedan" | "SUV" | "Truck" | "Bus" | "Tanker";
export type OptimizationStatus = "idle" | "loading" | "succeeded";
export type OptimizationTaskStatus = "completed" | "running" | "queued";
export type OptimizationRiskLevel = "low" | "moderate" | "high";

export interface FuelInventory {
  fuelType: FuelType;
  capacityLitres: number;
  safeCapacityLitres: number;
  currentLitres: number;
  unavailableLitres: number;
  minimumThresholdLitres: number;
  reorderThresholdLitres: number;
  criticalThresholdLitres: number;
  fuelHeightMeters: number;
  tankHeightMeters: number;
  depreciationRatePct: number;
}

export interface Tank {
  id: string;
  label: string;
  shape: "cylindrical";
  inventory: FuelInventory;
}

export interface EnvironmentMetrics {
  temperatureC: number;
  humidityPct: number;
}

export interface SalesPoint {
  label: string;
  litres: number;
  revenue: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface VehicleEvent {
  id: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  litres: number;
  dispensedLitres: number;
  amountMnt: number;
  timestamp: string;
  bay: number;
  direction: "entering" | "fueling" | "leaving";
  progress: number;
  active: boolean;
}

export interface RefillRecord {
  date: string;
  litres: number;
  fuelType: FuelType;
  source: string;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  mapX: number;
  mapY: number;
  region: string;
  city: string;
  district: string;
  manager: string;
  status: StationStatus;
  stationType: StationType;
  online: boolean;
  fuelTypes: FuelType[];
  tankCapacityLitres: number;
  currentFuelLitres: number;
  fuelHeightMeters: number;
  temperature: number;
  humidity: number;
  depreciationRate: number;
  todayLitresSold: number;
  todayTugrikSold: number;
  carsServed: number;
  averageLitresPerCar: number;
  queueLevel: number;
  trafficLevel: "Light" | "Moderate" | "Heavy";
  nearestDepot: string;
  nearestDepotCapacity: number;
  daysToStockout: number;
  lastRefillDate: string;
  predictedRefillDate: string;
  tanks: Tank[];
  hourlySales: SalesPoint[];
  dailySales: SalesPoint[];
  weeklySales: SalesPoint[];
  lossTrend: TrendPoint[];
  refillHistory: RefillRecord[];
  vehicleEvents: VehicleEvent[];
}

export interface Depot {
  id: string;
  name: string;
  region: string;
  storageType: "Primary" | "Bank" | "Strategic";
  capacityLitres: number;
  availableLitres: number;
}

export interface Truck {
  id: string;
  name: string;
  capacityLitres: number;
  driver: string;
  assignedDepotId: string;
  status: "Ready" | "En route" | "Maintenance";
}

export interface Alert {
  id: string;
  stationId: string;
  stationName: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface OptimizationAllocation {
  stationId: string;
  stationName: string;
  litres: number;
  fuelType: FuelType;
  truckId: string;
}

export interface OptimizationRoute {
  truckId: string;
  truckName: string;
  path: string[];
  distanceKm: number;
  loadLitres: number;
  etaHours: number;
  serviceHours: number;
  delayHours: number;
  routeCostMnt: number;
  weatherCondition: string;
  riskLevel: OptimizationRiskLevel;
  issues: string[];
  stationNames: string[];
}

export interface OptimizationTask {
  id: string;
  title: string;
  description: string;
  status: OptimizationTaskStatus;
  impactLabel: string;
}

export interface OptimizationIssue {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  penaltyLabel: string;
}

export interface OptimizationWeatherImpact {
  id: string;
  region: string;
  condition: string;
  severity: OptimizationRiskLevel;
  delayHours: number;
  extraCostMnt: number;
  summary: string;
}

export interface OptimizationCostBreakdown {
  id: string;
  label: string;
  valueMnt: number;
}

export interface OptimizationResult {
  generatedAt: string;
  totalDeliveryCostMnt: number;
  totalRouteTimeHours: number;
  onTimeDeliveryPct: number;
  fitnessScore: number;
  allocations: OptimizationAllocation[];
  routes: OptimizationRoute[];
  tasks: OptimizationTask[];
  issues: OptimizationIssue[];
  weather: OptimizationWeatherImpact[];
  costBreakdown: OptimizationCostBreakdown[];
}

export interface OptimizationJobState {
  status: OptimizationStatus;
  progress: number;
  result: OptimizationResult | null;
}

export interface DashboardFilters {
  region: string;
  stationType: string;
  tankStatus: string;
  fuelType: string;
  connectivity: string;
}

export interface NetworkKpis {
  totalFuelLitres: number;
  stationsOnline: number;
  criticalStations: number;
  todayLitresSold: number;
  todayRevenueMnt: number;
  activeAlerts: number;
  vehiclesServed: number;
  projectedStockouts: number;
}
