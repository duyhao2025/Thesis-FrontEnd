"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import clsx from "clsx";
import type { RoleTheme } from "@/lib/roleTheme";

interface HeroBannerProps {
  fullName: string;
  roleLabel: string;
  subtitle?: string;
  email?: string;
  extras?: React.ReactNode;
  actions?: React.ReactNode;
  theme: RoleTheme;
  initials?: string;
  highlight?: string;
}

export default function HeroBanner({
  fullName,
  roleLabel,
  subtitle,
  email,
  extras,
  actions,
  theme,
  initials,
  highlight,
}: HeroBannerProps) {
  const computed =
    initials ??
    (fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
      "?");

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg",
        theme.gradient
      )}
    >
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-0 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

      <div className="relative z-10 flex flex-col items-start gap-6 px-6 py-7 sm:flex-row sm:items-center sm:px-8 sm:py-8">
        <div
          className={clsx(
            "flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md ring-4 ring-white/25 sm:h-24 sm:w-24 sm:text-3xl",
            theme.initialsBg
          )}
        >
          {computed}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold leading-tight text-white sm:text-3xl">
              {fullName}
            </h1>
            {highlight && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                <Sparkles className="h-3 w-3" />
                {highlight}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-medium backdrop-blur">
              {roleLabel}
            </span>
            {subtitle && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 backdrop-blur">
                {subtitle}
              </span>
            )}
            {extras}
          </div>

          {email && (
            <p className="mt-2 text-sm text-white/85">📧 {email}</p>
          )}
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-col sm:items-stretch">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
