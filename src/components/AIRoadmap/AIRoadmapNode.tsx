"use client";

/**
 * @deprecated Use SimpleRoadmapNode instead for roadmap.sh-style minimal design
 * This component is kept for backward compatibility but should not be used in new code.
 * 
 * Migration guide:
 * - Replace 'aiRoadmapNode' type with 'simpleRoadmapNode'
 * - Import SimpleRoadmapNode from '@/components/SimpleRoadmapNode'
 * - Map node.data.label to title in the data object
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Lock, Clock, BookOpen, Code, Wrench } from 'lucide-react';
import type { AIRoadmapNodeFlowData } from '@/types/ai-roadmap';

/** @deprecated Use SimpleRoadmapNode instead */
const AIRoadmapNode = ({ data, selected }: NodeProps<AIRoadmapNodeFlowData>) => {
  // Get styles based on node type
  const getTypeStyles = () => {
    switch (data.type) {
      case 'core':
        return {
          border: 'border-indigo-400',
          bg: 'bg-indigo-50',
          header: 'bg-indigo-500 text-white',
          badge: 'Cốt lõi',
          icon: <BookOpen className="w-3 h-3" />,
        };
      case 'optional':
        return {
          border: 'border-slate-300',
          bg: 'bg-slate-50',
          header: 'bg-slate-400 text-white',
          badge: 'Tùy chọn',
          icon: <BookOpen className="w-3 h-3" />,
        };
      case 'project':
        return {
          border: 'border-amber-400',
          bg: 'bg-amber-50',
          header: 'bg-amber-500 text-white',
          badge: 'Thực hành',
          icon: <Wrench className="w-3 h-3" />,
        };
      default:
        return {
          border: 'border-gray-300',
          bg: 'bg-gray-50',
          header: 'bg-gray-400 text-white',
          badge: 'Topic',
          icon: <BookOpen className="w-3 h-3" />,
        };
    }
  };

  // Get styles based on status
  const getStatusStyles = () => {
    switch (data.status) {
      case 'completed':
        return {
          ring: 'ring-2 ring-emerald-400 ring-offset-2',
          overlay: 'bg-emerald-500/10',
          indicator: 'bg-emerald-500',
        };
      case 'in_progress':
        return {
          ring: 'ring-2 ring-indigo-400 ring-offset-2',
          overlay: '',
          indicator: 'bg-indigo-500',
        };
      default:
        return {
          ring: '',
          overlay: '',
          indicator: 'bg-gray-300',
        };
    }
  };

  // Get difficulty badge
  const getDifficultyBadge = () => {
    switch (data.difficulty) {
      case 'beginner':
        return { text: 'Cơ bản', color: 'bg-green-100 text-green-700' };
      case 'intermediate':
        return { text: 'Trung cấp', color: 'bg-yellow-100 text-yellow-700' };
      case 'advanced':
        return { text: 'Nâng cao', color: 'bg-red-100 text-red-700' };
      default:
        return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const typeStyles = getTypeStyles();
  const statusStyles = getStatusStyles();
  const difficulty = getDifficultyBadge();

  const handleClick = () => {
    if (data.onClick) {
      data.onClick(data.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (data.onContextMenu) {
      data.onContextMenu(data.id, e);
    }
  };

  return (
    <div className="relative group">
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      {/* Node Card */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          relative overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer
          ${typeStyles.bg} ${typeStyles.border}
          ${statusStyles.ring}
          ${selected ? 'scale-105 shadow-lg' : 'hover:shadow-md hover:-translate-y-0.5'}
          w-[280px]
        `}
      >
        {/* Header */}
        <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${typeStyles.header} flex justify-between items-center`}>
          <div className="flex items-center gap-1.5">
            {typeStyles.icon}
            <span>{typeStyles.badge}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.status === 'completed' && (
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm mb-2 leading-tight line-clamp-2">
            {data.label}
          </h3>

          {/* Description */}
          {data.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {data.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Estimated Hours */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{data.estimated_hours}h</span>
              </div>
            </div>

            {/* Difficulty Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${difficulty.color}`}>
              {difficulty.text}
            </span>
          </div>
        </div>

        {/* Status Overlay for Completed */}
        {data.status === 'completed' && (
          <div className={`absolute inset-0 ${statusStyles.overlay} pointer-events-none`} />
        )}

        {/* Status Indicator */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${statusStyles.indicator}`} />
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(AIRoadmapNode);
