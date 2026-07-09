"use client";

import React from "react";
import clsx from "clsx";

interface SectionCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
  className?: string;
  variant?: "default" | "muted";
}

export default function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  padded = true,
  className,
  variant = "default",
}: SectionCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border shadow-sm",
        variant === "muted"
          ? "border-gray-200 bg-gray-50"
          : "border-gray-200 bg-white",
        className
      )}
    >
      {(title || icon || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon && <div className="text-gray-500">{icon}</div>}
              {title && (
                <h3 className="truncate text-base font-bold text-gray-900">
                  {title}
                </h3>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}
