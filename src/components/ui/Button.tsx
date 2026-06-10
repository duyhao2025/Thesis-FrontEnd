import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";

  const variants = {
    primary: "text-white hover:opacity-90 focus:ring-offset-0 disabled:opacity-50",
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
  };

  // Primary uses CSS variable
  const primaryBg = "bg-[var(--role-primary)]";
  const primaryHoverBg = "hover:bg-[var(--role-primary-hover)]";
  const primaryFocusRing = "focus:ring-[var(--role-primary)]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variant === "primary" ? [primaryBg, primaryHoverBg, primaryFocusRing] : variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
