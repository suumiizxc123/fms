import clsx from "clsx";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  Fuel,
  Globe2,
  LayoutDashboard,
  RadioTower,
  Route,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navGroups = [
  {
    title: "Command",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, detail: "Executive network view" },
      { to: "/map", label: "Map View", icon: Globe2, detail: "Real station locations" },
      { to: "/stations/st-ub-01", label: "Station Details", icon: Building2, detail: "3D station operations" },
    ],
  },
  {
    title: "Monitoring",
    items: [
      { to: "/analytics", label: "Sales Analytics", icon: BarChart3, detail: "Revenue and demand trend" },
      { to: "/inventory", label: "Inventory Monitoring", icon: Boxes, detail: "Thresholds and refill risk" },
      { to: "/alerts", label: "Alerts & Notifications", icon: AlertTriangle, detail: "Critical network events" },
    ],
  },
  {
    title: "Planning",
    items: [
      { to: "/optimization", label: "Distribution Optimization", icon: Route, detail: "Dispatch and route planning" },
    ],
  },
];

export const SideNav = () => (
  <aside className="panel flex flex-col overflow-hidden p-4 lg:min-h-[calc(100vh-2rem)] lg:w-80">
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-fuel-cyan/18 via-slate-900/85 to-fuel-blue/[0.18] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-slate-200">Fuel Company Ops</p>
          <h1 className="mt-3 text-[1.75rem] font-semibold leading-tight text-white">
            3D Fuel Management System
          </h1>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-fuel-cyan">
          <Fuel className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
        Realtime dispatch, inventory intelligence, route planning, and station telemetry in one command rail.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
          <div className="flex items-center gap-2 text-fuel-green">
            <RadioTower className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Status</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">Network online</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
          <div className="flex items-center gap-2 text-fuel-cyan">
            <Activity className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Refresh</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">2.2s simulation</p>
        </div>
      </div>
    </div>
    <nav className="mt-6 flex-1 space-y-5">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="px-2 text-[10px] uppercase tracking-[0.28em] text-slate-500">{group.title}</p>
          <div className="mt-3 space-y-2">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
                    isActive
                      ? "border-fuel-cyan/40 bg-gradient-to-r from-fuel-cyan/[0.14] to-transparent text-white"
                      : "border-transparent bg-white/[0.035] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={clsx(
                        "rounded-2xl p-2.5 transition",
                        isActive ? "bg-white/10 text-fuel-cyan" : "bg-white/[0.04] text-slate-400 group-hover:text-fuel-cyan",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <ChevronRight
                      className={clsx(
                        "h-4 w-4 transition",
                        isActive ? "text-fuel-cyan" : "text-slate-600 group-hover:text-slate-300",
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <div className="panel-soft p-4">
        <p className="eyebrow">Simulation</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Live KPIs, alerts, traffic flow, and optimization placeholders update every 2.2 seconds.
        </p>
      </div>
      <div className="panel-soft p-4">
        <p className="eyebrow">Operator Focus</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Use `Map View` for live movement, `Station Details` for tank state, and `Optimization` for dispatch planning.
        </p>
      </div>
    </div>
  </aside>
);
