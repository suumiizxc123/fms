import { ArrowRight, Fuel, MapPinned, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import type { Station } from "@/types";
import { formatMnt, formatNumber } from "@/utils/format";
import { StatusBadge } from "./ui/StatusBadge";

interface StationSummaryDrawerProps {
  station: Station | undefined;
}

export const StationSummaryDrawer = ({ station }: StationSummaryDrawerProps) => {
  if (!station) {
    return (
      <div className="panel-soft flex h-full items-center justify-center p-6 text-sm text-slate-400">
        Select a station marker to inspect operational state.
      </div>
    );
  }

  return (
    <div className="panel h-full p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{station.code}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{station.name}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {station.city}, {station.district}
          </p>
        </div>
        <StatusBadge label={station.status} status={station.status} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="panel-soft p-4">
          <div className="flex items-center gap-2 text-fuel-cyan">
            <Fuel className="h-4 w-4" />
            <p className="text-sm">Fuel available</p>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatNumber(station.currentFuelLitres)} L
          </p>
        </div>
        <div className="panel-soft p-4">
          <div className="flex items-center gap-2 text-fuel-blue">
            <Wallet className="h-4 w-4" />
            <p className="text-sm">Daily sales</p>
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatMnt(station.todayTugrikSold)}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm text-slate-300">
        <div className="panel-soft flex items-center justify-between p-4">
          <span className="inline-flex items-center gap-2"><MapPinned className="h-4 w-4 text-fuel-amber" />Nearest depot</span>
          <span>{station.nearestDepot}</span>
        </div>
        <div className="panel-soft flex items-center justify-between p-4">
          <span>Days to stockout</span>
          <span>{station.daysToStockout.toFixed(1)} days</span>
        </div>
        <div className="panel-soft flex items-center justify-between p-4">
          <span>Queue / traffic</span>
          <span>
            {station.queueLevel} vehicles · {station.trafficLevel}
          </span>
        </div>
      </div>
      <Link
        to={`/stations/${station.id}`}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-fuel-cyan px-4 py-3 text-sm font-semibold text-ink-950 transition hover:bg-white"
      >
        Open full station detail
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
};
