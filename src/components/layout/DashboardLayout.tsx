import { Menu } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SideNav } from "./SideNav";

export const DashboardLayout = () => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 text-slate-100 lg:p-6">
      <div className="mx-auto grid max-w-[1720px] gap-6 lg:grid-cols-[288px_minmax(0,1fr)]">
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen((value) => !value)}
            className="panel flex items-center gap-3 px-4 py-3 text-sm text-slate-200"
          >
            <Menu className="h-4 w-4" />
            Navigation
          </button>
          {navOpen ? <div className="mt-4"><SideNav /></div> : null}
        </div>
        <div className="hidden lg:block">
          <SideNav />
        </div>
        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
