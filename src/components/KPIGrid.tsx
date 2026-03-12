import type { LucideIcon } from "lucide-react";
import { KPICard } from "./ui/KPICard";

interface KPIItem {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "cyan" | "blue" | "amber" | "red" | "green";
}

interface KPIGridProps {
  items: KPIItem[];
}

export const KPIGrid = ({ items }: KPIGridProps) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {items.map((item) => (
      <KPICard key={item.title} {...item} />
    ))}
  </div>
);
