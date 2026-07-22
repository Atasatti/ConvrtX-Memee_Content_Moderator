import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_10px_30px_-14px_rgba(124,108,242,0.95)] hover:-translate-y-px hover:bg-brand-bright focus-visible:outline-brand-bright font-semibold",
  secondary:
    "border border-line-strong bg-raised/80 text-ink-2 hover:-translate-y-px hover:border-brand/60 hover:text-ink focus-visible:outline-brand",
  ghost: "text-muted hover:bg-raised hover:text-ink focus-visible:outline-brand",
  danger:
    "border border-critical/40 bg-critical/10 text-critical hover:bg-critical/20 focus-visible:outline-critical",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-8 px-3 py-1.5 text-xs gap-1.5",
  md: "min-h-10 px-4 py-2 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-all",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
