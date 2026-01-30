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
  ArrowLeft, BookOpen, Search, X, 
  CheckCircle, Eye, RotateCcw, Info,
  ChevronRight, Home, MousePointer
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

// Layout constants - Optimized for roadmap.sh style
const LAYOUT = {
  NODE_WIDTH: 200,      // Fixed node width
  NODE_HEIGHT: 44,      // Fixed node height
  HORIZONTAL_GAP: 20,   // Gap between sibling nodes
  VERTICAL_GAP: 60,     // Gap between levels
  CONTAINER_WIDTH: 900, // Max container width (like roadmap.sh)
  PADDING: 40,          // Container padding
};

// Context Menu Component
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
      <div className="roadmap-context-menu__header">{nodeTitle}</div>
      
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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Node status tracking
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

  // Handle status change
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
        if (flowNode && reactFlowInstance) {
          reactFlowInstance.setCenter(
            flowNode.position.x + LAYOUT.NODE_WIDTH / 2, 
            flowNode.position.y + LAYOUT.NODE_HEIGHT / 2, 
            { zoom: 1, duration: 500 }
          );
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
    if (reactFlowInstance) {
      reactFlowInstance.fitView({
        padding: 0.1,
        duration: 500,
      });
    }
  }, [reactFlowInstance]);

  /**
   * Top-Down Vertical Tree Layout Algorithm
   * Creates a compact vertical tree that fits within CONTAINER_WIDTH
   */
  const { nodes: initialNodes, edges: initialEdges, totalHeight } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Center X position
    const centerX = LAYOUT.CONTAINER_WIDTH / 2;
    
    /**
     * Calculate subtree width (how much horizontal space a node and its children need)
     */
    const getSubtreeWidth = (node: RoadmapNode): number => {
      if (!node.children || node.children.length === 0 || !expandedNodes.has(node.id)) {
        return LAYOUT.NODE_WIDTH;
      }
      
      const childrenWidths = node.children.map(child => getSubtreeWidth(child));
      const totalChildrenWidth = childrenWidths.reduce((sum, w) => sum + w, 0);
      const totalGaps = (node.children.length - 1) * LAYOUT.HORIZONTAL_GAP;
      
      return Math.max(LAYOUT.NODE_WIDTH, totalChildrenWidth + totalGaps);
    };
    
    /**
     * Calculate the depth of the tree
     */
    const getTreeDepth = (node: RoadmapNode, depth: number = 0): number => {
      if (!node.children || node.children.length === 0 || !expandedNodes.has(node.id)) {
        return depth;
      }
      
      let maxChildDepth = depth;
      for (const child of node.children) {
        const childDepth = getTreeDepth(child, depth + 1);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
      }
      return maxChildDepth;
    };
    
    let maxY = 0;
    
    /**
     * Process node and its children recursively
     */
    const processNode = (
      node: RoadmapNode,
      x: number,
      y: number,
      parentId?: string,
      availableWidth?: number
    ): void => {
      // Skip if parent is collapsed
      if (parentId && !expandedNodes.has(parentId)) {
        return;
      }

      const currentStatus = nodeStatuses.get(node.id) || node.status;
      
      // Center the node at x position
      const nodeX = x - LAYOUT.NODE_WIDTH / 2;
      
      // Add the node
      nodes.push({
        id: node.id,
        type: 'simpleRoadmapNode',
        position: { x: nodeX, y },
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

      maxY = Math.max(maxY, y + LAYOUT.NODE_HEIGHT);

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

      // Process children
      if (node.children && node.children.length > 0 && expandedNodes.has(node.id)) {
        const childY = y + LAYOUT.NODE_HEIGHT + LAYOUT.VERTICAL_GAP;
        
        // Calculate total width needed for all children
        const childWidths = node.children.map(child => getSubtreeWidth(child));
        const totalChildrenWidth = childWidths.reduce((sum, w) => sum + w, 0);
        const totalGaps = (node.children.length - 1) * LAYOUT.HORIZONTAL_GAP;
        const totalWidth = totalChildrenWidth + totalGaps;
        
        // Start position for first child (centered under parent)
        let childX = x - totalWidth / 2;
        
        node.children.forEach((child, index) => {
          const childWidth = childWidths[index];
          const childCenterX = childX + childWidth / 2;
          
          processNode(child, childCenterX, childY, node.id, childWidth);
          
          childX += childWidth + LAYOUT.HORIZONTAL_GAP;
        });
      }
    };

    // Start from root at center top
    const startY = LAYOUT.PADDING;
    processNode(roadmapData, centerX, startY);

    return { 
      nodes, 
      edges,
      totalHeight: maxY + LAYOUT.PADDING * 2
    };
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

  // Set initial view to fit content at zoom 1
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Small delay to ensure nodes are rendered
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.05,
          minZoom: 1,
          maxZoom: 1,
          duration: 0,
        });
      }, 100);
    }
  }, [reactFlowInstance, nodes.length]);

  return (
    <div className="min-h-screen bg-white">
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

      {/* Roadmap Container - Scrollable with max-width */}
      <div 
        ref={containerRef}
        className="roadmap-scroll-container"
        style={{
          height: 'calc(100vh - 160px)',
          overflow: 'auto',
          background: '#fafafa',
        }}
      >
        <div 
          className="roadmap-flow-wrapper"
          style={{
            width: '100%',
            minHeight: Math.max(totalHeight, 600),
            position: 'relative',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView={false}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.5}
            maxZoom={1.5}
            zoomOnScroll={false}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            panOnDrag={true}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            selectNodesOnDrag={false}
            translateExtent={[
              [-100, -50],
              [LAYOUT.CONTAINER_WIDTH + 100, totalHeight + 100]
            ]}
            style={{
              width: '100%',
              height: Math.max(totalHeight, 600),
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />

            {/* Legend Panel - Fixed position */}
            <Panel position="top-right" className="m-4">
              <div className="roadmap-legend">
                <h3 className="roadmap-legend__title">Chú giải</h3>

                <div className="roadmap-legend__section">
                  <h4 className="roadmap-legend__section-title">Loại nội dung</h4>
                  <div className="roadmap-legend__item">
                    <div className="roadmap-legend__color roadmap-legend__color--topic"></div>
                    <span className="roadmap-legend__label">Chủ đề chính</span>
                  </div>
                  <div className="roadmap-legend__item">
                    <div className="roadmap-legend__color roadmap-legend__color--subtopic"></div>
                    <span className="roadmap-legend__label">Chủ đề phụ</span>
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

            {/* Controls */}
            <Panel position="bottom-left" className="m-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResetView}
                  className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                  title="Fit to view"
                >
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>
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
