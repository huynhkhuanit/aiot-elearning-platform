"use client";

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Node data interface for roadmap.sh-inspired design
 */
export interface SimpleRoadmapNodeData {
  id: string;
  title: string;
  label?: string;
  description?: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative' | 'project';
  status?: 'pending' | 'in_progress' | 'completed' | 'available' | 'current' | 'locked' | 'done' | 'learning' | 'skipped';
  duration?: string;
  estimated_hours?: number;
  difficulty?: string;
  technologies?: string[];
  phase_id?: string;
  showCheckbox?: boolean;
  onCheckboxChange?: (nodeId: string, checked: boolean) => void;
  onClick?: (nodeId: string) => void;
  onContextMenu?: (nodeId: string, event: React.MouseEvent) => void;
  onDoubleClick?: (nodeId: string) => void;
  onStatusChange?: (nodeId: string, status: string) => void;
}

/**
 * Tooltip component
 */
const NodeTooltip = ({ 
  title, 
  description, 
  duration, 
  technologies,
}: {
  title: string;
  description?: string;
  duration?: string;
  technologies?: string[];
}) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 6 }}
    transition={{ duration: 0.15 }}
    className="roadmap-tooltip"
  >
    <div className="roadmap-tooltip__title">{title}</div>
    {description && (
      <div className="roadmap-tooltip__description">{description}</div>
    )}
    {(duration || technologies) && (
      <div className="roadmap-tooltip__meta">
        {duration && <span>⏱ {duration}</span>}
      </div>
    )}
    {technologies && technologies.length > 0 && (
      <div className="roadmap-tooltip__tech">
        {technologies.slice(0, 4).map((tech, idx) => (
          <span key={idx} className="roadmap-tooltip__tech-item">{tech}</span>
        ))}
        {technologies.length > 4 && (
          <span className="roadmap-tooltip__tech-item">+{technologies.length - 4}</span>
        )}
      </div>
    )}
  </motion.div>
);

/**
 * Status helper functions
 */
const isDone = (status?: string) => status === 'completed' || status === 'done';
const isLearning = (status?: string) => status === 'current' || status === 'in_progress' || status === 'learning';
const isSkipped = (status?: string) => status === 'skipped';
const isLocked = (status?: string) => status === 'locked';

/**
 * SimpleRoadmapNode - Fixed width node for vertical tree layout
 */
const SimpleRoadmapNode = ({ data, selected }: NodeProps<SimpleRoadmapNodeData>) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const completed = isDone(data.status);
  const learning = isLearning(data.status);
  const skipped = isSkipped(data.status);
  const locked = isLocked(data.status);
  
  const displayTitle = data.title || data.label || 'Untitled';
  const showCheckbox = data.showCheckbox !== false;

  /**
   * Handle click
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.roadmap-node__checkbox')) {
      return;
    }
    
    // Shift+Click = Learning
    if (e.shiftKey && data.onStatusChange) {
      e.preventDefault();
      data.onStatusChange(data.id, learning ? 'available' : 'learning');
      return;
    }
    
    // Alt+Click = Skipped
    if (e.altKey && data.onStatusChange) {
      e.preventDefault();
      data.onStatusChange(data.id, skipped ? 'available' : 'skipped');
      return;
    }
    
    // Normal click = Open details
    if (!locked && data.onClick) {
      data.onClick(data.id);
    }
  }, [locked, data, learning, skipped]);

  /**
   * Handle right click - Toggle done status
   */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (data.onStatusChange) {
      data.onStatusChange(data.id, completed ? 'available' : 'done');
    } else if (data.onContextMenu) {
      data.onContextMenu(data.id, e);
    }
  }, [data, completed]);

  /**
   * Handle checkbox click
   */
  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onCheckboxChange) {
      data.onCheckboxChange(data.id, !completed);
    } else if (data.onStatusChange) {
      data.onStatusChange(data.id, completed ? 'available' : 'done');
    }
  }, [completed, data]);

  /**
   * Handle double click
   */
  const handleDoubleClick = useCallback(() => {
    if (data.onDoubleClick) {
      data.onDoubleClick(data.id);
    }
  }, [data]);

  // Build className
  const getNodeClassName = () => {
    const classes = ['roadmap-node'];
    classes.push(`roadmap-node--${data.type}`);
    if (completed) classes.push('roadmap-node--done');
    if (learning) classes.push('roadmap-node--learning');
    if (skipped) classes.push('roadmap-node--skipped');
    if (locked) classes.push('roadmap-node--locked');
    if (selected) classes.push('roadmap-node--selected');
    return classes.join(' ');
  };

  return (
    <div className="relative">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="react-flow__handle"
      />

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && !locked && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
            <NodeTooltip
              title={displayTitle}
              description={data.description}
              duration={data.duration}
              technologies={data.technologies}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Checkbox - Left side */}
      {showCheckbox && (
        <div
          onClick={handleCheckboxClick}
          className={`roadmap-node__checkbox ${completed ? 'roadmap-node__checkbox--checked' : ''}`}
        >
          {completed && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
        </div>
      )}

      {/* Node Body */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={getNodeClassName()}
        data-node-id={data.id}
        data-node-type={data.type}
      >
        <span className="roadmap-node__title">{displayTitle}</span>
      </div>

      {/* Completed checkmark */}
      {completed && showCheckbox && (
        <div className="roadmap-node__checkmark">
          <Check className="w-2.5 h-2.5" strokeWidth={3} />
        </div>
      )}

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="react-flow__handle"
      />
    </div>
  );
};

export default memo(SimpleRoadmapNode);
