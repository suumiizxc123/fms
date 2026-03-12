import { useMemo } from "react";
import { StationMap } from "@/components/StationMap";
import { StationSummaryDrawer } from "@/components/StationSummaryDrawer";
import { PanelCard } from "@/components/ui/PanelCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useDashboardStore, useFilteredStations } from "@/store/dashboardStore";

const filterButtonClass =
  "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-fuel-cyan/30 hover:text-white";

export const MapViewPage = () => {
  const stations = useDashboardStore((state) => state.stations);
  const filteredStations = useFilteredStations();
  const filters = useDashboardStore((state) => state.filters);
  const setFilters = useDashboardStore((state) => state.setFilters);
  const resetFilters = useDashboardStore((state) => state.resetFilters);
  const selectedStationId = useDashboardStore((state) => state.selectedStationId);
  const setSelectedStation = useDashboardStore((state) => state.setSelectedStation);

  const selectedStation = filteredStations.find((station) => station.id === selectedStationId);
  const regions = useMemo(() => ["All", ...new Set(stations.map((station) => station.region))], [stations]);
  const stationTypes = useMemo(
    () => ["All", ...new Set(stations.map((station) => station.stationType))],
    [stations],
  );

  return (
    <div className="space-y-6">
      <PanelCard>
        <SectionHeading
          eyebrow="Operations board"
          title="Global Map View"
          subtitle="Interactive station network with region, tank, fuel, and connectivity filters."
          action={
            <button type="button" onClick={resetFilters} className={filterButtonClass}>
              Reset filters
            </button>
          }
        />
        <div className="grid gap-3 lg:grid-cols-5">
          <select
            value={filters.region}
            onChange={(event) => setFilters({ region: event.target.value })}
            className={filterButtonClass}
          >
            {regions.map((option) => (
              <option key={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.stationType}
            onChange={(event) => setFilters({ stationType: event.target.value })}
            className={filterButtonClass}
          >
            {stationTypes.map((option) => (
              <option key={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.tankStatus}
            onChange={(event) => setFilters({ tankStatus: event.target.value })}
            className={filterButtonClass}
          >
            {["All", "normal", "low_fuel", "critical", "maintenance"].map((option) => (
              <option key={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.fuelType}
            onChange={(event) => setFilters({ fuelType: event.target.value })}
            className={filterButtonClass}
          >
            {["All", "AI-92", "AI-95", "Diesel", "LPG"].map((option) => (
              <option key={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.connectivity}
            onChange={(event) => setFilters({ connectivity: event.target.value })}
            className={filterButtonClass}
          >
            {["All", "Online", "Offline"].map((option) => (
              <option key={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </div>
      </PanelCard>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <StationMap
          stations={stations}
          filters={filters}
          selectedStationId={selectedStationId}
          onSelect={setSelectedStation}
        />
        <StationSummaryDrawer station={selectedStation} />
      </div>
    </div>
  );
};
