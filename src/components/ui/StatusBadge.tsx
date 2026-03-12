import clsx from "clsx";
import type { AlertSeverity, StationStatus } from "@/types";
import { getStatusTone } from "@/utils/metrics";

interface StatusBadgeProps {
  label: string;
  status?: StationStatus;
  severity?: AlertSeverity;
  className?: string;
}

const severityTone = (severity?: AlertSeverity) => {
  switch (severity) {
    case "critical":
      return "text-fuel-red bg-fuel-red/[0.15] border-fuel-red/25";
    case "warning":
      return "text-fuel-amber bg-fuel-amber/[0.15] border-fuel-amber/25";
    case "info":
      return "text-fuel-blue bg-fuel-blue/[0.15] border-fuel-blue/25";
    default:
      return "text-slate-200 bg-white/10 border-white/10";
  }
};

export const StatusBadge = ({
  label,
  status,
  severity,
  className,
}: StatusBadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]",
      status ? getStatusTone(status) : severityTone(severity),
      className,
    )}
  >
    {label.replace(/_/g, " ")}
  </span>
);
