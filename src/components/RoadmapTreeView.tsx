"use client";

import React, {
    useState,
    useCallback,
    useRef,
    useEffect,
    useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    X,
} from "lucide-react";
import Link from "next/link";
import NodeDetailSidebar from "./NodeDetailSidebar";
import {
    RoadmapLegendCard,
    RoadmapViewerHeader,
    roadmapHomeBreadcrumb,
} from "./roadmap/RoadmapViewerChrome";
import "@/app/roadmap-tree.css";

export interface RoadmapNodeData {
    id: string;
    title: string;
    description: string;
    type: "core" | "optional" | "beginner" | "alternative" | "project";
    status:
        | "available"
        | "completed"
        | "current"
        | "locked"
        | "done"
        | "learning"
        | "skipped";
    duration?: string;
    technologies?: string[];
    difficulty?: "Cơ bản" | "Trung cấp" | "Nâng cao";
    children?: RoadmapNodeData[];
}

interface RoadmapTreeViewProps {
    roadmapId: string;
    roadmapTitle: string;
    roadmapData: RoadmapNodeData;
    initialProgress?: Record<string, string>;
    onProgressUpdate?: (nodeId: string, status: string) => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    node: RoadmapNodeData;
}

function matchesSearch(node: RoadmapNodeData, query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const haystacks = [
        node.title,
        node.description,
        ...(node.technologies || []),
        node.duration || "",
        node.difficulty || "",
    ]
        .join(" ")
        .toLowerCase();

    if (haystacks.includes(normalizedQuery)) return true;
    return (node.children || []).some((child) => matchesSearch(child, query));
}

const ContextMenu: React.FC<{
    x: number;
    y: number;
    node: RoadmapNodeData;
    status: string;
    onClose: () => void;
    onStatusChange: (status: string) => void;
    onViewDetails: () => void;
}> = ({ x, y, node, status, onClose, onStatusChange, onViewDetails }) => {
    useEffect(() => {
        const handleClick = () => onClose();
        const handleScroll = () => onClose();
        document.addEventListener("click", handleClick);
        document.addEventListener("scroll", handleScroll, true);
        return () => {
            document.removeEventListener("click", handleClick);
            document.removeEventListener("scroll", handleScroll, true);
        };
    }, [onClose]);

    const isDone = status === "done" || status === "completed";
    const isLearning = status === "learning" || status === "current";
    const isSkipped = status === "skipped";

    const adjustedX = Math.min(x, window.innerWidth - 228);
    const adjustedY = Math.min(y, window.innerHeight - 300);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            style={{ left: adjustedX, top: adjustedY }}
            className="roadmap-tree__context-menu"
            onClick={(event) => event.stopPropagation()}
        >
            <div className="roadmap-tree__context-menu-header">
                {node.title}
            </div>

            <div
                className="roadmap-tree__context-menu-item"
                onClick={onViewDetails}
            >
                <Eye className="w-4 h-4" />
                <span>Xem chi tiết</span>
            </div>

            <div className="roadmap-tree__context-menu-divider" />

            <div
                className={`roadmap-tree__context-menu-item ${
                    isDone ? "roadmap-tree__context-menu-item--active" : ""
                }`}
                onClick={() => onStatusChange(isDone ? "available" : "done")}
            >
                <CheckCircle className="w-4 h-4" />
                <span>
                    {isDone
                        ? "Bỏ đánh dấu hoàn thành"
                        : "Đánh dấu hoàn thành"}
                </span>
            </div>

            <div
                className={`roadmap-tree__context-menu-item ${
                    isLearning ? "roadmap-tree__context-menu-item--active" : ""
                }`}
                onClick={() =>
                    onStatusChange(isLearning ? "available" : "learning")
                }
            >
                <BookOpen className="w-4 h-4" />
                <span>
                    {isLearning
                        ? "Bỏ trạng thái đang học"
                        : "Đánh dấu đang học"}
                </span>
            </div>

            <div
                className={`roadmap-tree__context-menu-item ${
                    isSkipped ? "roadmap-tree__context-menu-item--active" : ""
                }`}
                onClick={() =>
                    onStatusChange(isSkipped ? "available" : "skipped")
                }
            >
                <X className="w-4 h-4" />
                <span>
                    {isSkipped ? "Bỏ trạng thái bỏ qua" : "Đánh dấu bỏ qua"}
                </span>
            </div>
        </motion.div>
    );
};

const SubTopicNode: React.FC<{
    node: RoadmapNodeData;
    nodeStatuses: Map<string, string>;
    onNodeClick: (node: RoadmapNodeData) => void;
    onContextMenu: (node: RoadmapNodeData, e: React.MouseEvent) => void;
    position: "left" | "right";
}> = ({ node, nodeStatuses, onNodeClick, onContextMenu, position }) => {
    const status = nodeStatuses.get(node.id) || node.status;
    const isDone = status === "done" || status === "completed";

    const className = [
        "roadmap-subtopic-node",
        `roadmap-subtopic-node--${node.type}`,
        isDone ? "roadmap-subtopic-node--done" : "",
        status === "learning" || status === "current"
            ? "roadmap-subtopic-node--learning"
            : "",
        status === "skipped" ? "roadmap-subtopic-node--skipped" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            className={`roadmap-subtopic ${
                position === "left"
                    ? "roadmap-subtopic--left"
                    : "roadmap-subtopic--right"
            }`}
        >
            <div className="roadmap-subtopic__connector" />
            <motion.div
                className={className}
                onClick={(event) => {
                    event.stopPropagation();
                    onNodeClick(node);
                }}
                onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onContextMenu(node, event);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className="roadmap-subtopic-node__title">
                    {node.title}
                </span>
                {isDone ? (
                    <CheckCircle className="roadmap-subtopic-node__check" />
                ) : null}
            </motion.div>
        </div>
    );
};

const MainTopicRow: React.FC<{
    node: RoadmapNodeData;
    nodeStatuses: Map<string, string>;
    onNodeClick: (node: RoadmapNodeData) => void;
    onContextMenu: (node: RoadmapNodeData, e: React.MouseEvent) => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ node, nodeStatuses, onNodeClick, onContextMenu, isFirst, isLast }) => {
    const status = nodeStatuses.get(node.id) || node.status;
    const hasChildren = (node.children || []).length > 0;
    const [isExpanded, setIsExpanded] = useState(true);

    const leftChildren = useMemo(
        () => (node.children || []).filter((_, index) => index % 2 === 0),
        [node.children],
    );
    const rightChildren = useMemo(
        () => (node.children || []).filter((_, index) => index % 2 === 1),
        [node.children],
    );

    const isDone = status === "done" || status === "completed";
    const isLearning = status === "learning" || status === "current";

    const className = [
        "roadmap-main-node",
        `roadmap-main-node--${node.type}`,
        isDone ? "roadmap-main-node--done" : "",
        isLearning ? "roadmap-main-node--learning" : "",
        status === "skipped" ? "roadmap-main-node--skipped" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className="roadmap-row">
            {!isFirst ? <div className="roadmap-row__connector-top" /> : null}
            {!isLast ? (
                <div className="roadmap-row__connector-bottom" />
            ) : null}

            <div className="roadmap-row__left">
                <AnimatePresence>
                    {isExpanded
                        ? leftChildren.map((child, index) => (
                              <motion.div
                                  key={child.id}
                                  initial={{ opacity: 0, x: 18 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 18 }}
                                  transition={{ delay: index * 0.05 }}
                              >
                                  <SubTopicNode
                                      node={child}
                                      nodeStatuses={nodeStatuses}
                                      onNodeClick={onNodeClick}
                                      onContextMenu={onContextMenu}
                                      position="left"
                                  />
                              </motion.div>
                          ))
                        : null}
                </AnimatePresence>
            </div>

            <div className="roadmap-row__center">
                <motion.div
                    className={className}
                    onClick={(event) => {
                        event.stopPropagation();
                        onNodeClick(node);
                    }}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onContextMenu(node, event);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className="roadmap-main-node__title">
                        {node.title}
                    </span>

                    {isDone ? (
                        <div className="roadmap-main-node__badge roadmap-main-node__badge--done">
                            <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                    ) : null}

                    {isLearning ? (
                        <div className="roadmap-main-node__badge roadmap-main-node__badge--learning">
                            <BookOpen className="w-3 h-3 text-white" />
                        </div>
                    ) : null}

                    {hasChildren ? (
                        <button
                            className="roadmap-main-node__toggle"
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsExpanded((previous) => !previous);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                    ) : null}
                </motion.div>
            </div>

            <div className="roadmap-row__right">
                <AnimatePresence>
                    {isExpanded
                        ? rightChildren.map((child, index) => (
                              <motion.div
                                  key={child.id}
                                  initial={{ opacity: 0, x: -18 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -18 }}
                                  transition={{ delay: index * 0.05 }}
                              >
                                  <SubTopicNode
                                      node={child}
                                      nodeStatuses={nodeStatuses}
                                      onNodeClick={onNodeClick}
                                      onContextMenu={onContextMenu}
                                      position="right"
                                  />
                              </motion.div>
                          ))
                        : null}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default function RoadmapTreeView({
    roadmapId,
    roadmapTitle,
    roadmapData,
    initialProgress,
    onProgressUpdate,
}: RoadmapTreeViewProps) {
    const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(
        null,
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    const mainTopics = useMemo(() => {
        const source = roadmapData.children?.length
            ? roadmapData.children
            : [roadmapData];
        return source.filter((topic) => matchesSearch(topic, searchQuery));
    }, [roadmapData, searchQuery]);

    const [nodeStatuses, setNodeStatuses] = useState<Map<string, string>>(
        () => {
            const statusMap = new Map<string, string>();
            const collectStatus = (node: RoadmapNodeData) => {
                statusMap.set(node.id, node.status);
                (node.children || []).forEach(collectStatus);
            };
            collectStatus(roadmapData);

            if (initialProgress) {
                for (const [nodeId, status] of Object.entries(initialProgress)) {
                    if (!statusMap.has(nodeId) || status === "pending") continue;
                    const mapped =
                        status === "completed"
                            ? "done"
                            : status === "in_progress"
                              ? "learning"
                              : status;
                    statusMap.set(nodeId, mapped);
                }
            }

            return statusMap;
        },
    );

    const allNodeIds = useMemo(() => {
        const ids = new Set<string>();
        const collect = (node: RoadmapNodeData) => {
            ids.add(node.id);
            (node.children || []).forEach(collect);
        };

        if (roadmapData.children?.length) {
            roadmapData.children.forEach(collect);
        } else {
            collect(roadmapData);
        }

        return ids;
    }, [roadmapData]);

    const progressStats = useMemo(() => {
        let done = 0;
        let learning = 0;
        let skipped = 0;
        nodeStatuses.forEach((status, nodeId) => {
            if (!allNodeIds.has(nodeId)) return;
            if (status === "done" || status === "completed") done += 1;
            else if (status === "learning" || status === "current")
                learning += 1;
            else if (status === "skipped") skipped += 1;
        });

        const total = allNodeIds.size;
        return {
            total,
            done,
            learning,
            skipped,
            percentage: total > 0 ? Math.round((done / total) * 100) : 0,
        };
    }, [allNodeIds, nodeStatuses]);

    const handleStatusChange = useCallback(
        (nodeId: string, newStatus: string) => {
            setNodeStatuses((previous) => {
                const next = new Map(previous);
                next.set(nodeId, newStatus);
                return next;
            });
            setContextMenu(null);

            if (onProgressUpdate) {
                const dbStatus =
                    newStatus === "done"
                        ? "completed"
                        : newStatus === "learning"
                          ? "in_progress"
                          : newStatus === "available"
                            ? "pending"
                            : newStatus;
                onProgressUpdate(nodeId, dbStatus);
            }
        },
        [onProgressUpdate],
    );

    const handleNodeClick = useCallback((node: RoadmapNodeData) => {
        setSelectedNode(node);
        setIsSidebarOpen(true);
    }, []);

    const handleContextMenu = useCallback(
        (node: RoadmapNodeData, event: React.MouseEvent) => {
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                node,
            });
        },
        [],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "f") {
                event.preventDefault();
                searchRef.current?.focus();
            }

            if (event.key === "Escape") {
                setIsSidebarOpen(false);
                setContextMenu(null);
                setSearchQuery("");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="roadmap-tree-page">
            <RoadmapViewerHeader
                title={roadmapTitle}
                description="Theo dõi tiến độ trực tiếp trên sơ đồ học tập. Nhấp để xem tài nguyên, nhấp phải để đổi trạng thái và dùng tìm kiếm để thu hẹp chủ đề."
                backHref={`/roadmap/${roadmapId}`}
                backLabel="Quay lại tổng quan"
                breadcrumbs={[
                    roadmapHomeBreadcrumb,
                    { label: "Lộ trình", href: "/roadmap" },
                    { label: roadmapTitle },
                ]}
                stats={[
                    {
                        label: "hoàn thành",
                        value: String(progressStats.done),
                        tone: "done",
                    },
                    {
                        label: "đang học",
                        value: String(progressStats.learning),
                        tone: "learning",
                    },
                    {
                        label: "bỏ qua",
                        value: String(progressStats.skipped),
                        tone: "warning",
                    },
                ]}
                progressPercentage={progressStats.percentage}
                totalLabel={`${progressStats.total} chủ đề`}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchRef={searchRef}
                tabs={[
                    { label: "Tổng quan", href: `/roadmap/${roadmapId}` },
                    { label: "Lộ trình", active: true },
                ]}
                actions={
                    <Link
                        href={`/roadmap/${roadmapId}`}
                        className="roadmap-button roadmap-button--ghost"
                    >
                        Xem mô tả
                    </Link>
                }
            />

            <div className="roadmap-vertical-tree">
                <div className="roadmap-vertical-tree__container">
                    <div className="roadmap-vertical-tree__root">
                        <motion.div
                            className="roadmap-root-node"
                            initial={{ opacity: 0, y: -18 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <span className="roadmap-root-node__title">
                                {roadmapData.title}
                            </span>
                        </motion.div>
                    </div>

                    <div className="roadmap-vertical-tree__content">
                        {mainTopics.length > 0 ? (
                            mainTopics.map((topic, index) => (
                                <MainTopicRow
                                    key={topic.id}
                                    node={topic}
                                    nodeStatuses={nodeStatuses}
                                    onNodeClick={handleNodeClick}
                                    onContextMenu={handleContextMenu}
                                    isFirst={index === 0}
                                    isLast={index === mainTopics.length - 1}
                                />
                            ))
                        ) : (
                            <div className="roadmap-empty-state roadmap-surface">
                                <div className="roadmap-empty-state__title">
                                    Không tìm thấy chủ đề phù hợp
                                </div>
                                <p className="roadmap-empty-state__body">
                                    Thử từ khóa khác hoặc xoá bộ lọc tìm kiếm để
                                    quay lại toàn bộ roadmap.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <RoadmapLegendCard
                groups={[
                    {
                        title: "Loại nội dung",
                        items: [
                            {
                                label: "Cốt lõi",
                                modifier:
                                    "roadmap-tree__legend-color--topic",
                            },
                            {
                                label: "Tuỳ chọn",
                                modifier:
                                    "roadmap-tree__legend-color--subtopic",
                            },
                            {
                                label: "Cơ bản",
                                modifier:
                                    "roadmap-tree__legend-color--beginner",
                            },
                            {
                                label: "Thay thế",
                                modifier:
                                    "roadmap-tree__legend-color--alternative",
                            },
                        ],
                    },
                    {
                        title: "Trạng thái",
                        items: [
                            {
                                label: "Đã hoàn thành",
                                modifier: "roadmap-tree__legend-color--done",
                            },
                            {
                                label: "Đang học",
                                modifier:
                                    "roadmap-tree__legend-color--learning",
                            },
                            {
                                label: "Bỏ qua",
                                modifier:
                                    "roadmap-tree__legend-color--skipped",
                            },
                        ],
                    },
                ]}
                interactions={[
                    "Nhấp: mở chi tiết chủ đề",
                    "Nhấp phải: đổi trạng thái nhanh",
                    "Ctrl/Cmd + F: mở ô tìm kiếm",
                ]}
            />

            <AnimatePresence>
                {contextMenu ? (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        node={contextMenu.node}
                        status={
                            nodeStatuses.get(contextMenu.node.id) || "available"
                        }
                        onClose={() => setContextMenu(null)}
                        onStatusChange={(status) =>
                            handleStatusChange(contextMenu.node.id, status)
                        }
                        onViewDetails={() => {
                            handleNodeClick(contextMenu.node);
                            setContextMenu(null);
                        }}
                    />
                ) : null}
            </AnimatePresence>

            <NodeDetailSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                nodeTitle={selectedNode?.title || ""}
                nodeDescription={selectedNode?.description}
                nodeStatus={
                    selectedNode
                        ? nodeStatuses.get(selectedNode.id) || "available"
                        : "available"
                }
                onStatusChange={(status) =>
                    selectedNode && handleStatusChange(selectedNode.id, status)
                }
                nodeId={selectedNode?.id || ""}
            />
        </div>
    );
}
