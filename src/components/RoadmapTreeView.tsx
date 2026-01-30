"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Search, X, CheckCircle, Eye,
  RotateCcw, Home, ChevronRight, Clock, Code
} from 'lucide-react';
import Link from 'next/link';
import '@/app/roadmap-tree.css';

// ========== TYPES ==========
export interface RoadmapNodeData {
  id: string;
  title: string;
  description: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
  status: 'available' | 'completed' | 'current' | 'locked' | 'done' | 'learning' | 'skipped';
  duration?: string;
  technologies?: string[];
  difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  children?: RoadmapNodeData[];
}

interface RoadmapTreeViewProps {
  roadmapId: string;
  roadmapTitle: string;
  roadmapData: RoadmapNodeData;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: RoadmapNodeData;
}

// ========== CONTEXT MENU ==========
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
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const isDone = status === 'done' || status === 'completed';
  const isLearning = status === 'learning' || status === 'current';
  const isSkipped = status === 'skipped';

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
        className={`roadmap-tree__context-menu-item ${isDone ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isDone ? 'available' : 'done')}
      >
        <CheckCircle className="w-4 h-4" />
        <span>{isDone ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'}</span>
      </div>
      
      <div
        className={`roadmap-tree__context-menu-item ${isLearning ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isLearning ? 'available' : 'learning')}
      >
        <BookOpen className="w-4 h-4" />
        <span>{isLearning ? 'Bỏ trạng thái đang học' : 'Đánh dấu đang học'}</span>
      </div>
      
      <div
        className={`roadmap-tree__context-menu-item ${isSkipped ? 'roadmap-tree__context-menu-item--active' : ''}`}
        onClick={() => onStatusChange(isSkipped ? 'available' : 'skipped')}
      >
        <X className="w-4 h-4" />
        <span>{isSkipped ? 'Bỏ trạng thái bỏ qua' : 'Đánh dấu bỏ qua'}</span>
      </div>
    </motion.div>
  );
};

// ========== DETAIL MODAL ==========
const DetailModal: React.FC<{
  node: RoadmapNodeData | null;
  status: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (checked: boolean) => void;
}> = ({ node, status, isOpen, onClose, onToggleComplete }) => {
  if (!node || !isOpen) return null;

  const isDone = status === 'done' || status === 'completed';

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
            onClick={() => onToggleComplete(!isDone)}
          >
            {isDone ? 'Bỏ hoàn thành' : 'Đánh dấu hoàn thành'}
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
        <span className="roadmap-tree__legend-label">Cốt lõi</span>
      </div>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--subtopic"></div>
        <span className="roadmap-tree__legend-label">Tùy chọn</span>
      </div>
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--beginner"></div>
        <span className="roadmap-tree__legend-label">Cơ bản</span>
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
      <div className="roadmap-tree__legend-item">
        <div className="roadmap-tree__legend-color roadmap-tree__legend-color--skipped"></div>
        <span className="roadmap-tree__legend-label">Bỏ qua</span>
      </div>
    </div>
  </div>
);

// ========== TREE NODE COMPONENT ==========
const TreeNode: React.FC<{
  node: RoadmapNodeData;
  nodeStatuses: Map<string, string>;
  onNodeClick: (node: RoadmapNodeData) => void;
  onContextMenu: (node: RoadmapNodeData, e: React.MouseEvent) => void;
  onStatusChange: (nodeId: string, status: string) => void;
  level: number;
}> = ({ node, nodeStatuses, onNodeClick, onContextMenu, onStatusChange, level }) => {
  const status = nodeStatuses.get(node.id) || node.status;
  const hasChildren = node.children && node.children.length > 0;

  const getNodeClasses = () => {
    const classes = ['roadmap-tree__node-box', `roadmap-tree__node-box--${node.type}`];
    
    if (status === 'done' || status === 'completed') classes.push('roadmap-tree__node-box--done');
    if (status === 'learning' || status === 'current') classes.push('roadmap-tree__node-box--learning');
    if (status === 'skipped') classes.push('roadmap-tree__node-box--skipped');
    if (status === 'locked') classes.push('roadmap-tree__node-box--locked');
    
    return classes.join(' ');
  };

  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      const isLearning = status === 'learning' || status === 'current';
      onStatusChange(node.id, isLearning ? 'available' : 'learning');
    } else if (e.altKey) {
      const isSkipped = status === 'skipped';
      onStatusChange(node.id, isSkipped ? 'available' : 'skipped');
    } else {
      onNodeClick(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node, e);
  };

  const isDone = status === 'done' || status === 'completed';

  return (
    <div className="roadmap-tree__node">
      <div
        className={getNodeClasses()}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="roadmap-tree__node-title">{node.title}</span>
        
        {isDone && (
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
              nodeStatuses={nodeStatuses}
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
export default function RoadmapTreeView({ roadmapId, roadmapTitle, roadmapData }: RoadmapTreeViewProps) {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Node status tracking
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, string>>(() => {
    const statusMap = new Map<string, string>();
    const collectStatus = (node: RoadmapNodeData) => {
      statusMap.set(node.id, node.status);
      if (node.children) {
        node.children.forEach(collectStatus);
      }
    };
    collectStatus(roadmapData);
    return statusMap;
  });

  // Collect all node IDs for progress calculation
  const allNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const collect = (node: RoadmapNodeData) => {
      ids.add(node.id);
      if (node.children) node.children.forEach(collect);
    };
    collect(roadmapData);
    return ids;
  }, [roadmapData]);

  // Calculate progress
  const progressStats = useMemo(() => {
    const total = allNodeIds.size;
    let done = 0;
    let learning = 0;
    let skipped = 0;

    nodeStatuses.forEach((status) => {
      if (status === 'done' || status === 'completed') done++;
      else if (status === 'learning' || status === 'current') learning++;
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

  // Status change handler
  const handleStatusChange = useCallback((nodeId: string, newStatus: string) => {
    setNodeStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(nodeId, newStatus);
      return newMap;
    });
    setContextMenu(null);
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((node: RoadmapNodeData) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  }, []);

  // Context menu handler
  const handleContextMenu = useCallback((node: RoadmapNodeData, e: React.MouseEvent) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
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
                <h2 className="roadmap-tree-header__title">{roadmapTitle}</h2>
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
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Tìm kiếm (Ctrl+F)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
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

              <Link href={`/roadmap/${roadmapId}`}>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Xem khóa học</span>
                </button>
              </Link>
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
            <TreeNode
              node={roadmapData}
              nodeStatuses={nodeStatuses}
              onNodeClick={handleNodeClick}
              onContextMenu={handleContextMenu}
              onStatusChange={handleStatusChange}
              level={0}
            />
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
            status={nodeStatuses.get(contextMenu.node.id) || 'available'}
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
            status={nodeStatuses.get(selectedNode.id) || 'available'}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onToggleComplete={(checked) => handleStatusChange(selectedNode.id, checked ? 'done' : 'available')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
