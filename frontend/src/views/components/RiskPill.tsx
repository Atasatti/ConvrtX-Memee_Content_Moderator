import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/models/common.model";
import { RISK_PRESENTATION } from "../theme/risk";

/** Status color never carries meaning alone — every pill ships an icon and a label. */
const RISK_ICONS: Record<RiskLevel, ReactNode> = {
  safe: <CheckCircle2 size={13} aria-hidden />,
  low: <CheckCircle2 size={13} aria-hidden />,
  elevated: <AlertTriangle size={13} aria-hidden />,
  high: <ShieldAlert size={13} aria-hidden />,
  critical: <ShieldX size={13} aria-hidden />,
};

interface RiskPillProps {
  risk: RiskLevel;
  className?: string;
}

export function RiskPill({ risk, className }: RiskPillProps) {
  const presentation = RISK_PRESENTATION[risk];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        presentation.badge,
        className,
      )}
    >
      {RISK_ICONS[risk]}
      {presentation.label}
    </span>
  );
}
