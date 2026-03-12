import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { PanelCard } from "./PanelCard";

interface KPICardProps {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "cyan" | "blue" | "amber" | "red" | "green";
}

const accentMap = {
  cyan: "from-fuel-cyan/25 to-transparent text-fuel-cyan",
  blue: "from-fuel-blue/25 to-transparent text-fuel-blue",
  amber: "from-fuel-amber/25 to-transparent text-fuel-amber",
  red: "from-fuel-red/25 to-transparent text-fuel-red",
  green: "from-fuel-green/25 to-transparent text-fuel-green",
};

export const KPICard = ({
  title,
  value,
  detail,
  icon: Icon,
  accent = "cyan",
}: KPICardProps) => (
  <PanelCard className="relative overflow-hidden">
    <div
      className={clsx(
        "absolute inset-x-0 top-0 h-24 bg-gradient-to-br blur-2xl",
        accentMap[accent],
      )}
    />
    <div className="relative flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">{title}</p>
        <p className="metric-value mt-3">{value}</p>
        <p className="mt-2 text-sm text-slate-400">{detail}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-100">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </PanelCard>
);
