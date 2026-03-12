import type { Station } from "@/types";
import { deriveRecommendedRefill, sumUsableFuel } from "@/utils/metrics";
import { formatNumber } from "@/utils/format";
import { PanelCard } from "./ui/PanelCard";
import { StatusBadge } from "./ui/StatusBadge";

interface InventoryCardProps {
  station: Station;
}

export const InventoryCard = ({ station }: InventoryCardProps) => {
  const unavailable = station.currentFuelLitres - sumUsableFuel(station.tanks);
  const minimumThreshold = station.tanks.reduce(
    (sum, tank) => sum + tank.inventory.minimumThresholdLitres,
    0,
  );
  const reorderThreshold = station.tanks.reduce(
    (sum, tank) => sum + tank.inventory.reorderThresholdLitres,
    0,
  );
  const criticalThreshold = station.tanks.reduce(
    (sum, tank) => sum + tank.inventory.criticalThresholdLitres,
    0,
  );

  return (
    <PanelCard className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{station.region}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{station.name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {station.city} · {station.stationType}
          </p>
        </div>
        <StatusBadge label={station.status} status={station.status} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-slate-300">
        <div>
          <p className="text-slate-500">Current stock</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatNumber(station.currentFuelLitres)} L
          </p>
        </div>
        <div>
          <p className="text-slate-500">Usable stock</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {formatNumber(sumUsableFuel(station.tanks))} L
          </p>
        </div>
        <div>
          <p className="text-slate-500">Unavailable stock</p>
          <p className="mt-1">{formatNumber(unavailable)} L</p>
        </div>
        <div>
          <p className="text-slate-500">Days to stockout</p>
          <p className="mt-1">{station.daysToStockout.toFixed(1)} days</p>
        </div>
        <div>
          <p className="text-slate-500">Minimum threshold</p>
          <p className="mt-1">{formatNumber(minimumThreshold)} L</p>
        </div>
        <div>
          <p className="text-slate-500">Reorder threshold</p>
          <p className="mt-1">{formatNumber(reorderThreshold)} L</p>
        </div>
        <div>
          <p className="text-slate-500">Critical threshold</p>
          <p className="mt-1">{formatNumber(criticalThreshold)} L</p>
        </div>
        <div>
          <p className="text-slate-500">Recommended refill</p>
          <p className="mt-1 text-fuel-cyan">{formatNumber(deriveRecommendedRefill(station))} L</p>
        </div>
      </div>
    </PanelCard>
  );
};
