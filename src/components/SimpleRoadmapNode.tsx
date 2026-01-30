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
 * Get CSS class name based on node type
 * Uses classes from roadmap-nodes.css
 */
const getNodeTypeClass = (type: SimpleRoadmapNodeData['type']): string => {
  return `simple-roadmap-node--${type}`;
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
  const completed = isCompleted(data.status);
  const locked = isLocked(data.status);
  const active = isActive(data.status);
  const typeClass = getNodeTypeClass(data.type);
  
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

  // Build className array - only include classes when conditions are true
  const classNameParts = [
    'simple-roadmap-node',
    `simple-roadmap-node--${data.type}`,
    completed && 'simple-roadmap-node--completed',
    active && 'simple-roadmap-node--active',
    locked && 'simple-roadmap-node--locked',
    selected && 'simple-roadmap-node--selected',
  ].filter(Boolean); // Remove falsy values (false, undefined, null, empty string)

  return (
    <div className="relative">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-slate-300 !border-0 !-top-1"
      />

      {/* Node Body - Using CSS classes from roadmap-nodes.css */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={classNameParts.join(' ')}
        title={displayTitle} // Show full title on hover
      >
        {/* Title - single line with ellipsis */}
        <span className="block truncate leading-tight">
          {displayTitle}
        </span>

        {/* Completed Checkmark - using CSS class from roadmap-nodes.css */}
        {completed && (
          <div className="simple-roadmap-node__checkmark">
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
