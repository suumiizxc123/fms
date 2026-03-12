import clsx from "clsx";
import type { PropsWithChildren } from "react";

interface PanelCardProps extends PropsWithChildren {
  className?: string;
}

export const PanelCard = ({ children, className }: PanelCardProps) => (
  <div className={clsx("panel p-5 sm:p-6", className)}>{children}</div>
);
