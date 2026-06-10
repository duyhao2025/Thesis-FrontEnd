"use client";

import React from "react";
import clsx from "clsx";
import Spinner from "./Spinner";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey?: keyof T;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = "Không có dữ liệu",
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border"
      style={{ borderColor: "var(--role-card-border)" }}
    >
      <table className="min-w-full divide-y">
        <thead
          style={{ backgroundColor: "var(--role-sidebar-bg)" }}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                  col.className
                )}
                style={{ color: "var(--role-sidebar-text)" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y bg-white" style={{ borderColor: "var(--role-card-border)" }}>
          {data.map((row, idx) => {
            const key = rowKey ? String(row[rowKey]) : idx;
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      "whitespace-nowrap px-4 py-3 text-sm text-gray-800",
                      col.className
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
