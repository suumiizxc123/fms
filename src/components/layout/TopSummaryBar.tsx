import { Activity, AlertTriangle, Fuel, RadioTower, Truck } from "lucide-react";
import { useNetworkKpis } from "@/store/dashboardStore";
import { formatCompactNumber, formatMnt } from "@/utils/format";

const statCards = [
  { key: "totalFuelLitres", label: "Network fuel", icon: Fuel },
  { key: "todayRevenueMnt", label: "Revenue", icon: Activity },
  { key: "stationsOnline", label: "Stations online", icon: RadioTower },
  { key: "activeAlerts", label: "Active alerts", icon: AlertTriangle },
  { key: "vehiclesServed", label: "Vehicles served", icon: Truck },
] as const;

export const TopSummaryBar = () => {
  const kpis = useNetworkKpis();

  return (
    <div className="grid gap-3 md:grid-cols-5">
      {statCards.map((card) => (
        <div key={card.key} className="panel-soft flex items-center gap-3 p-4">
          <div className="rounded-2xl bg-white/[0.06] p-3 text-fuel-cyan">
            <card.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
            <p className="mt-1 text-base font-semibold text-white">
              {card.key === "todayRevenueMnt"
                ? formatMnt(kpis.todayRevenueMnt)
                : formatCompactNumber(kpis[card.key])}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
