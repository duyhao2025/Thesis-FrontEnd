import React from "react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Card({
  children,
  className,
  title,
  subtitle,
  action,
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white shadow-sm",
        className
      )}
      style={{ borderColor: "var(--role-card-border)" }}
    >
      {(title || subtitle || action) && (
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderColor: "var(--role-card-header-border)", borderBottom: "1px solid" }}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
