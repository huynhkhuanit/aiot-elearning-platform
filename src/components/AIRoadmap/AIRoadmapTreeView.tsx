"use client";

import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    BookOpen,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    X,
} from "lucide-react";
import Link from "next/link";
import NodeDetailSidebar from "../NodeDetailSidebar";
import type {
    AIGeneratedRoadmap,
    NodeStatus,
    RoadmapNode,
} from "@/types/ai-roadmap";
import {
    RoadmapLegendCard,
    RoadmapViewerHeader,
    roadmapHomeBreadcrumb,
} from "../roadmap/RoadmapViewerChrome";
import "@/app/roadmap-tree.css";

interface TreeNode {
    id: string;
    title: string;
    description: string;
    type: "core" | "optional" | "beginner" | "alternative" | "project";
    status: NodeStatus;
    subtitle?: string;
    duration?: string;
    technologies?: string[];
    difficulty?: string;
    children?: TreeNode[];
}

interface AIRoadmapTreeViewProps {
    roadmap: AIGeneratedRoadmap;
    roadmapId: string;
    initialProgress?: Record<string, NodeStatus>;
    onProgressUpdate?: (nodeId: string, status: NodeStatus) => void;
    isTempRoadmap?: boolean;
}

interface ContextMenuState {
    x: number;
    y: number;
    node: TreeNode;
}

function matchesSearch(node: TreeNode, query: string): boolean {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;

    const haystacks = [
        node.title,
        node.description,
        node.subtitle || "",
        node.difficulty || "",
        node.duration || "",
        ...(node.technologies || []),
    ]
        .join(" ")
        .toLowerCase();

    if (haystacks.includes(normalizedQuery)) return true;
    return (node.children || []).some((child) => matchesSearch(child, query));
}

function convertToTree(
    roadmap: AIGeneratedRoadmap,
    progress: Record<string, NodeStatus>,
): TreeNode {
    const sections =
        roadmap.sections && roadmap.sections.length > 0
            ? roadmap.sections
            : (roadmap.phases || []).map((phase) => ({
                  id: phase.id,
                  name: phase.name,
                  order: phase.order,
                  description: `Giai đoạn ${phase.order}`,
                  subsections: [],
              }));

    const nodes = roadmap.nodes || [];
    const edges = roadmap.edges || [];
    const nodesBySection: Record<string, RoadmapNode[]> = {};
    const subsectionNameMap = new Map<string, string>();

    sections.forEach((section) => {
        (section.subsections || []).forEach((subsection) => {
            subsectionNameMap.set(subsection.id, subsection.name);
        });
    });

    nodes.forEach((node) => {
        const sectionId = node.section_id || node.phase_id || "default";
        if (!nodesBySection[sectionId]) {
            nodesBySection[sectionId] = [];
        }
        nodesBySection[sectionId].push(node);
    });

    const edgeMap: Record<string, string[]> = {};
    edges.forEach((edge) => {
        if (!edgeMap[edge.source]) {
            edgeMap[edge.source] = [];
        }
        edgeMap[edge.source].push(edge.target);
    });

    const convertNode = (
        node: RoadmapNode,
        subsectionName?: string,
    ): TreeNode => ({
        id: node.id,
        title: node.data.label,
        description: node.data.description,
        type: (node.type as TreeNode["type"]) || "core",
        status: progress[node.id] || "pending",
        subtitle:
            subsectionName ||
            (node.subsection_id
                ? subsectionNameMap.get(node.subsection_id)
                : undefined),
        duration: node.data.estimated_hours
            ? `${node.data.estimated_hours} giờ`
            : undefined,
        difficulty: node.data.difficulty,
        technologies: node.data.learning_resources?.keywords,
    });

    const phaseNodes = sections.map((section) => {
        const sectionNodes = nodesBySection[section.id] || [];
        const sectionMap = new Map<string, RoadmapNode>();
        sectionNodes.forEach((node) => sectionMap.set(node.id, node));

        const targetIds = new Set(
            edges
                .filter(
                    (edge) =>
                        sectionMap.has(edge.source) && sectionMap.has(edge.target),
                )
                .map((edge) => edge.target),
        );

        const roots = sectionNodes.filter((node) => !targetIds.has(node.id));

        const buildSubtree = (
            node: RoadmapNode,
            visited: Set<string>,
        ): TreeNode => {
            if (visited.has(node.id)) {
                return convertNode(node);
            }
            visited.add(node.id);

            const children = (edgeMap[node.id] || [])
                .map((childId) => nodes.find((item) => item.id === childId))
                .filter(
                    (item): item is RoadmapNode =>
                        item !== undefined && sectionMap.has(item.id),
                )
                .map((item) => buildSubtree(item, visited));

            return {
                ...convertNode(node),
                children: children.length > 0 ? children : undefined,
            };
        };

        return {
            id: section.id,
            title: section.name,
            description: section.description || `Giai đoạn ${section.order}`,
            type: "core",
            status: progress[section.id] || "pending",
            children: roots.map((node) => buildSubtree(node, new Set())),
        };
    });

    return {
        id: "root",
        title: roadmap.roadmap_title,
        description: roadmap.roadmap_description,
        type: "core",
        status: "pending",
        duration: `${roadmap.total_estimated_hours} giờ tổng`,
        children: phaseNodes,
    };
}

const ContextMenu: React.FC<{
    x: number;
    y: number;
    node: TreeNode;
    onClose: () => void;
    onStatusChange: (status: NodeStatus) => void;
    onViewDetails: () => void;
}> = ({ x, y, node, onClose, onStatusChange, onViewDetails }) => {
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

    const isDone = node.status === "completed";
    const isLearning = node.status === "in_progress";
    const isSkipped = node.status === "skipped";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            style={{
                left: Math.min(x, window.innerWidth - 228),
                top: Math.min(y, window.innerHeight - 300),
            }}
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
                onClick={() => onStatusChange(isDone ? "pending" : "completed")}
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
                    onStatusChange(isLearning ? "pending" : "in_progress")
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
                onClick={() => onStatusChange(isSkipped ? "pending" : "skipped")}
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
    node: TreeNode;
    onNodeClick: (node: TreeNode) => void;
    onContextMenu: (node: TreeNode, e: React.MouseEvent) => void;
    position: "left" | "right";
}> = ({ node, onNodeClick, onContextMenu, position }) => {
    const isDone = node.status === "completed";
    const isLearning = node.status === "in_progress";
    const isSkipped = node.status === "skipped";

    const className = [
        "roadmap-subtopic-node",
        `roadmap-subtopic-node--${node.type || "core"}`,
        isDone ? "roadmap-subtopic-node--done" : "",
        isLearning ? "roadmap-subtopic-node--learning" : "",
        isSkipped ? "roadmap-subtopic-node--skipped" : "",
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
                <div className="flex flex-col gap-1">
                    <span className="roadmap-subtopic-node__title">
                        {node.title}
                    </span>
                    {node.subtitle || node.duration ? (
                        <span className="text-[11px] font-normal text-slate-500">
                            {[node.subtitle, node.duration]
                                .filter(Boolean)
                                .join(" • ")}
                        </span>
                    ) : null}
                </div>
                {isDone ? (
                    <CheckCircle className="roadmap-subtopic-node__check" />
                ) : null}
            </motion.div>
        </div>
    );
};

const PhaseRow: React.FC<{
    node: TreeNode;
    onNodeClick: (node: TreeNode) => void;
    onContextMenu: (node: TreeNode, e: React.MouseEvent) => void;
    isFirst: boolean;
    isLast: boolean;
}> = ({ node, onNodeClick, onContextMenu, isFirst, isLast }) => {
    const isDone = node.status === "completed";
    const isLearning = node.status === "in_progress";
    const isSkipped = node.status === "skipped";
    const [isExpanded, setIsExpanded] = useState(true);

    const subNodes = useMemo(() => {
        const flattened: TreeNode[] = [];
        const collect = (current: TreeNode) => {
            if (current.id !== node.id) flattened.push(current);
            (current.children || []).forEach(collect);
        };
        (node.children || []).forEach(collect);
        return flattened;
    }, [node]);

    const leftChildren = useMemo(
        () => subNodes.filter((_, index) => index % 2 === 0),
        [subNodes],
    );
    const rightChildren = useMemo(
        () => subNodes.filter((_, index) => index % 2 === 1),
        [subNodes],
    );

    const className = [
        "roadmap-main-node",
        `roadmap-main-node--${node.type || "core"}`,
        isDone ? "roadmap-main-node--done" : "",
        isLearning ? "roadmap-main-node--learning" : "",
        isSkipped ? "roadmap-main-node--skipped" : "",
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
                                  key={`${child.id}-left`}
                                  initial={{ opacity: 0, x: 18 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 18 }}
                                  transition={{ delay: index * 0.04 }}
                              >
                                  <SubTopicNode
                                      node={child}
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
                    <div className="flex flex-col items-center">
                        <span className="roadmap-main-node__title">
                            {node.title}
                        </span>
                        {subNodes.length > 0 ? (
                            <span className="mt-1 text-[11px] font-normal text-slate-500">
                                {subNodes.length} chủ đề chi tiết
                            </span>
                        ) : null}
                    </div>

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

                    {(node.children || []).length > 0 ? (
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
                                  key={`${child.id}-right`}
                                  initial={{ opacity: 0, x: -18 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -18 }}
                                  transition={{ delay: index * 0.04 }}
                              >
                                  <SubTopicNode
                                      node={child}
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

export default function AIRoadmapTreeView({
    roadmap,
    roadmapId,
    initialProgress = {},
    onProgressUpdate,
    isTempRoadmap = false,
}: AIRoadmapTreeViewProps) {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [progress, setProgress] =
        useState<Record<string, NodeStatus>>(initialProgress);
    const searchRef = useRef<HTMLInputElement>(null);

    const treeData = useMemo(
        () => convertToTree(roadmap, progress),
        [roadmap, progress],
    );
    const phases = useMemo(
        () =>
            (treeData.children || []).filter((phase) =>
                matchesSearch(phase, searchQuery),
            ),
        [searchQuery, treeData.children],
    );

    const progressStats = useMemo(() => {
        const total = roadmap.nodes?.length || 0;
        let completed = 0;
        let inProgress = 0;
        let skipped = 0;

        Object.values(progress).forEach((status) => {
            if (status === "completed") completed += 1;
            else if (status === "in_progress") inProgress += 1;
            else if (status === "skipped") skipped += 1;
        });

        return {
            total,
            completed,
            inProgress,
            skipped,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }, [progress, roadmap.nodes]);

    const handleStatusChange = useCallback(
        (nodeId: string, newStatus: NodeStatus) => {
            setProgress((previous) => ({ ...previous, [nodeId]: newStatus }));
            onProgressUpdate?.(nodeId, newStatus);
            setContextMenu(null);
        },
        [onProgressUpdate],
    );

    const handleNodeClick = useCallback((node: TreeNode) => {
        setSelectedNode(node);
        setIsSidebarOpen(true);
    }, []);

    const handleContextMenu = useCallback(
        (node: TreeNode, event: React.MouseEvent) => {
            setContextMenu({ x: event.clientX, y: event.clientY, node });
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
                title={roadmap.roadmap_title}
                description={
                    roadmap.roadmap_description ||
                    "Roadmap AI được sinh theo hồ sơ học tập của bạn và giữ nguyên tiến độ giữa các phiên."
                }
                backHref="/roadmap/my"
                backLabel="Quay lại danh sách roadmap AI"
                breadcrumbs={[
                    roadmapHomeBreadcrumb,
                    { label: "Lộ trình", href: "/roadmap" },
                    { label: "Roadmap AI", href: "/roadmap/my" },
                    { label: roadmap.roadmap_title },
                ]}
                stats={[
                    {
                        label: "hoàn thành",
                        value: String(progressStats.completed),
                        tone: "done",
                    },
                    {
                        label: "đang học",
                        value: String(progressStats.inProgress),
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
                    { label: "Danh sách AI", href: "/roadmap/my" },
                    { label: "Lộ trình AI", active: true },
                ]}
                statusBadge={
                    isTempRoadmap ? (
                        <span className="roadmap-pill roadmap-pill--warning">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Chưa lưu
                        </span>
                    ) : null
                }
                actions={
                    <Link href="/roadmap/generate" className="roadmap-button">
                        Tạo roadmap mới
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
                                {roadmap.roadmap_title}
                            </span>
                        </motion.div>
                    </div>

                    <div className="roadmap-vertical-tree__content">
                        {phases.length > 0 ? (
                            phases.map((phase, index) => (
                                <PhaseRow
                                    key={phase.id}
                                    node={phase}
                                    onNodeClick={handleNodeClick}
                                    onContextMenu={handleContextMenu}
                                    isFirst={index === 0}
                                    isLast={index === phases.length - 1}
                                />
                            ))
                        ) : (
                            <div className="roadmap-empty-state roadmap-surface">
                                <div className="roadmap-empty-state__title">
                                    Không có chủ đề phù hợp với từ khoá
                                </div>
                                <p className="roadmap-empty-state__body">
                                    Hãy đổi cụm tìm kiếm hoặc xoá ô tìm kiếm để
                                    xem lại toàn bộ roadmap AI.
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
                                label: "Giai đoạn",
                                modifier:
                                    "roadmap-tree__legend-color--topic",
                            },
                            {
                                label: "Chủ đề chi tiết",
                                modifier:
                                    "roadmap-tree__legend-color--subtopic",
                            },
                            {
                                label: "Tuỳ chọn / thay thế",
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
                    "Nhấp: mở chi tiết node",
                    "Nhấp phải: đổi trạng thái nhanh",
                    "Ctrl/Cmd + F: mở tìm kiếm",
                ]}
            />

            <AnimatePresence>
                {contextMenu ? (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        node={contextMenu.node}
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
                nodeStatus={selectedNode?.status || "pending"}
                onStatusChange={(status) =>
                    selectedNode &&
                    handleStatusChange(selectedNode.id, status as NodeStatus)
                }
                nodeId={selectedNode?.id || ""}
            />
        </div>
    );
}
