"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/app/roadmap-nodes.css';

import { 
  ArrowLeft, BookOpen, Grid3X3, List, Search, X, 
  CheckCircle, Eye, RotateCcw, Info,
  ZoomIn, ZoomOut, Maximize, ChevronRight, Home, MousePointer
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleRoadmapNode from './SimpleRoadmapNode';
import RoadmapDetailModal from './RoadmapDetailModal';

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
  status: 'available' | 'completed' | 'current' | 'locked' | 'done' | 'learning' | 'skipped';
  duration?: string;
  technologies?: string[];
  difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  children?: RoadmapNode[];
  collapsed?: boolean;
}

interface RoadmapFlowProps {
  roadmapId: string;
  roadmapTitle: string;
  roadmapData: RoadmapNode;
}

// Node types
const nodeTypes = {
  simpleRoadmapNode: SimpleRoadmapNode,
};

// Context Menu Component (roadmap.sh style)
const ContextMenu = ({
  x,
  y,
  nodeId,
  nodeTitle,
  nodeStatus,
  onClose,
  onStatusChange,
  onViewDetails,
}: {
  x: number;
  y: number;
  nodeId: string;
  nodeTitle: string;
  nodeStatus: string;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onViewDetails: () => void;
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleScroll = () => onClose();
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const isDone = nodeStatus === 'done' || nodeStatus === 'completed';
  const isLearning = nodeStatus === 'learning' || nodeStatus === 'current' || nodeStatus === 'in_progress';
  const isSkipped = nodeStatus === 'skipped';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ left: x, top: y }}
      className="roadmap-context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="roadmap-context-menu__header">
        {nodeTitle}
      </div>
      
      <div className="roadmap-context-menu__item" onClick={onViewDetails}>
        <Eye className="w-4 h-4" />
        <span>Xem chi tiết</span>
      </div>
      
      <div className="roadmap-context-menu__divider" />
      
      <div 
        className={`roadmap-context-menu__item ${isDone ? 'text-green-600' : ''}`}
        onClick={() => onStatusChange(isDone ? 'available' : 'done')}
      >
        <CheckCircle className="w-4 h-4" />
        <span>{isDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}</span>
      </div>
      
      <div 
        className={`roadmap-context-menu__item ${isLearning ? 'text-purple-600' : ''}`}
        onClick={() => onStatusChange(isLearning ? 'available' : 'learning')}
      >
        <BookOpen className="w-4 h-4" />
        <span>{isLearning ? 'Bỏ trạng thái đang học' : 'Đánh dấu đang học'}</span>
      </div>
      
      <div 
        className={`roadmap-context-menu__item ${isSkipped ? 'text-gray-600' : ''}`}
        onClick={() => onStatusChange(isSkipped ? 'available' : 'skipped')}
      >
        <X className="w-4 h-4" />
        <span>{isSkipped ? 'Bỏ trạng thái bỏ qua' : 'Đánh dấu bỏ qua'}</span>
      </div>
    </motion.div>
  );
};

// Instructions Panel
const InstructionsPanel = () => (
  <div className="roadmap-instructions">
    <div className="roadmap-instructions__title">
      <MousePointer className="w-4 h-4" />
      Hướng dẫn tương tác
    </div>
    <div className="roadmap-instructions__item">
      <span className="roadmap-instructions__key">Click</span>
      <span>Xem chi tiết</span>
    </div>
    <div className="roadmap-instructions__item">
      <span className="roadmap-instructions__key">Right-click</span>
      <span>Đánh dấu hoàn thành</span>
    </div>
    <div className="roadmap-instructions__item">
      <span className="roadmap-instructions__key">Shift + Click</span>
      <span>Đang học</span>
    </div>
    <div className="roadmap-instructions__item">
      <span className="roadmap-instructions__key">Alt + Click</span>
      <span>Bỏ qua</span>
    </div>
  </div>
);

// Inner component with access to React Flow hooks
function RoadmapFlowInner({ roadmapId, roadmapTitle, roadmapData }: RoadmapFlowProps) {
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showInstructions, setShowInstructions] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeTitle: string;
    nodeStatus: string;
  } | null>(null);
  
  const reactFlowInstance = useReactFlow();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Node status tracking (roadmap.sh style)
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, string>>(() => {
    const statusMap = new Map<string, string>();
    const collectStatus = (node: RoadmapNode) => {
      statusMap.set(node.id, node.status);
      if (node.children) {
        node.children.forEach(collectStatus);
      }
    };
    collectStatus(roadmapData);
    return statusMap;
  });

  // Collect all node IDs
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const collectIds = (node: RoadmapNode) => {
      ids.add(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };
    collectIds(roadmapData);
    return ids;
  }, [roadmapData]);

  // Initialize all nodes as expanded
  useEffect(() => {
    setExpandedNodes(new Set(allNodeIds));
  }, [allNodeIds]);

  // Calculate progress
  const progressStats = useMemo(() => {
    const total = allNodeIds.size;
    let done = 0;
    let learning = 0;
    let skipped = 0;
    
    nodeStatuses.forEach((status) => {
      if (status === 'done' || status === 'completed') done++;
      else if (status === 'learning' || status === 'current' || status === 'in_progress') learning++;
      else if (status === 'skipped') skipped++;
    });
    
    return {
      total,
      done,
      learning,
      skipped,
      percentage: total > 0 ? Math.round((done / total) * 100) : 0
    };
  }, [nodeStatuses, allNodeIds]);

  // Find node by ID
  const findNodeById = useCallback((node: RoadmapNode, id: string): RoadmapNode | null => {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Handle status change (roadmap.sh style)
  const handleStatusChange = useCallback((nodeId: string, newStatus: string) => {
    setNodeStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, newStatus);
      return newMap;
    });
    setContextMenu(null);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    const node = findNodeById(roadmapData, nodeId);
    if (node) {
      setSelectedNode(node);
      setIsModalOpen(true);
    }
  }, [roadmapData, findNodeById]);

  // Handle context menu
  const handleContextMenu = useCallback((nodeId: string, event: React.MouseEvent) => {
    const node = findNodeById(roadmapData, nodeId);
    if (node) {
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId,
        nodeTitle: node.title,
        nodeStatus: nodeStatuses.get(nodeId) || 'available',
      });
    }
  }, [roadmapData, findNodeById, nodeStatuses]);

  // Handle double click to expand/collapse
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const findAndCenterNode = (node: RoadmapNode): boolean => {
      if (node.title.toLowerCase().includes(query.toLowerCase())) {
        const flowNode = nodes.find(n => n.id === node.id);
        if (flowNode) {
          reactFlowInstance.setCenter(flowNode.position.x + 100, flowNode.position.y + 25, {
            zoom: 1.2,
            duration: 500,
          });
        }
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndCenterNode(child)) return true;
        }
      }
      return false;
    };

    findAndCenterNode(roadmapData);
  }, [roadmapData, reactFlowInstance]);

  // Reset view
  const handleResetView = useCallback(() => {
    reactFlowInstance.fitView({
      padding: 0.2,
      duration: 500,
    });
  }, [reactFlowInstance]);

  // Convert roadmap data to React Flow format - VERTICAL DEPTH LAYOUT
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Layout constants for vertical depth display
    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 40;
    const HORIZONTAL_GAP = 40;
    const VERTICAL_GAP = 80;
    const ROOT_X = 400;
    const ROOT_Y = 50;

    /**
     * Calculate the width needed for a subtree
     */
    const getSubtreeWidth = (node: RoadmapNode): number => {
      if (!node.children || node.children.length === 0 || !expandedNodes.has(node.id)) {
        return NODE_WIDTH;
      }

      const childrenWidth = node.children.reduce((acc, child) => {
        return acc + getSubtreeWidth(child);
      }, 0);

      const gapsWidth = (node.children.length - 1) * HORIZONTAL_GAP;
      return Math.max(NODE_WIDTH, childrenWidth + gapsWidth);
    };

    /**
     * Process nodes recursively for vertical depth layout
     */
    const processNode = (
      node: RoadmapNode,
      x: number,
      y: number,
      parentId?: string
    ): void => {
      // Skip if parent is collapsed
      if (parentId && !expandedNodes.has(parentId)) {
        return;
      }

      const currentStatus = nodeStatuses.get(node.id) || node.status;

      // Add the node
      nodes.push({
        id: node.id,
        type: 'simpleRoadmapNode',
        position: { x, y },
        data: {
          id: node.id,
          title: node.title,
          description: node.description,
          type: node.type,
          status: currentStatus,
          duration: node.duration,
          technologies: node.technologies,
          showCheckbox: true,
          onClick: handleNodeClick,
          onDoubleClick: handleNodeDoubleClick,
          onContextMenu: handleContextMenu,
          onStatusChange: handleStatusChange,
        },
      });

      // Add edge from parent
      if (parentId && expandedNodes.has(parentId)) {
        const isAnimated = currentStatus === 'learning' || currentStatus === 'current' || currentStatus === 'in_progress';
        edges.push({
          id: `edge-${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          style: {
            stroke: isAnimated ? '#7c3aed' : '#9ca3af',
            strokeWidth: 2,
          },
          animated: isAnimated,
        });
      }

      // Process children if expanded
      if (node.children && node.children.length > 0 && expandedNodes.has(node.id)) {
        const subtreeWidth = getSubtreeWidth(node);
        let currentX = x - subtreeWidth / 2 + NODE_WIDTH / 2;

        node.children.forEach((child) => {
          const childSubtreeWidth = getSubtreeWidth(child);
          const childX = currentX + childSubtreeWidth / 2 - NODE_WIDTH / 2;
          const childY = y + NODE_HEIGHT + VERTICAL_GAP;

          processNode(child, childX, childY, node.id);

          currentX += childSubtreeWidth + HORIZONTAL_GAP;
        });
      }
    };

    // Start processing from root
    processNode(roadmapData, ROOT_X, ROOT_Y);

    return { nodes, edges };
  }, [roadmapData, expandedNodes, nodeStatuses, handleNodeClick, handleNodeDoubleClick, handleContextMenu, handleStatusChange]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when layout or status changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setContextMenu(null);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hide instructions after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="roadmap-header"
      >
        <div className="roadmap-header__content">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/roadmap" className="hover:text-blue-600 transition-colors">
              Lộ trình
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{roadmapTitle}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/roadmap" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Quay lại</span>
              </Link>
              <div className="self-stretch w-px bg-gray-200"></div>
              <div>
                <h2 className="roadmap-header__title">{roadmapTitle}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{progressStats.total} kỹ năng</span>
                  <span>•</span>
                  <span className="text-green-600">{progressStats.done} hoàn thành</span>
                  <span>•</span>
                  <span className="text-purple-600">{progressStats.learning} đang học</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Box */}
              <div className="roadmap-search">
                <Search className="w-4 h-4 roadmap-search__icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm (Ctrl+F)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="roadmap-search__input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className={`p-2 rounded-lg transition-colors ${showInstructions ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Hướng dẫn"
              >
                <Info className="w-4 h-4" />
              </button>

              <Link href={`/roadmap/${roadmapId}`}>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Xem khóa học</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="roadmap-header__progress mt-4">
            <div className="roadmap-header__progress-bar">
              <div 
                className="roadmap-header__progress-fill"
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
            <div className="roadmap-header__progress-text">{progressStats.percentage}%</div>
          </div>
        </div>
      </motion.div>

      {/* React Flow Container - Full height scrollable */}
      <div className="h-[calc(100vh-160px)] roadmap-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            includeHiddenNodes: false,
            minZoom: 0.4,
            maxZoom: 1.5,
            duration: 300,
          }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.2}
          maxZoom={2}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          panOnScroll={true}
          panOnDrag={true}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          selectNodesOnDrag={false}
        >
          <Controls 
            className="!bg-white !border-gray-200 !shadow-md !rounded-lg"
            showInteractive={false}
          />

          <MiniMap
            className="!bg-white !border !border-gray-200 !rounded-xl !shadow-lg"
            nodeColor={(node) => {
              const status = node.data?.status;
              if (status === 'done' || status === 'completed') return '#22c55e';
              if (status === 'learning' || status === 'current' || status === 'in_progress') return '#7c3aed';
              if (status === 'skipped') return '#64748b';
              
              switch (node.data?.type) {
                case 'core': return '#ffff00';
                case 'optional': return '#ffe599';
                case 'beginner': return '#d4edda';
                case 'alternative': return '#f8f9fa';
                case 'project': return '#fff3cd';
                default: return '#ffffff';
              }
            }}
            maskColor="rgba(255, 255, 255, 0.85)"
            maskStrokeColor="#e5e7eb"
            maskStrokeWidth={2}
            pannable={true}
            zoomable={true}
          />

          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#e5e7eb"
          />

          {/* Legend Panel */}
          <Panel position="top-right" className="m-4">
            <div className="roadmap-legend">
              <h3 className="roadmap-legend__title">Chú giải</h3>

              <div className="roadmap-legend__section">
                <h4 className="roadmap-legend__section-title">Loại nội dung</h4>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--topic"></div>
                  <span className="roadmap-legend__label">Cốt lõi (Topic)</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--subtopic"></div>
                  <span className="roadmap-legend__label">Tùy chọn (Subtopic)</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--beginner"></div>
                  <span className="roadmap-legend__label">Cơ bản</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--alternative"></div>
                  <span className="roadmap-legend__label">Thay thế</span>
                </div>
              </div>

              <div className="roadmap-legend__section pt-3 border-t border-gray-100">
                <h4 className="roadmap-legend__section-title">Trạng thái</h4>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--done"></div>
                  <span className="roadmap-legend__label">Đã hoàn thành</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--learning"></div>
                  <span className="roadmap-legend__label">Đang học</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--skipped"></div>
                  <span className="roadmap-legend__label">Bỏ qua</span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Instructions Panel */}
          <AnimatePresence>
            {showInstructions && (
              <Panel position="bottom-right" className="m-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <InstructionsPanel />
                </motion.div>
              </Panel>
            )}
          </AnimatePresence>

          {/* Reset View Button */}
          <Panel position="bottom-left" className="m-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={handleResetView}
                className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                title="Reset view"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            nodeTitle={contextMenu.nodeTitle}
            nodeStatus={contextMenu.nodeStatus}
            onClose={() => setContextMenu(null)}
            onStatusChange={(status) => handleStatusChange(contextMenu.nodeId, status)}
            onViewDetails={() => {
              handleNodeClick(contextMenu.nodeId);
              setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <RoadmapDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeData={selectedNode}
        isCompleted={selectedNode ? (nodeStatuses.get(selectedNode.id) === 'done' || nodeStatuses.get(selectedNode.id) === 'completed') : false}
        onToggleComplete={(nodeId, checked) => handleStatusChange(nodeId, checked ? 'done' : 'available')}
      />
    </div>
  );
}

// Wrapper with ReactFlowProvider
export default function RoadmapFlow(props: RoadmapFlowProps) {
  return (
    <ReactFlowProvider>
      <RoadmapFlowInner {...props} />
    </ReactFlowProvider>
  );
}
