export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const formatMnt = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MNT",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactMnt = (value: number) =>
  `MNT ${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;

export const formatPercent = (value: number, digits = 1) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)}%`;

export const formatHours = (value: number) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} h`;

export const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
