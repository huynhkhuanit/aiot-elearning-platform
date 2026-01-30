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
      {/* Target Handle (Top) - Minimal like roadmap.sh */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-0 !opacity-60"
        style={{ top: -3 }}
      />

      {/* Node Body - Fixed size for consistent roadmap.sh-style display */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          relative px-3 py-2 rounded-md border-2 text-xs font-medium
          text-center transition-all duration-150 select-none
          w-[170px] h-[44px] flex items-center justify-center
          ${styles.border} ${styles.bg} ${styles.text} ${styles.hoverBg}
          ${locked ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
          ${selected ? 'ring-2 ring-blue-400 ring-offset-1 shadow-md' : ''}
          ${active ? 'ring-2 ring-indigo-400 ring-offset-1 shadow-md' : ''}
          ${completed ? 'ring-2 ring-green-400 ring-offset-1 shadow-md' : ''}
          hover:shadow-md hover:scale-105
        `}
      >
        {/* Title */}
        <span className="line-clamp-2 leading-tight text-center">
          {displayTitle}
        </span>

        {/* Completed Checkmark */}
        {completed && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Source Handle (Bottom) - Minimal like roadmap.sh */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-slate-400 !border-0 !opacity-60"
        style={{ bottom: -3 }}
      />
    </div>
  );
};

export default memo(SimpleRoadmapNode);
