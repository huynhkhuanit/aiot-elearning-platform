"use client";

/**
 * @deprecated Use SimpleRoadmapNode instead for roadmap.sh-style minimal design
 * This component is kept for backward compatibility but should not be used in new code.
 * 
 * Migration guide:
 * - Replace 'roadmapNode' type with 'simpleRoadmapNode'
 * - Import SimpleRoadmapNode from '@/components/SimpleRoadmapNode'
 * - The data interface is compatible
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Check, Lock } from 'lucide-react';

/** @deprecated Use SimpleRoadmapNodeData from SimpleRoadmapNode instead */
export interface RoadmapNodeData {
  id: string;
  title: string;
  description?: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative';
  status: 'available' | 'completed' | 'current' | 'locked';
  duration?: string;
  technologies?: string[];
  difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  children?: any[];
  onClick?: (nodeId: string) => void;
}

const RoadmapNode = ({ data, selected }: NodeProps<RoadmapNodeData>) => {
  const getStyles = () => {
    switch (data.type) {
      case 'core':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-500',
          header: 'bg-purple-500 text-white',
          text: 'text-purple-900',
          badge: 'bg-purple-200 text-purple-800'
        };
      case 'optional':
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-400',
          header: 'bg-slate-400 text-white',
          text: 'text-slate-900',
          badge: 'bg-slate-200 text-slate-800'
        };
      case 'beginner':
        return {
          bg: 'bg-emerald-100',
          border: 'border-emerald-500',
          header: 'bg-emerald-500 text-white',
          text: 'text-emerald-900',
          badge: 'bg-emerald-200 text-emerald-800'
        };
      case 'alternative':
        return {
          bg: 'bg-amber-100',
          border: 'border-amber-500',
          header: 'bg-amber-500 text-white',
          text: 'text-amber-900',
          badge: 'bg-amber-200 text-amber-800'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-400',
          header: 'bg-gray-400 text-white',
          text: 'text-gray-900',
          badge: 'bg-gray-200 text-gray-800'
        };
    }
  };

  const styles = getStyles();

  const handleClick = () => {
    if (data.status !== 'locked' && data.onClick) {
      data.onClick(data.id);
    }
  };

  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />

      <div
        onClick={handleClick}
        className={`
          relative overflow-hidden rounded-lg border-2 transition-all duration-200
          ${styles.bg} ${styles.border}
          ${selected ? 'ring-4 ring-offset-2 ring-blue-300 scale-105' : 'hover:shadow-lg hover:-translate-y-1'}
          ${data.status === 'locked' ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'}
          w-[220px]
        `}
      >
        {/* Header Strip */}
        <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${styles.header} flex justify-between items-center`}>
          <span>
             {data.type === 'core' ? 'Cốt lõi' :
              data.type === 'optional' ? 'Tùy chọn' :
              data.type === 'beginner' ? 'Cơ bản' : 'Thay thế'}
          </span>
          {data.status === 'completed' && <Check className="w-3 h-3" />}
          {data.status === 'locked' && <Lock className="w-3 h-3" />}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className={`font-bold text-sm mb-1 leading-tight ${styles.text}`}>
            {data.title}
          </h3>
          
          {data.description && (
            <p className="text-[11px] text-gray-600 line-clamp-2 leading-snug">
              {data.description}
            </p>
          )}

          {/* Footer info */}
          {(data.duration || (data.technologies && data.technologies.length > 0)) && (
            <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px] text-gray-500 font-medium">
              {data.duration && <span>{data.duration}</span>}
              {data.technologies && data.technologies.length > 0 && (
                <span className="bg-white/50 px-1.5 py-0.5 rounded">
                  {data.technologies.length} topics
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Status Overlay for Completed */}
        {data.status === 'completed' && (
          <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white"
      />
    </div>
  );
};

export default memo(RoadmapNode);
