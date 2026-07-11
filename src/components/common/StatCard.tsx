"use client";

import React from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type StatTone =
  | "indigo"
  | "violet"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "amber"
  | "orange"
  | "rose"
  | "blue"
  | "gray";

const TONE_CLASSES: Record<
  StatTone,
  { bg: string; iconWrap: string; text: string; border: string; ring: string }
> = {
  indigo: {
    bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
    iconWrap: "bg-white text-indigo-600",
    text: "text-indigo-900",
    border: "border-indigo-200",
    ring: "ring-indigo-100",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-50 to-violet-100",
    iconWrap: "bg-white text-violet-600",
    text: "text-violet-900",
    border: "border-violet-200",
    ring: "ring-violet-100",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
    iconWrap: "bg-white text-emerald-600",
    text: "text-emerald-900",
    border: "border-emerald-200",
    ring: "ring-emerald-100",
  },
  teal: {
    bg: "bg-gradient-to-br from-teal-50 to-teal-100",
    iconWrap: "bg-white text-teal-600",
    text: "text-teal-900",
    border: "border-teal-200",
    ring: "ring-teal-100",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-50 to-cyan-100",
    iconWrap: "bg-white text-cyan-600",
    text: "text-cyan-900",
    border: "border-cyan-200",
    ring: "ring-cyan-100",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-50 to-sky-100",
    iconWrap: "bg-white text-sky-600",
    text: "text-sky-900",
    border: "border-sky-200",
    ring: "ring-sky-100",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-50 to-amber-100",
    iconWrap: "bg-white text-amber-600",
    text: "text-amber-900",
    border: "border-amber-200",
    ring: "ring-amber-100",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-50 to-orange-100",
    iconWrap: "bg-white text-orange-600",
    text: "text-orange-900",
    border: "border-orange-200",
    ring: "ring-orange-100",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-50 to-rose-100",
    iconWrap: "bg-white text-rose-600",
    text: "text-rose-900",
    border: "border-rose-200",
    ring: "ring-rose-100",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconWrap: "bg-white text-blue-600",
    text: "text-blue-900",
    border: "border-blue-200",
    ring: "ring-blue-100",
  },
  gray: {
    bg: "bg-gradient-to-br from-gray-50 to-gray-100",
    iconWrap: "bg-white text-gray-600",
    text: "text-gray-900",
    border: "border-gray-200",
    ring: "ring-gray-100",
  },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  hint?: string;
  badge?: string;
  href?: string;
  sparkline?: string; // "0,18 12,16 ..." y values
  sparklineColor?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  tone = "indigo",
  hint,
  badge,
  href,
  sparkline,
  sparklineColor = "#4f46e5",
}: StatCardProps) {
  const c = TONE_CLASSES[tone];
  const inner = (
    <div
      className={clsx(
        "relative h-full overflow-hidden rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        c.bg,
        c.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {icon ? (
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ring-4",
              c.iconWrap,
              c.ring
            )}
          >
            {icon}
          </div>
        ) : (
          <div />
        )}
        {badge && (
          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700 shadow-sm">
            {badge}
          </span>
        )}
        {!badge && href && (
          <ArrowUpRight className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>

      <p className={clsx("mt-4 text-3xl font-bold", c.text)}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
        {label}
      </p>
      {hint && <p className="mt-2 text-xs text-gray-700">{hint}</p>}

      {sparkline && (
        <svg
          className="mt-3 h-6 w-full"
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`sg-${tone}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={sparklineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={`0,24 ${sparkline} 100,24`}
            fill={`url(#sg-${tone})`}
            stroke="none"
          />
          <polyline
            points={sparkline}
            fill="none"
            stroke={sparklineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}
