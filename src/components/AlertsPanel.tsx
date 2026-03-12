import { Link } from "react-router-dom";
import type { Alert } from "@/types";
import { formatDateTime } from "@/utils/format";
import { PanelCard } from "./ui/PanelCard";
import { SectionHeading } from "./ui/SectionHeading";
import { StatusBadge } from "./ui/StatusBadge";

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

export const AlertsPanel = ({ alerts, onAcknowledge }: AlertsPanelProps) => (
  <PanelCard>
    <SectionHeading
      eyebrow="Alerts"
      title="Alerts & Notifications"
      subtitle="Realtime operational anomalies and refill risks."
    />
    <div className="space-y-3">
      {alerts.length ? (
        alerts.map((alert) => (
          <div
            key={alert.id}
            className="panel-soft flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <div className="flex items-center gap-3">
                <StatusBadge label={alert.type} severity={alert.severity} />
                <p className="text-sm text-slate-400">{formatDateTime(alert.timestamp)}</p>
              </div>
              <p className="mt-3 text-base font-medium text-white">{alert.stationName}</p>
              <p className="mt-1 text-sm text-slate-300">{alert.message}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to={`/stations/${alert.stationId}`}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-fuel-cyan/40 hover:text-white"
              >
                Open station
              </Link>
              {onAcknowledge ? (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className="rounded-full bg-white/[0.08] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.12] hover:text-white"
                >
                  {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                </button>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        <div className="panel-soft p-8 text-center text-sm text-slate-400">
          No active alerts in the current simulation window.
        </div>
      )}
    </div>
  </PanelCard>
);
