"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Search, X, CheckCircle, Eye,
  Home, ChevronRight, Clock, Code, Sparkles, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import NodeDetailSidebar from '../NodeDetailSidebar';
import type { 
  AIGeneratedRoadmap, 
  RoadmapNode, 
  NodeStatus, 
  RoadmapPhase 
} from '@/types/ai-roadmap';
import '@/app/roadmap-tree.css';

// ========== TYPES ==========
interface TreeNode {
  id: string;
  title: string;
  description: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
  status: NodeStatus;
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

// ========== HELPER: Convert AI Roadmap to Tree ==========
function convertToTree(
  roadmap: AIGeneratedRoadmap, 
  progress: Record<string, NodeStatus>
): TreeNode {
  const phases = roadmap.phases || [];
  const nodes = roadmap.nodes || [];
  const edges = roadmap.edges || [];

  // Group nodes by phase
  const nodesByPhase: Record<string, RoadmapNode[]> = {};
  nodes.forEach(node => {
    const phaseId = node.phase_id || node.section_id || 'default';
    if (!nodesByPhase[phaseId]) {
      nodesByPhase[phaseId] = [];
    }
    nodesByPhase[phaseId].push(node);
  });

  // Build edge map for dependencies
  const edgeMap: Record<string, string[]> = {};
  edges.forEach(edge => {
    if (!edgeMap[edge.source]) {
      edgeMap[edge.source] = [];
    }
    edgeMap[edge.source].push(edge.target);
  });

  // Convert node to tree node
  const convertNode = (node: RoadmapNode): TreeNode => {
    const status = progress[node.id] || 'pending';
    return {
      id: node.id,
      title: node.data.label,
      description: node.data.description,
      type: node.type as TreeNode['type'] || 'core',
      status,
      duration: `${node.data.estimated_hours}h`,
      difficulty: node.data.difficulty,
      technologies: node.data.learning_resources?.keywords,
    };
  };

  // Create phase nodes as top-level children
  const phaseNodes: TreeNode[] = phases.map(phase => {
    const phaseNodeList = nodesByPhase[phase.id] || [];
    
    // Find all nodes in this phase
    const phaseNodesMap = new Map<string, RoadmapNode>();
    phaseNodeList.forEach(n => phaseNodesMap.set(n.id, n));
    
    // Find root nodes in this phase
    const targetIdsInPhase = new Set(
      edges
        .filter(e => phaseNodesMap.has(e.source) && phaseNodesMap.has(e.target))
        .map(e => e.target)
    );
    
    const rootNodesInPhase = phaseNodeList.filter(n => !targetIdsInPhase.has(n.id));
    
    const buildSubtree = (node: RoadmapNode, visited: Set<string>): TreeNode => {
      if (visited.has(node.id)) {
        return convertNode(node);
      }
      visited.add(node.id);
      
      const childIds = edgeMap[node.id] || [];
      const children = childIds
        .map(id => nodes.find(n => n.id === id))
        .filter((n): n is RoadmapNode => n !== undefined && phaseNodesMap.has(n.id))
        .map(n => buildSubtree(n, visited));
      
      return {
        ...convertNode(node),
        children: children.length > 0 ? children : undefined,
      };
    };

    const phaseChildren = rootNodesInPhase.map(n => buildSubtree(n, new Set()));
    
    return {
      id: phase.id,
      title: phase.name,
      description: `Giai đoạn ${phase.order}`,
      type: 'core',
      status: progress[phase.id] || 'pending',
      children: phaseChildren.length > 0 ? phaseChildren : undefined,
    };
  });

  return {
    id: 'root',
    title: roadmap.roadmap_title,
    description: roadmap.roadmap_description,
    type: 'core',
    status: 'pending',
    duration: `${roadmap.total_estimated_hours}h tổng`,
    children: phaseNodes.length > 0 ? phaseNodes : undefined,
  };
}

// ========== CONTEXT MENU ==========
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
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const isDone = node.status === 'completed';
  const isLearning = node.status === 'in_progress';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -5 }}
      style={{ left: Math.min(x, window.innerWidth - 220), top: Math.min(y, window.innerHeight - 280) }}
      className="roadmap-tree__context-menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="roadmap-tree__context-menu-header">{node.title}</div>
      
      <div className="roadmap-tree__context-menu-item" onClick={onViewDetails}>
        <Eye className="w-4 h-4" />
        <span>Xem chi tiết</span>
      </div>
      
      <div className="roadmap-tree__context-menu-divider" />
      
      <div
        className={`roadmap-tree__context-menu-item ${isDone ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isDone ? 'pending' : 'completed')}
      >
        <CheckCircle className="w-4 h-4" />
        <span>{isDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}</span>
      </div>
      
      <div
        className={`roadmap-tree__context-menu-item ${isLearning ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isLearning ? 'pending' : 'in_progress')}
      >
        <BookOpen className="w-4 h-4" />
        <span>{isLearning ? 'Bỏ trạng thái đang học' : 'Đánh dấu đang học'}</span>
      </div>
    </motion.div>
  );
};

// ========== DETAIL MODAL ==========
const DetailModal: React.FC<{
  node: TreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (completed: boolean) => void;
}> = ({ node, isOpen, onClose, onToggleComplete }) => {
  if (!node || !isOpen) return null;

  const isCompleted = node.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="roadmap-tree__modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="roadmap-tree__modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="roadmap-tree__modal-header">
          <h2 className="roadmap-tree__modal-title">{node.title}</h2>
        </div>
        
        <div className="roadmap-tree__modal-body">
          {node.description && (
            <p className="roadmap-tree__modal-description">{node.description}</p>
          )}
          
          <div className="roadmap-tree__modal-meta">
            {node.duration && (
              <div className="roadmap-tree__modal-meta-item">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{node.duration}</span>
              </div>
            )}
            {node.difficulty && (
              <div className="roadmap-tree__modal-meta-item">
                <Code className="w-4 h-4 text-gray-400" />
                <span>{node.difficulty}</span>
              </div>
            )}
          </div>
          
          {node.technologies && node.technologies.length > 0 && (
            <div className="roadmap-tree__modal-techs">
              {node.technologies.map((tech, idx) => (
                <span key={idx} className="roadmap-tree__modal-tech">{tech}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="roadmap-tree__modal-footer">
          <button className="roadmap-tree__modal-btn roadmap-tree__modal-btn--secondary" onClick={onClose}>
            Đóng
          </button>
          <button
            className="roadmap-tree__modal-btn roadmap-tree__modal-btn--primary"
            onClick={() => onToggleComplete(!isCompleted)}
          >
            {isCompleted ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ========== LEGEND ==========
const Legend: React.FC = () => (
  <div className="roadmap-tree__legend">
    <h3 className="roadmap-tree__legend-title">Chú giải</h3>
    
    <div className="roadmap-tree__legend-section">
      <h4 className="roadmap-tree__legend-section-title">Loại nội dung</h4>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--topic"></div>
        <span className="roadmap-tree__legend-label">Bắt buộc</span>
      </div>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--subtopic"></div>
        <span className="roadmap-tree__legend-label">Tùy chọn</span>
      </div>
    </div>
    
    <div className="roadmap-tree__legend-section" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
      <h4 className="roadmap-tree__legend-section-title">Trạng thái</h4>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--done"></div>
        <span className="roadmap-tree__legend-label">Đã hoàn thành</span>
      </div>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--learning"></div>
        <span className="roadmap-tree__legend-label">Đang học</span>
      </div>
    </div>
  </div>
);

// ========== SUB-TOPIC NODE ==========
const SubTopicNode: React.FC<{
  node: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onContextMenu: (node: TreeNode, e: React.MouseEvent) => void;
  position: 'left' | 'right';
}> = ({ node, onNodeClick, onContextMenu, position }) => {
  const isDone = node.status === 'completed';
  const isLearning = node.status === 'in_progress';
  
  const getNodeClasses = () => {
    const classes = ['roadmap-subtopic-node', `roadmap-subtopic-node--${node.type || 'core'}`];
    if (isDone) classes.push('roadmap-subtopic-node--done');
    if (isLearning) classes.push('roadmap-subtopic-node--learning');
    return classes.join(' ');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(node, e);
  };

  return (
    <div className={`roadmap-subtopic ${position === 'left' ? 'roadmap-subtopic--left' : 'roadmap-subtopic--right'}`}>
      <div className="roadmap-subtopic__connector"></div>
      <motion.div
        className={getNodeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="roadmap-subtopic-node__title">{node.title}</span>
        {isDone && (
          <CheckCircle className="roadmap-subtopic-node__check" />
        )}
      </motion.div>
    </div>
  );
};

// ========== PHASE ROW ==========
const PhaseRow: React.FC<{
  node: TreeNode;
  onNodeClick: (node: TreeNode) => void;
  onContextMenu: (node: TreeNode, e: React.MouseEvent) => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ node, onNodeClick, onContextMenu, isFirst, isLast }) => {
  const isDone = node.status === 'completed';
  const isLearning = node.status === 'in_progress';
  const hasChildren = node.children && node.children.length > 0;
  const [isExpanded, setIsExpanded] = useState(true);
  
  const subNodes = useMemo(() => {
    const flattened: TreeNode[] = [];
    const collect = (n: TreeNode) => {
      if (n.id !== node.id) flattened.push(n);
      if (n.children) n.children.forEach(collect);
    };
    if (node.children) node.children.forEach(collect);
    return flattened;
  }, [node]);

  const leftChildren = useMemo(() => subNodes.filter((_, i) => i % 2 === 0), [subNodes]);
  const rightChildren = useMemo(() => subNodes.filter((_, i) => i % 2 === 1), [subNodes]);

  const getNodeClasses = () => {
    const classes = ['roadmap-main-node', `roadmap-main-node--${node.type || 'core'}`];
    if (isDone) classes.push('roadmap-main-node--done');
    if (isLearning) classes.push('roadmap-main-node--learning');
    return classes.join(' ');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNodeClick(node);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(node, e);
  };

  return (
    <div className="roadmap-row">
      {!isFirst && <div className="roadmap-row__connector-top"></div>}
      {!isLast && <div className="roadmap-row__connector-bottom"></div>}
      
      <div className="roadmap-row__left">
        <AnimatePresence>
          {isExpanded && leftChildren.map((child, idx) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <SubTopicNode
                node={child}
                onNodeClick={onNodeClick}
                onContextMenu={onContextMenu}
                position="left"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="roadmap-row__center">
        <motion.div
          className={getNodeClasses()}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="roadmap-main-node__title">{node.title}</span>
          
          {isDone && (
            <div className="roadmap-main-node__badge roadmap-main-node__badge--done">
              <CheckCircle className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          )}
          
          {isLearning && (
            <div className="roadmap-main-node__badge roadmap-main-node__badge--learning">
              <Sparkles className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          )}
          
          {hasChildren && (
            <button 
              className="roadmap-main-node__toggle"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </motion.div>
      </div>
      
      <div className="roadmap-row__right">
        <AnimatePresence>
          {isExpanded && rightChildren.map((child, idx) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.05 }}
            >
              <SubTopicNode
                node={child}
                onNodeClick={onNodeClick}
                onContextMenu={onContextMenu}
                position="right"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export default function AIRoadmapTreeView({
  roadmap,
  roadmapId,
  initialProgress = {},
  onProgressUpdate,
  isTempRoadmap = false,
}: AIRoadmapTreeViewProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState<Record<string, NodeStatus>>(initialProgress);
  const searchRef = useRef<HTMLInputElement>(null);

  const treeData = useMemo(() => convertToTree(roadmap, progress), [roadmap, progress]);
  const phases = useMemo(() => treeData.children || [], [treeData]);

  const progressStats = useMemo(() => {
    const total = roadmap.nodes?.length || 0;
    let completed = 0;
    let inProgress = 0;

    Object.entries(progress).forEach(([, status]) => {
      if (status === 'completed') completed++;
      else if (status === 'in_progress') inProgress++;
    });

    return {
      total,
      completed,
      inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [progress, roadmap.nodes]);

  const handleStatusChange = useCallback((nodeId: string, newStatus: NodeStatus) => {
    setProgress(prev => ({ ...prev, [nodeId]: newStatus }));
    onProgressUpdate?.(nodeId, newStatus);
    setContextMenu(null);
  }, [onProgressUpdate]);

  const handleNodeClick = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  }, []);

  const handleContextMenu = useCallback((node: TreeNode, e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
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

  return (
    <div className="roadmap-tree-page">
      <div className="roadmap-tree-header">
        <div className="roadmap-tree-header__inner">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/roadmap/my" className="hover:text-indigo-600 transition-colors">
              Lộ trình AI
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{roadmap.roadmap_title}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/roadmap/my" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Quay lại</span>
              </Link>
              <div className="self-stretch w-px bg-gray-200"></div>
              <div>
                <h2 className="roadmap-tree-header__title">{roadmap.roadmap_title}</h2>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                  <span>{progressStats.total} topics</span>
                  <span>•</span>
                  <span className="text-green-600 font-medium">{progressStats.completed} hoàn thành</span>
                  <span>•</span>
                  <span className="text-purple-600 font-medium">{progressStats.inProgress} đang học</span>
                  {isTempRoadmap && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa lưu
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Tìm kiếm (Ctrl+F)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60 pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="roadmap-tree-header__progress">
            <div className="roadmap-tree-header__progress-bar">
              <motion.div
                className="roadmap-tree-header__progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressStats.percentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="roadmap-tree-header__progress-text">{progressStats.percentage}%</div>
          </div>
        </div>
      </div>

      <div className="roadmap-vertical-tree">
        <div className="roadmap-vertical-tree__container">
          <div className="roadmap-vertical-tree__root">
            <motion.div
              className="roadmap-root-node"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="roadmap-root-node__title">{roadmap.roadmap_title}</span>
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
              <div className="text-center py-20 text-gray-500">
                <p>Không có dữ liệu lộ trình</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Legend />

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            node={contextMenu.node}
            onClose={() => setContextMenu(null)}
            onStatusChange={(status) => handleStatusChange(contextMenu.node.id, status)}
            onViewDetails={() => {
              handleNodeClick(contextMenu.node);
              setContextMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Node Detail Sidebar */}
      <NodeDetailSidebar
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeTitle={selectedNode?.title || ''}
        nodeDescription={selectedNode?.description}
        nodeStatus={selectedNode?.status || 'pending'}
        onStatusChange={(status) => selectedNode && handleStatusChange(selectedNode.id, status as NodeStatus)}
        nodeId={selectedNode?.id || ''}
      />
    </div>
  );
}
