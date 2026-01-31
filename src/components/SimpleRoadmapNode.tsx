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
 * Tooltip component with roadmap.sh styling
 */
const NodeTooltip = ({ 
  title, 
  description, 
  duration, 
  technologies,
  status 
}: {
  title: string;
  description?: string;
  duration?: string;
  technologies?: string[];
  status?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 8, scale: 0.95 }}
    transition={{ duration: 0.15 }}
    className="roadmap-tooltip"
  >
    <div className="roadmap-tooltip__title">{title}</div>
    {description && (
      <div className="roadmap-tooltip__description">{description}</div>
    )}
    <div className="roadmap-tooltip__meta">
      {duration && (
        <span className="flex items-center gap-1">
          <span>⏱</span> {duration}
        </span>
      )}
      {status && (
        <span className="capitalize">{status}</span>
      )}
    </div>
    {technologies && technologies.length > 0 && (
      <div className="roadmap-tooltip__tech">
        {technologies.slice(0, 4).map((tech, idx) => (
          <span key={idx} className="roadmap-tooltip__tech-item">
            {tech}
          </span>
        ))}
        {technologies.length > 4 && (
          <span className="roadmap-tooltip__tech-item">+{technologies.length - 4}</span>
        )}
      </div>
    )}
    <div className="mt-3 pt-3 border-t border-gray-600 text-[10px] text-gray-400">
      <div>Click: Xem chi tiết</div>
      <div>Right-click: Đánh dấu hoàn thành</div>
      <div>Shift+Click: Đang học</div>
      <div>Alt+Click: Bỏ qua</div>
    </div>
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
 * SimpleRoadmapNode - Roadmap.sh Inspired Design
 * 
 * Features:
 * - Yellow for core/topic nodes
 * - Cream/beige for subtopic/optional nodes
 * - Gray strikethrough for completed
 * - Purple underline for learning
 * - Dark teal strikethrough for skipped
 * - Multiple interaction modes (click, right-click, shift+click, alt+click)
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
   * Handle click - Open detail modal
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger if clicking checkbox
    if ((e.target as HTMLElement).closest('.roadmap-node__checkbox')) {
      return;
    }
    
    // Shift+Click = Learning status
    if (e.shiftKey && data.onStatusChange) {
      e.preventDefault();
      data.onStatusChange(data.id, learning ? 'available' : 'learning');
      return;
    }
    
    // Alt+Click = Skipped status
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
   * Handle right click - Toggle done status (like roadmap.sh)
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

  // Build className based on type and status
  const getNodeClassName = () => {
    const classes = ['roadmap-node'];
    
    // Type class
    classes.push(`roadmap-node--${data.type}`);
    
    // Status classes (roadmap.sh style)
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

      {/* Tooltip on hover */}
      <AnimatePresence>
        {isHovered && !locked && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
            <NodeTooltip
              title={displayTitle}
              description={data.description}
              duration={data.duration}
              technologies={data.technologies}
              status={data.status}
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
        data-node-status={data.status}
      >
        {/* Title with strikethrough/underline based on status */}
        <span className="roadmap-node__title">
          {displayTitle}
        </span>

        {/* Status indicator dots */}
        {completed && !showCheckbox && (
          <div className="roadmap-node__status-dot roadmap-node__status-dot--done" />
        )}
        {learning && (
          <div className="roadmap-node__status-dot roadmap-node__status-dot--learning" />
        )}
        {skipped && (
          <div className="roadmap-node__status-dot roadmap-node__status-dot--skipped" />
        )}
      </div>

      {/* Completed checkmark badge */}
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
