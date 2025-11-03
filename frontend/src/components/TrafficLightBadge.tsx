import { clsx } from "clsx";

interface Props {
  status: "GREEN" | "YELLOW" | "RED";
}

const colors: Record<Props["status"], string> = {
  GREEN: "bg-brand-green/30 text-brand-green border-brand-green/40",
  YELLOW: "bg-brand-yellow/30 text-brand-yellow border-brand-yellow/50",
  RED: "bg-brand-red/30 text-brand-red border-brand-red/40"
};

export const TrafficLightBadge = ({ status }: Props) => (
  <span
    className={clsx(
      "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold",
      colors[status]
    )}
  >
    <span className="h-2.5 w-2.5 rounded-full bg-current" />
    {status}
  </span>
);
