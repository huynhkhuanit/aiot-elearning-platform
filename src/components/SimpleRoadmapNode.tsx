"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check } from 'lucide-react';

/**
 * Unified simple node data interface for both standard and AI roadmaps
 * Follows roadmap.sh's minimal design pattern
 */
export interface SimpleRoadmapNodeData {
  id: string;
  title: string;
  label?: string; // Alternative to title (for AI roadmap compatibility)
  description?: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
  status?: 'pending' | 'in_progress' | 'completed' | 'available' | 'current' | 'locked';
  // Additional data for detail drawer (not displayed on node)
  duration?: string;
  estimated_hours?: number;
  difficulty?: string;
  technologies?: string[];
  phase_id?: string;
  // Callbacks
  onClick?: (nodeId: string) => void;
  onContextMenu?: (nodeId: string, event: React.MouseEvent) => void;
}

/**
 * Get type-based styling classes
 * Minimal color palette following roadmap.sh style
 */
const getTypeStyles = (type: SimpleRoadmapNodeData['type']) => {
  switch (type) {
    case 'core':
      return {
        border: 'border-purple-400',
        bg: 'bg-purple-50',
        text: 'text-purple-900',
        hoverBg: 'hover:bg-purple-100',
      };
    case 'optional':
      return {
        border: 'border-gray-300',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        hoverBg: 'hover:bg-gray-100',
      };
    case 'beginner':
      return {
        border: 'border-green-400',
        bg: 'bg-green-50',
        text: 'text-green-900',
        hoverBg: 'hover:bg-green-100',
      };
    case 'project':
      return {
        border: 'border-orange-400',
        bg: 'bg-orange-50',
        text: 'text-orange-900',
        hoverBg: 'hover:bg-orange-100',
      };
    case 'alternative':
      return {
        border: 'border-slate-400',
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        hoverBg: 'hover:bg-slate-100',
      };
    default:
      return {
        border: 'border-gray-300',
        bg: 'bg-white',
        text: 'text-gray-900',
        hoverBg: 'hover:bg-gray-50',
      };
  }
};

/**
 * Check if node is completed based on various status values
 */
const isCompleted = (status?: SimpleRoadmapNodeData['status']) => {
  return status === 'completed';
};

/**
 * Check if node is locked
 */
const isLocked = (status?: SimpleRoadmapNodeData['status']) => {
  return status === 'locked';
};

/**
 * Check if node is currently active/in progress
 */
const isActive = (status?: SimpleRoadmapNodeData['status']) => {
  return status === 'current' || status === 'in_progress';
};

/**
 * SimpleRoadmapNode - A minimal, clean node component following roadmap.sh design
 * 
 * Features:
 * - Simple rectangular design with subtle rounded corners
 * - Light background colors with matching borders
 * - Single-line title (no descriptions on node)
 * - Checkmark overlay for completed nodes
 * - Consistent sizing across all node types
 */
const SimpleRoadmapNode = ({ data, selected }: NodeProps<SimpleRoadmapNodeData>) => {
  const styles = getTypeStyles(data.type);
  const completed = isCompleted(data.status);
  const locked = isLocked(data.status);
  const active = isActive(data.status);
  
  // Use title or label (for AI roadmap compatibility)
  const displayTitle = data.title || data.label || 'Untitled';

  const handleClick = () => {
    if (!locked && data.onClick) {
      data.onClick(data.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (data.onContextMenu) {
      e.preventDefault();
      data.onContextMenu(data.id, e);
    }
  };

  return (
    <div className="relative">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-300 !border-0 !-top-1"
      />

      {/* Node Body - Ultra-compact sizing for single-screen display like roadmap.sh */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          relative px-3 py-1.5 rounded border-[1.5px] text-xs font-medium
          text-center transition-all duration-120 select-none
          min-w-[130px] max-w-[160px]
          ${styles.border} ${styles.bg} ${styles.text} ${styles.hoverBg}
          ${locked ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer'}
          ${selected ? 'ring-1 ring-blue-400' : ''}
          ${active ? 'ring-1 ring-indigo-400' : ''}
          ${completed ? 'ring-1 ring-green-400' : ''}
          hover:shadow-sm
        `}
        title={displayTitle} // Show full title on hover
      >
        {/* Title - single line with ellipsis */}
        <span className="block truncate leading-tight">
          {displayTitle}
        </span>

        {/* Completed Checkmark - minimal like roadmap.sh */}
        {completed && (
          <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-green-500 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-slate-300 !border-0 !-bottom-1"
      />
    </div>
  );
};

export default memo(SimpleRoadmapNode);
