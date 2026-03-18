"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import {
    ArrowLeft,
    ChevronRight,
    Home,
    Search,
    X,
    type LucideIcon,
} from "lucide-react";

export interface RoadmapViewerBreadcrumb {
    label: string;
    href?: string;
    icon?: LucideIcon;
}

export interface RoadmapViewerStat {
    label: string;
    value: string;
    tone?: "neutral" | "done" | "learning" | "warning";
}

export interface RoadmapViewerTab {
    label: string;
    href?: string;
    active?: boolean;
}

interface RoadmapViewerHeaderProps {
    title: string;
    description?: string;
    backHref: string;
    backLabel: string;
    breadcrumbs: RoadmapViewerBreadcrumb[];
    stats: RoadmapViewerStat[];
    progressPercentage: number;
    progressLabel?: string;
    totalLabel?: string;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchRef: RefObject<HTMLInputElement | null>;
    tabs?: RoadmapViewerTab[];
    statusBadge?: ReactNode;
    actions?: ReactNode;
}

export interface RoadmapLegendGroupItem {
    label: string;
    modifier: string;
}

export interface RoadmapLegendGroup {
    title: string;
    items: RoadmapLegendGroupItem[];
}

interface RoadmapLegendCardProps {
    title?: string;
    groups: RoadmapLegendGroup[];
    interactions?: string[];
}

const toneClassName: Record<
    NonNullable<RoadmapViewerStat["tone"]>,
    string
> = {
    neutral: "roadmap-tree-header__stat",
    done: "roadmap-tree-header__stat roadmap-tree-header__stat--done",
    learning: "roadmap-tree-header__stat roadmap-tree-header__stat--learning",
    warning: "roadmap-tree-header__stat roadmap-tree-header__stat--warning",
};

export function RoadmapViewerHeader({
    title,
    description,
    backHref,
    backLabel,
    breadcrumbs,
    stats,
    progressPercentage,
    progressLabel,
    totalLabel,
    searchQuery,
    onSearchChange,
    searchRef,
    tabs,
    statusBadge,
    actions,
}: RoadmapViewerHeaderProps) {
    return (
        <div className="roadmap-tree-header">
            <div className="roadmap-tree-header__inner">
                <nav className="roadmap-tree-header__breadcrumb">
                    {breadcrumbs.map((crumb, index) => {
                        const Icon = crumb.icon;
                        const content = (
                            <>
                                {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                                <span>{crumb.label}</span>
                            </>
                        );

                        return (
                            <div
                                className="roadmap-tree-header__breadcrumb-segment"
                                key={`${crumb.label}-${index}`}
                            >
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="roadmap-tree-header__breadcrumb-link"
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <span className="roadmap-tree-header__breadcrumb-current">
                                        {content}
                                    </span>
                                )}
                                {index < breadcrumbs.length - 1 ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                ) : null}
                            </div>
                        );
                    })}
                </nav>

                <div className="roadmap-tree-header__toolbar">
                    <div className="roadmap-tree-header__left">
                        <Link
                            href={backHref}
                            className="roadmap-tree-header__back"
                            title={backLabel}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>

                        <div className="roadmap-tree-header__title-group">
                            <div className="roadmap-tree-header__title-row">
                                <h1 className="roadmap-tree-header__title">
                                    {title}
                                </h1>
                                {statusBadge}
                            </div>
                            {description ? (
                                <p className="roadmap-tree-header__description">
                                    {description}
                                </p>
                            ) : null}
                        </div>

                        {totalLabel ? (
                            <span className="roadmap-tree-header__count">
                                {totalLabel}
                            </span>
                        ) : null}
                    </div>

                    <div className="roadmap-tree-header__progress">
                        <div className="roadmap-tree-header__stats">
                            {stats.map((stat, index) => (
                                <div
                                    className="roadmap-tree-header__stats-group"
                                    key={`${stat.label}-${index}`}
                                >
                                    <span
                                        className={
                                            toneClassName[
                                                stat.tone || "neutral"
                                            ]
                                        }
                                    >
                                        {stat.value} {stat.label}
                                    </span>
                                    {index < stats.length - 1 ? (
                                        <span className="roadmap-tree-header__stat-dot">
                                            •
                                        </span>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        <div className="roadmap-tree-header__progress-bar">
                            <div className="roadmap-tree-header__progress-track">
                                <div
                                    className="roadmap-tree-header__progress-fill"
                                    style={{
                                        width: `${Math.min(progressPercentage, 100)}%`,
                                    }}
                                />
                            </div>
                            <span className="roadmap-tree-header__progress-pct">
                                {progressLabel || `${progressPercentage}%`}
                            </span>
                        </div>
                    </div>

                    <div className="roadmap-tree-header__right">
                        <label className="roadmap-tree-header__search">
                            <Search className="roadmap-tree-header__search-icon" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Tìm chủ đề..."
                                value={searchQuery}
                                onChange={(event) =>
                                    onSearchChange(event.target.value)
                                }
                                className="roadmap-tree-header__search-input"
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => onSearchChange("")}
                                    className="roadmap-tree-header__search-clear"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : null}
                        </label>
                        {actions}
                    </div>
                </div>

                {tabs && tabs.length > 0 ? (
                    <div className="roadmap-tree-header__tabs">
                        {tabs.map((tab) =>
                            tab.href && !tab.active ? (
                                <Link
                                    href={tab.href}
                                    key={tab.label}
                                    className="roadmap-tree-header__tab"
                                >
                                    {tab.label}
                                </Link>
                            ) : (
                                <span
                                    key={tab.label}
                                    className="roadmap-tree-header__tab roadmap-tree-header__tab--active"
                                >
                                    {tab.label}
                                </span>
                            ),
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export function RoadmapLegendCard({
    title = "Chú giải",
    groups,
    interactions,
}: RoadmapLegendCardProps) {
    return (
        <div className="roadmap-tree__legend">
            <h3 className="roadmap-tree__legend-title">{title}</h3>

            {groups.map((group) => (
                <div className="roadmap-tree__legend-section" key={group.title}>
                    <h4 className="roadmap-tree__legend-section-title">
                        {group.title}
                    </h4>
                    {group.items.map((item) => (
                        <div
                            className="roadmap-tree__legend-item"
                            key={`${group.title}-${item.label}`}
                        >
                            <div
                                className={`roadmap-tree__legend-color ${item.modifier}`}
                            />
                            <span className="roadmap-tree__legend-label">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            ))}

            {interactions && interactions.length > 0 ? (
                <div className="roadmap-tree__legend-section roadmap-tree__legend-section--interactions">
                    <h4 className="roadmap-tree__legend-section-title">
                        Tương tác
                    </h4>
                    <div className="roadmap-tree__legend-copy">
                        {interactions.map((line) => (
                            <div key={line}>{line}</div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export const roadmapHomeBreadcrumb: RoadmapViewerBreadcrumb = {
    label: "Trang chủ",
    href: "/",
    icon: Home,
};
