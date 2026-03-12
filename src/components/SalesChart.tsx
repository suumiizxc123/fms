import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelCard } from "./ui/PanelCard";
import { SectionHeading } from "./ui/SectionHeading";

interface SalesChartProps {
  title: string;
  subtitle?: string;
  data: Record<string, number | string>[];
  variant: "line" | "bar" | "stacked-bar" | "area" | "pie" | "radial";
  series: { key: string; color: string; name: string }[];
  className?: string;
  heightClass?: string;
}

export const SalesChart = ({
  title,
  subtitle,
  data,
  variant,
  series,
  className,
  heightClass = "h-72",
}: SalesChartProps) => {
  let chart: JSX.Element | null = null;

  if (variant === "line") {
    chart = (
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#74809d" />
            <YAxis stroke="#74809d" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
            <Legend />
            {series.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={3}
                dot={false}
                name={item.name}
              />
            ))}
          </LineChart>
    );
  } else if (variant === "bar" || variant === "stacked-bar") {
    chart = (
      <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#74809d" />
            <YAxis stroke="#74809d" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
            <Legend />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                stackId={variant === "stacked-bar" ? "fuel" : undefined}
                radius={[8, 8, 0, 0]}
                name={item.name}
              />
            ))}
          </BarChart>
    );
  } else if (variant === "area") {
    chart = (
      <AreaChart data={data}>
            <defs>
              {series.map((item) => (
                <linearGradient id={`${item.key}-fill`} key={item.key} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" stroke="#74809d" />
            <YAxis stroke="#74809d" />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
            <Legend />
            {series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                fill={`url(#${item.key}-fill)`}
                strokeWidth={2}
                name={item.name}
              />
            ))}
          </AreaChart>
    );
  } else if (variant === "pie") {
    chart = (
      <PieChart>
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
            <Legend />
            <Pie
              data={data}
              dataKey={series[0]?.key ?? "value"}
              nameKey="name"
              innerRadius={60}
              outerRadius={92}
              paddingAngle={3}
            />
          </PieChart>
    );
  } else if (variant === "radial") {
    chart = (
      <RadialBarChart
            data={data}
            innerRadius="28%"
            outerRadius="95%"
            startAngle={90}
            endAngle={-270}
          >
            <Legend />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)" }} />
            <RadialBar background dataKey={series[0]?.key ?? "value"} cornerRadius={12} />
          </RadialBarChart>
    );
  }

  return (
    <PanelCard className={className}>
      <SectionHeading title={title} subtitle={subtitle} />
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          {chart ?? <LineChart data={[]} />}
        </ResponsiveContainer>
      </div>
    </PanelCard>
  );
};
