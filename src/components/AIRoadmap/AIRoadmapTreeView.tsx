"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Search, X, CheckCircle, Eye,
  Home, ChevronRight, Clock, Code, ExternalLink, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
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
      type: node.type as TreeNode['type'],
      status,
      duration: `${node.data.estimated_hours}h`,
      difficulty: node.data.difficulty,
      technologies: node.data.learning_resources?.keywords,
    };
  };

  // Create phase nodes as top-level children
  const phaseNodes: TreeNode[] = phases.map(phase => {
    const phaseNodeList = nodesByPhase[phase.id] || [];
    
    // Find root nodes in this phase (nodes with no incoming edges from same phase)
    const targetIds = new Set(edges.filter(e => 
      phaseNodeList.some(n => n.id === e.source)
    ).map(e => e.target));
    
    const rootNodes = phaseNodeList.filter(n => !targetIds.has(n.id));
    
    // Build tree for each root node
    const buildSubtree = (node: RoadmapNode, visited: Set<string>): TreeNode => {
      if (visited.has(node.id)) {
        return convertNode(node);
      }
      visited.add(node.id);
      
      const childIds = edgeMap[node.id] || [];
      const children = childIds
        .map(id => nodes.find(n => n.id === id))
        .filter((n): n is RoadmapNode => n !== undefined)
        .map(n => buildSubtree(n, visited));
      
      return {
        ...convertNode(node),
        children: children.length > 0 ? children : undefined,
      };
    };

    const phaseChildren = rootNodes.map(n => buildSubtree(n, new Set()));
    
    return {
      id: phase.id,
      title: phase.name,
      description: `Giai đoạn ${phase.order}`,
      type: 'core',
      status: 'pending',
      children: phaseChildren.length > 0 ? phaseChildren : undefined,
    };
  });

  // Root node
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

  const isCompleted = node.status === 'completed';
  const isInProgress = node.status === 'in_progress';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ left: x, top: y }}
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
        className={`roadmap-tree__context-menu-item ${isCompleted ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isCompleted ? 'pending' : 'completed')}
      >
        <CheckCircle className="w-4 h-4" />
        <span>{isCompleted ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}</span>
      </div>
      
      <div
        className={`roadmap-tree__context-menu-item ${isInProgress ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isInProgress ? 'pending' : 'in_progress')}
      >
        <BookOpen className="w-4 h-4" />
        <span>{isInProgress ? 'Bỏ trạng thái đang học' : 'Đánh dấu đang học'}</span>
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
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--alternative"></div>
        <span className="roadmap-tree__legend-label">Thay thế</span>
      </div>
    </div>
    
    <div className="roadmap-tree__legend-section" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
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

// ========== TREE NODE COMPONENT ==========
const TreeNode: React.FC<{
  node: TreeNode;
  progress: Record<string, NodeStatus>;
  onNodeClick: (node: TreeNode) => void;
  onContextMenu: (node: TreeNode, e: React.MouseEvent) => void;
  onStatusChange: (nodeId: string, status: NodeStatus) => void;
  level: number;
}> = ({ node, progress, onNodeClick, onContextMenu, onStatusChange, level }) => {
  const status = progress[node.id] || node.status;
  const hasChildren = node.children && node.children.length > 0;

  // Map AI status to CSS classes
  const getStatusClass = () => {
    switch (status) {
      case 'completed': return 'roadmap-tree__node-box--done';
      case 'in_progress': return 'roadmap-tree__node-box--learning';
      default: return '';
    }
  };

  const getNodeClasses = () => {
    const classes = ['roadmap-tree__node-box', `roadmap-tree__node-box--${node.type}`];
    const statusClass = getStatusClass();
    if (statusClass) classes.push(statusClass);
    return classes.join(' ');
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const newStatus = status === 'in_progress' ? 'pending' : 'in_progress';
      onStatusChange(node.id, newStatus);
    } else if (e.altKey) {
      const newStatus = status === 'completed' ? 'pending' : 'completed';
      onStatusChange(node.id, newStatus);
    } else {
      onNodeClick(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node, e);
  };

  const isCompleted = status === 'completed';

  return (
    <div className="roadmap-tree__node">
      <div
        className={getNodeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="roadmap-tree__node-title">{node.title}</span>
        
        {isCompleted && (
          <div className="roadmap-tree__status-badge roadmap-tree__status-badge--done">
            <CheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="roadmap-tree__children">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              progress={progress}
              onNodeClick={onNodeClick}
              onContextMenu={onContextMenu}
              onStatusChange={onStatusChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
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

  // Convert flat structure to tree
  const treeData = useMemo(() => convertToTree(roadmap, progress), [roadmap, progress]);

  // Count all nodes for progress
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const collect = (node: TreeNode) => {
      if (node.id !== 'root') ids.add(node.id);
      if (node.children) node.children.forEach(collect);
    };
    collect(treeData);
    return ids;
  }, [treeData]);

  // Calculate progress
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

  // Status change handler
  const handleStatusChange = useCallback((nodeId: string, newStatus: NodeStatus) => {
    setProgress(prev => ({ ...prev, [nodeId]: newStatus }));
    onProgressUpdate?.(nodeId, newStatus);
    setContextMenu(null);
  }, [onProgressUpdate]);

  // Node click handler
  const handleNodeClick = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback((node: TreeNode, e: React.MouseEvent) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  // Keyboard shortcuts
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="roadmap-tree-header">
        <div className="roadmap-tree-header__inner">
          {/* Breadcrumb */}
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
                  <span className="text-green-600">{progressStats.completed} hoàn thành</span>
                  <span>•</span>
                  <span className="text-purple-600">{progressStats.inProgress} đang học</span>
                  {isTempRoadmap && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Chưa lưu
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Tìm kiếm (Ctrl+F)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
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
            </div>
          </div>

          {/* Progress Bar */}
          <div className="roadmap-tree-header__progress mt-4">
            <div className="roadmap-tree-header__progress-bar">
              <div
                className="roadmap-tree-header__progress-fill"
                style={{ width: `${progressStats.percentage}%` }}
              />
            </div>
            <div className="roadmap-tree-header__progress-text">{progressStats.percentage}%</div>
          </div>
        </div>
      </div>

      {/* Tree Content */}
      <div className="roadmap-tree">
        <div className="roadmap-tree-container">
          <div className="roadmap-tree__content">
            {treeData.children && treeData.children.length > 0 ? (
              treeData.children.map((phase) => (
                <TreeNode
                  key={phase.id}
                  node={phase}
                  progress={progress}
                  onNodeClick={handleNodeClick}
                  onContextMenu={handleContextMenu}
                  onStatusChange={handleStatusChange}
                  level={0}
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

      {/* Legend */}
      <Legend />

      {/* Context Menu */}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedNode && (
          <DetailModal
            node={selectedNode}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onToggleComplete={(completed) => 
              handleStatusChange(selectedNode.id, completed ? 'completed' : 'pending')
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
