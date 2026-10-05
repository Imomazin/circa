import * as React from "react";

/**
 * Circa logomark — a resource loop. Two forest arcs circulate around a copper
 * value node: materials returning to use, value captured at the point of
 * recirculation. Geometric and scalable; no stock iconography.
 */
export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Circa"
      fill="none"
    >
      <path
        d="M26 10.5A12 12 0 1 0 27.5 20"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M26 4.5V11h-6.4"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="4.1" fill="#b87333" />
    </svg>
  );
}
