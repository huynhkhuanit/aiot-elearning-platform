"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    CheckCircle2,
    ExternalLink,
    Loader2,
    Sparkles,
    Tag,
    X,
} from "lucide-react";

export interface NodeResource {
    type: "article" | "video" | "course";
    title: string;
    url: string;
    source?: string;
    isPremium?: boolean;
    discount?: string;
}

export interface NodeDetailData {
    description: string;
    relatedConcepts: string[];
    freeResources: NodeResource[];
    aiTutorContent: string;
    premiumResources?: NodeResource[];
}

interface NodeDetailSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    nodeTitle: string;
    nodeDescription?: string;
    nodeStatus: string;
    onStatusChange: (status: string) => void;
    nodeId: string;
}

const resourceTone: Record<NodeResource["type"], string> = {
    article: "roadmap-pill roadmap-pill--accent",
    video: "roadmap-pill roadmap-pill--info",
    course: "roadmap-pill roadmap-pill--success",
};

function normalizeStatus(status: string) {
    if (status === "done" || status === "completed") return "completed";
    if (status === "current" || status === "learning" || status === "in_progress")
        return "learning";
    if (status === "skipped") return "skipped";
    return "pending";
}

function formatStatusLabel(status: string) {
    switch (normalizeStatus(status)) {
        case "completed":
            return "Đã hoàn thành";
        case "learning":
            return "Đang học";
        case "skipped":
            return "Bỏ qua";
        default:
            return "Sẵn sàng";
    }
}

function fallbackDetail(nodeTitle: string, nodeDescription?: string): NodeDetailData {
    return {
        description: nodeDescription || `Tổng quan nhanh về ${nodeTitle}.`,
        relatedConcepts: [],
        freeResources: [
            {
                type: "article",
                title: `Tài liệu MDN về ${nodeTitle}`,
                url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(nodeTitle)}`,
                source: "MDN",
            },
            {
                type: "video",
                title: `Tìm video hướng dẫn ${nodeTitle}`,
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nodeTitle} tutorial`)}`,
                source: "YouTube",
            },
        ],
        aiTutorContent: "",
        premiumResources: [],
    };
}

export default function NodeDetailSidebar({
    isOpen,
    onClose,
    nodeTitle,
    nodeDescription,
    nodeStatus,
    onStatusChange,
    nodeId,
}: NodeDetailSidebarProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [nodeDetail, setNodeDetail] = useState<NodeDetailData | null>(null);

    const normalizedStatus = useMemo(
        () => normalizeStatus(nodeStatus),
        [nodeStatus],
    );

    const fetchNodeDetail = useCallback(async () => {
        if (!nodeTitle) return;

        setIsLoading(true);
        try {
            const response = await fetch("http://localhost:8000/api/node-detail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: nodeTitle,
                    context: null,
                    user_level: "intermediate",
                }),
            });

            if (!response.ok) {
                setNodeDetail(fallbackDetail(nodeTitle, nodeDescription));
                return;
            }

            const data = await response.json();
            setNodeDetail({
                description: data.description || nodeDescription || "",
                relatedConcepts: data.related_concepts || [],
                freeResources: data.free_resources || [],
                aiTutorContent: data.ai_tutor_content || "",
                premiumResources: data.premium_resources || [],
            });
        } catch (error) {
            console.error("Failed to fetch node detail:", error);
            setNodeDetail(fallbackDetail(nodeTitle, nodeDescription));
        } finally {
            setIsLoading(false);
        }
    }, [nodeDescription, nodeTitle]);

    useEffect(() => {
        if (isOpen && nodeTitle) {
            void fetchNodeDetail();
        }
    }, [fetchNodeDetail, isOpen, nodeTitle]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const actionButtons = [
        {
            label: "Đánh dấu hoàn thành",
            target: "completed",
            className:
                normalizedStatus === "completed"
                    ? "roadmap-pill roadmap-pill--success"
                    : "roadmap-pill",
        },
        {
            label: "Đang học",
            target: "learning",
            className:
                normalizedStatus === "learning"
                    ? "roadmap-pill roadmap-pill--info"
                    : "roadmap-pill",
        },
        {
            label: "Bỏ qua",
            target: "skipped",
            className:
                normalizedStatus === "skipped"
                    ? "roadmap-pill roadmap-pill--warning"
                    : "roadmap-pill",
        },
    ];

    const handleStatusSelect = (target: string) => {
        const current = normalizeStatus(nodeStatus);
        if (current === target) {
            onStatusChange("available");
            return;
        }

        if (target === "completed") {
            onStatusChange("done");
        } else if (target === "learning") {
            onStatusChange("learning");
        } else if (target === "skipped") {
            onStatusChange("skipped");
        }
    };

    return (
        <AnimatePresence>
            {isOpen ? (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-slate-950/50"
                        onClick={onClose}
                    />

                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{
                            type: "spring",
                            damping: 26,
                            stiffness: 240,
                            mass: 0.84,
                        }}
                        className="fixed right-0 top-0 z-[95] flex h-[100dvh] w-full max-w-[520px] flex-col border-l border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
                    >
                        <div className="border-b border-slate-200 bg-white px-6 py-5">
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <span className="roadmap-pill roadmap-pill--accent">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            Node detail
                                        </span>
                                        <span
                                            className={
                                                normalizedStatus === "completed"
                                                    ? "roadmap-pill roadmap-pill--success"
                                                    : normalizedStatus ===
                                                        "learning"
                                                      ? "roadmap-pill roadmap-pill--info"
                                                      : normalizedStatus ===
                                                          "skipped"
                                                        ? "roadmap-pill roadmap-pill--warning"
                                                        : "roadmap-pill"
                                            }
                                        >
                                            {formatStatusLabel(nodeStatus)}
                                        </span>
                                    </div>
                                    <h2 className="!text-[1.7rem] font-bold tracking-[-0.04em] text-slate-950">
                                        {nodeTitle}
                                    </h2>
                                    {(nodeDetail?.description ||
                                        nodeDescription) && (
                                        <p className="mt-3 text-sm leading-7 text-slate-600">
                                            {nodeDetail?.description ||
                                                nodeDescription}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {actionButtons.map((button) => (
                                    <button
                                        key={button.target}
                                        type="button"
                                        className={button.className}
                                        onClick={() =>
                                            handleStatusSelect(button.target)
                                        }
                                    >
                                        {button.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="roadmap-notice">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Đang thu thập tài nguyên liên quan...
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((item) => (
                                            <div
                                                key={item}
                                                className="h-20 animate-pulse rounded-[22px] border border-slate-200 bg-slate-50"
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {nodeDetail?.relatedConcepts &&
                                    nodeDetail.relatedConcepts.length > 0 ? (
                                        <section className="roadmap-form-shell !rounded-[22px] !p-5">
                                            <div className="mb-3 flex items-center gap-2 text-slate-900">
                                                <Tag className="h-4 w-4" />
                                                <h3 className="!text-base font-bold">
                                                    Khái niệm liên quan
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {nodeDetail.relatedConcepts.map(
                                                    (concept) => (
                                                        <span
                                                            key={concept}
                                                            className="roadmap-pill"
                                                        >
                                                            {concept}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </section>
                                    ) : null}

                                    <section className="roadmap-form-shell !rounded-[22px] !p-5">
                                        <div className="mb-4 flex items-center gap-2 text-slate-900">
                                            <BookOpen className="h-4 w-4" />
                                            <h3 className="!text-base font-bold">
                                                Tài nguyên miễn phí
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {(nodeDetail?.freeResources || []).map(
                                                (resource, index) => (
                                                    <a
                                                        key={`${resource.title}-${index}`}
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block rounded-[20px] border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                                                    >
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <span
                                                                className={
                                                                    resourceTone[
                                                                        resource
                                                                            .type
                                                                    ]
                                                                }
                                                            >
                                                                {resource.type}
                                                            </span>
                                                            {resource.source ? (
                                                                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                                                                    {
                                                                        resource.source
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-bold leading-6 text-slate-900">
                                                                    {
                                                                        resource.title
                                                                    }
                                                                </p>
                                                                {resource.discount ? (
                                                                    <p className="mt-1 text-xs text-amber-700">
                                                                        {
                                                                            resource.discount
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                                        </div>
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    </section>

                                    <section className="roadmap-form-shell !rounded-[22px] !p-5">
                                        <div className="mb-4 flex items-center gap-2 text-slate-900">
                                            <Sparkles className="h-4 w-4" />
                                            <h3 className="!text-base font-bold">
                                                Gợi ý AI tutor
                                            </h3>
                                        </div>
                                        <p className="text-sm leading-7 text-slate-600">
                                            {nodeDetail?.aiTutorContent ||
                                                `Tập trung vào định nghĩa cốt lõi, ví dụ thực tế và mối liên hệ của ${nodeTitle} với các chủ đề đứng trước và sau trong roadmap.`}
                                        </p>
                                    </section>

                                    {nodeDetail?.premiumResources &&
                                    nodeDetail.premiumResources.length > 0 ? (
                                        <section className="roadmap-form-shell !rounded-[22px] !p-5">
                                            <div className="mb-4 flex items-center gap-2 text-slate-900">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <h3 className="!text-base font-bold">
                                                    Tài nguyên nâng cao
                                                </h3>
                                            </div>
                                            <div className="space-y-3">
                                                {nodeDetail.premiumResources.map(
                                                    (resource, index) => (
                                                        <a
                                                            key={`${resource.title}-${index}`}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block rounded-[20px] border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-slate-300 hover:bg-white"
                                                        >
                                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                                <span
                                                                    className={
                                                                        resourceTone[
                                                                            resource
                                                                                .type
                                                                        ]
                                                                    }
                                                                >
                                                                    {
                                                                        resource.type
                                                                    }
                                                                </span>
                                                                {resource.discount ? (
                                                                    <span className="roadmap-pill roadmap-pill--warning">
                                                                        {
                                                                            resource.discount
                                                                        }
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex items-start justify-between gap-4">
                                                                <p className="text-sm font-bold leading-6 text-slate-900">
                                                                    {
                                                                        resource.title
                                                                    }
                                                                </p>
                                                                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                                                            </div>
                                                        </a>
                                                    ),
                                                )}
                                            </div>
                                        </section>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 bg-white px-6 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs uppercase tracking-[0.1em] text-slate-400">
                                    Node ID: {nodeId || "n/a"}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleStatusSelect("learning")}
                                        className="roadmap-button"
                                    >
                                        Đánh dấu đang học
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatusSelect("completed")}
                                        className="roadmap-button roadmap-button--primary"
                                    >
                                        Hoàn thành node
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>
    );
}
