"use client";

import React from "react";
import clsx from "clsx";
import { Check, Clock, Circle } from "lucide-react";

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  date?: string;
  status: "done" | "active" | "todo";
  pill?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

const STATUS_STYLES: Record<
  TimelineItem["status"],
  {
    iconWrap: string;
    icon: React.ReactNode;
    line: string;
    pill: string;
  }
> = {
  done: {
    iconWrap: "bg-emerald-500 text-white ring-emerald-100",
    icon: <Check className="h-4 w-4" />,
    line: "bg-emerald-200",
    pill: "bg-emerald-100 text-emerald-700",
  },
  active: {
    iconWrap: "bg-amber-500 text-white ring-amber-100",
    icon: <Clock className="h-4 w-4" />,
    line: "bg-amber-200",
    pill: "bg-amber-100 text-amber-700",
  },
  todo: {
    iconWrap: "bg-gray-200 text-gray-500 ring-gray-100",
    icon: <Circle className="h-4 w-4" />,
    line: "bg-gray-200",
    pill: "bg-gray-100 text-gray-600",
  },
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative space-y-5 pl-7">
      <span
        aria-hidden
        className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-200 via-amber-200 to-gray-200"
      />
      {items.map((it) => {
        const s = STATUS_STYLES[it.status];
        return (
          <li key={it.id} className="relative">
            <span
              className={clsx(
                "absolute -left-7 top-0.5 flex h-6 w-6 items-center justify-center rounded-full ring-4 shadow-sm",
                s.iconWrap
              )}
            >
              {s.icon}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{it.title}</p>
              {it.pill && (
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    s.pill
                  )}
                >
                  {it.pill}
                </span>
              )}
              {it.date && (
                <span className="ml-auto text-xs text-gray-500">{it.date}</span>
              )}
            </div>
            {it.description && (
              <p className="mt-0.5 text-xs text-gray-600">{it.description}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
