/**
 * Admin UI Components & Utilities
 * Các component tái sử dụng cho admin dashboard
 */

import React from "react";
import { LucideIcon } from "lucide-react";

// Stat Card Component
interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: "blue" | "purple" | "pink" | "green" | "emerald" | "indigo";
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const colorMap = {
    blue: {
        bg: "bg-blue-500/20",
        text: "text-blue-400",
        icon: "text-blue-400",
    },
    purple: {
        bg: "bg-purple-500/20",
        text: "text-purple-400",
        icon: "text-purple-400",
    },
    pink: {
        bg: "bg-pink-500/20",
        text: "text-pink-400",
        icon: "text-pink-400",
    },
    green: {
        bg: "bg-green-500/20",
        text: "text-green-400",
        icon: "text-green-400",
    },
    emerald: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-400",
        icon: "text-emerald-400",
    },
    indigo: {
        bg: "bg-indigo-500/20",
        text: "text-indigo-400",
        icon: "text-indigo-400",
    },
};

export function StatCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
}: StatCardProps) {
    const colors = colorMap[color];

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div
                    className={`p-3 ${colors.bg} rounded-lg group-hover:${colors.bg} transition`}
                >
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    {label}
                </span>
            </div>
            <div className="space-y-2">
                <p className="text-4xl font-bold text-slate-100">{value}</p>
                {trend && (
                    <p
                        className={`text-sm font-medium ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
                    >
                        {trend.isPositive ? "+" : ""}
                        {trend.value}% {trend.isPositive ? "naik" : "hạ"}
                    </p>
                )}
            </div>
        </div>
    );
}

// Section Card Component
interface SectionCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
}

export function SectionCard({
    title,
    description,
    icon: Icon,
    children,
}: SectionCardProps) {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-all duration-300">
            {(title || Icon) && (
                <div className="flex items-center gap-3 mb-6">
                    {Icon && (
                        <div className="p-3 bg-indigo-500/20 rounded-lg">
                            <Icon className="w-5 h-5 text-indigo-400" />
                        </div>
                    )}
                    {title && (
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">
                                {title}
                            </h2>
                            {description && (
                                <p className="text-sm text-slate-400 mt-1">
                                    {description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}

// Alert Component
interface AlertProps {
    type: "success" | "error" | "warning" | "info";
    title?: string;
    message: string;
    icon?: LucideIcon;
}

const alertConfig = {
    success: {
        bg: "bg-green-500/10",
        border: "border-green-500/30",
        text: "text-green-300",
        icon: "text-green-400",
    },
    error: {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-300",
        icon: "text-red-400",
    },
    warning: {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-300",
        icon: "text-amber-400",
    },
    info: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        text: "text-blue-300",
        icon: "text-blue-400",
    },
};

export function Alert({ type, title, message, icon: Icon }: AlertProps) {
    const config = alertConfig[type];

    return (
        <div
            className={`p-4 ${config.bg} border ${config.border} rounded-lg flex items-start gap-3`}
        >
            {Icon && (
                <Icon
                    className={`w-5 h-5 ${config.icon} flex-shrink-0 mt-0.5`}
                />
            )}
            <div className="flex-1">
                {title && (
                    <p className={`font-medium ${config.text}`}>{title}</p>
                )}
                <p className={`text-sm ${config.text} ${title ? "mt-1" : ""}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: LucideIcon;
}

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon: Icon,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const variantClass = {
        primary:
            "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-600/50",
        secondary:
            "bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:bg-slate-700/50",
        danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-600/50",
    };

    const sizeClass = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            className={`flex items-center gap-2 rounded-lg transition font-medium disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : (
                Icon && <Icon className="w-4 h-4" />
            )}
            {children}
        </button>
    );
}

// Status Badge Component
interface BadgeProps {
    status: "active" | "inactive" | "draft" | "published" | "pending";
    label: string;
}

const statusConfig = {
    active: {
        bg: "bg-green-500/20",
        text: "text-green-300",
        border: "border-green-500/30",
    },
    inactive: {
        bg: "bg-slate-500/20",
        text: "text-slate-300",
        border: "border-slate-500/30",
    },
    draft: {
        bg: "bg-slate-600/20",
        text: "text-slate-400",
        border: "border-slate-600/30",
    },
    published: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-300",
        border: "border-emerald-500/30",
    },
    pending: {
        bg: "bg-amber-500/20",
        text: "text-amber-300",
        border: "border-amber-500/30",
    },
};

export function Badge({ status, label }: BadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={`text-xs px-2.5 py-1 rounded-full ${config.bg} ${config.text} border ${config.border} font-medium`}
        >
            {label}
        </span>
    );
}

// Empty State Component
interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-lg">
            <Icon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-200 font-medium">{title}</p>
            {description && (
                <p className="text-slate-500 text-sm mt-1">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium text-sm"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
