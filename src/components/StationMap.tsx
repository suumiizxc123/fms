import { divIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { DashboardFilters, Station } from "@/types";
import { matchesFilters } from "@/utils/metrics";

interface StationMapProps {
  stations: Station[];
  filters: DashboardFilters;
  selectedStationId: string;
  onSelect: (stationId: string) => void;
}

const statusColor = {
  normal: "#55D89B",
  low_fuel: "#F7B955",
  critical: "#FF5D73",
  maintenance: "#94A3B8",
};

const buildStationIcon = (station: Station, selected: boolean) =>
  divIcon({
    className: "",
    html: `
      <div class="station-pin ${selected ? "station-pin--selected" : ""}">
        <span class="station-pin__dot" style="background:${statusColor[station.status]}"></span>
        <span class="station-pin__label">${station.code}</span>
      </div>
    `,
    iconSize: [110, 28],
    iconAnchor: [18, 14],
  });

const MapFocus = ({ station }: { station?: Station }) => {
  const map = useMap();

  useEffect(() => {
    if (!station) {
      return;
    }

    map.flyTo([station.latitude, station.longitude], 7.2, {
      animate: true,
      duration: 1.1,
    });
  }, [map, station]);

  return null;
};

const TrafficPulse = ({
  from,
  to,
  color,
  speed,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  speed: number;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => (value + speed) % 1);
    }, 80);

    return () => window.clearInterval(interval);
  }, [speed]);

  const center: [number, number] = [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];

  return (
    <CircleMarker
      center={center}
      radius={5}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.95, weight: 2 }}
    />
  );
};

export const StationMap = ({
  stations,
  filters,
  selectedStationId,
  onSelect,
}: StationMapProps) => {
  const filteredStations = useMemo(
    () => stations.filter((station) => matchesFilters(station, filters)),
    [filters, stations],
  );
  const selectedStation = filteredStations.find((station) => station.id === selectedStationId);
  const trafficRoutes = useMemo(() => {
    const orderedStations = [...filteredStations].sort(
      (left, right) => left.longitude - right.longitude,
    );

    return orderedStations.slice(0, -1).map((station, index) => ({
      id: `${station.id}-${orderedStations[index + 1]?.id ?? index}`,
      from: station,
      to: orderedStations[index + 1],
      color: index % 3 === 0 ? "#4DE2D1" : index % 3 === 1 ? "#4A9CFF" : "#F7B955",
      speed: 0.016 + index * 0.0025,
    }));
  }, [filteredStations]);

  return (
    <div className="relative h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60">
      <MapContainer
        center={[46.85, 103.84]}
        zoom={5.2}
        scrollWheelZoom
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trafficRoutes.map((route) =>
          route.to ? (
            <Polyline
              key={route.id}
              positions={[
                [route.from.latitude, route.from.longitude],
                [route.to.latitude, route.to.longitude],
              ]}
              pathOptions={{ color: route.color, weight: 2.5, opacity: 0.35, dashArray: "6 10" }}
            />
          ) : null,
        )}
        {trafficRoutes.map((route) =>
          route.to ? (
            <TrafficPulse
              key={`${route.id}-pulse`}
              from={[route.from.latitude, route.from.longitude]}
              to={[route.to.latitude, route.to.longitude]}
              color={route.color}
              speed={route.speed}
            />
          ) : null,
        )}
        {filteredStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.latitude, station.longitude]}
            icon={buildStationIcon(station, station.id === selectedStationId)}
            eventHandlers={{
              click: () => onSelect(station.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <div className="text-xs">
                <p className="font-semibold text-white">{station.name}</p>
                <p className="mt-1 text-slate-300">{station.region}</p>
              </div>
            </Tooltip>
            <Popup>
              <div className="min-w-56 text-sm">
                <p className="font-semibold text-white">{station.name}</p>
                <p className="mt-1 text-slate-300">
                  {station.city} · {station.stationType}
                </p>
                <p className="mt-3 text-slate-200">
                  Fuel: {Math.round(station.currentFuelLitres).toLocaleString()} L
                </p>
                <p className="mt-1 text-slate-200">Sales: {Math.round(station.todayLitresSold).toLocaleString()} L</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapFocus station={selectedStation} />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="panel-soft max-w-sm p-4">
          <p className="eyebrow">Operational map</p>
          <p className="mt-2 text-sm text-slate-300">
            Real station locations across Mongolia with live route pulses for network traffic and dispatch movement.
          </p>
        </div>
        <div className="panel-soft hidden p-4 lg:block">
          <p className="eyebrow">Status legend</p>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuel-green" />Normal</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuel-amber" />Low fuel</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuel-red" />Critical</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Maintenance</div>
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-fuel-cyan" />Traffic / dispatch</div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded-3xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur md:block">
        <p className="eyebrow">Live routes</p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
          {trafficRoutes.slice(0, 6).map((route) =>
            route.to ? (
              <div key={route.id} className="rounded-2xl border border-white/[0.08] bg-white/5 px-3 py-2">
                <p className="text-slate-200">{route.from.code} → {route.to.code}</p>
                <p className="mt-1">{route.from.region}</p>
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
};
