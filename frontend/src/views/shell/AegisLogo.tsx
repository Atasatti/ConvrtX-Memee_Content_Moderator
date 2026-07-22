import { useId } from "react";

interface AegisLogoProps {
  size?: number;
  className?: string;
}

/**
 * A geometric double-shield with an "A" beacon. The dark inner field keeps the
 * monogram crisp at favicon size while the violet-to-mint edge carries the brand.
 *
 * The gradient id is generated per instance so two logos on one page cannot
 * collide in the SVG id namespace.
 */
export function AegisLogo({ size = 32, className }: AegisLogoProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Aegis"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="7"
          y1="5"
          x2="34"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#9f93ff" />
          <stop offset="0.55" stopColor="#7c6cf2" />
          <stop offset="1" stopColor="#38d6bd" />
        </linearGradient>
      </defs>

      <path
        d="M20 2.5 35 7.7v10.5c0 9-5.9 16.1-15 19.6C10.9 34.3 5 27.2 5 18.2V7.7L20 2.5Z"
        fill={`url(#${gradientId})`}
      />

      <path
        d="M20 6.7 31 10.5v7.6c0 6.7-4.2 12.2-11 15.4-6.8-3.2-11-8.7-11-15.4v-7.6L20 6.7Z"
        fill="#0b0d13"
        fillOpacity="0.94"
      />

      <g
        stroke="#f7f8fc"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M12.8 27.2 19.1 12.5c.35-.82 1.45-.82 1.8 0l6.3 14.7" />
        <path d="M15.4 21.4h9.2" />
      </g>

      <circle cx="29.4" cy="10.8" r="1.55" fill="#38d6bd" />
    </svg>
  );
}
