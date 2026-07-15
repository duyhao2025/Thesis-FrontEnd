"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  iconClassName?: string;
  subtitle?: string;
  className?: string;
}

const colorSchemes: Record<string, { bg: string; text: string; ring: string }> = {
  blue:    { bg: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200" },
  green:   { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200" },
  amber:   { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200" },
  purple:  { bg: "bg-purple-50", text: "text-purple-700", ring: "ring-purple-200" },
  indigo:  { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200" },
  teal:    { bg: "bg-teal-50",   text: "text-teal-700",   ring: "ring-teal-200" },
  red:     { bg: "bg-red-50",    text: "text-red-700",    ring: "ring-red-200" },
  gray:    { bg: "bg-gray-50",   text: "text-gray-700",   ring: "ring-gray-200" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName = "blue",
  subtitle,
  className,
}: StatCardProps) {
  const scheme = colorSchemes[iconClassName] ?? colorSchemes.blue;

  return (
    <div
      className={clsx(
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={clsx(
              "rounded-lg p-2 ring-1",
              scheme.bg,
              scheme.text,
              scheme.ring
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
