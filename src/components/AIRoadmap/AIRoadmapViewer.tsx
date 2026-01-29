"use client";

import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElementsWithPhases } from '@/lib/dagre-layout';
import AIRoadmapNode from './AIRoadmapNode';
import AINodeDetailDrawer from './AINodeDetailDrawer';
import type { AIGeneratedRoadmap, RoadmapNode, NodeStatus } from '@/types/ai-roadmap';

const nodeTypes = {
  aiRoadmapNode: AIRoadmapNode,
};

interface AIRoadmapViewerProps {
  roadmap: AIGeneratedRoadmap;
  roadmapId: string;
  initialProgress?: Record<string, NodeStatus>;
  onProgressUpdate?: (nodeId: string, status: NodeStatus) => void;
  isTempRoadmap?: boolean;
}

export default function AIRoadmapViewer({
  roadmap,
  roadmapId,
  initialProgress = {},
  onProgressUpdate,
  isTempRoadmap = false,
}: AIRoadmapViewerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeProgress, setNodeProgress] = useState<Record<string, NodeStatus>>(initialProgress);

  // Convert roadmap nodes to React Flow nodes
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const flowNodes: Node[] = roadmap.nodes.map((node: RoadmapNode) => ({
      id: node.id,
      type: 'aiRoadmapNode',
      data: {
        ...node.data,
        id: node.id,
        phase_id: node.phase_id,
        type: node.type,
        status: nodeProgress[node.id] || 'pending',
        onClick: (nodeId: string) => setSelectedNodeId(nodeId),
        onContextMenu: (nodeId: string, event: React.MouseEvent) => {
          event.preventDefault();
          const currentStatus = nodeProgress[nodeId] || 'pending';
          const newStatus: NodeStatus = currentStatus === 'completed' ? 'pending' : 'completed';
          setNodeProgress((prev) => ({ ...prev, [nodeId]: newStatus }));
          onProgressUpdate?.(nodeId, newStatus);
        },
      },
      position: { x: 0, y: 0 }, // Will be calculated by dagre
    }));

    const flowEdges: Edge[] = roadmap.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }));

    return getLayoutedElementsWithPhases(flowNodes, flowEdges, roadmap.phases);
  }, [roadmap, nodeProgress, onProgressUpdate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when progress changes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: nodeProgress[node.id] || 'pending',
        },
      }))
    );
  }, [nodeProgress, setNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return roadmap.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, roadmap.nodes]);

  return (
    <div className="w-full h-screen relative">
      {isTempRoadmap && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            ⚠️ Lộ trình này chưa được lưu vào database. Vui lòng chạy migration để lưu trữ.
          </p>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-gradient-to-br from-slate-50 to-indigo-50"
      >
        <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
        <MiniMap
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => {
            const status = node.data?.status || 'pending';
            if (status === 'completed') return '#10b981';
            if (status === 'in_progress') return '#3b82f6';
            return '#e5e7eb';
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />

        <Panel position="top-left" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{roadmap.roadmap_title}</h1>
          {roadmap.roadmap_description && (
            <p className="text-sm text-gray-600 mb-2">{roadmap.roadmap_description}</p>
          )}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{roadmap.nodes.length} topics</span>
            <span>{roadmap.total_estimated_hours}h total</span>
          </div>
        </Panel>
      </ReactFlow>

      {selectedNode && (
        <AINodeDetailDrawer
          node={selectedNode}
          status={nodeProgress[selectedNode.id] || 'pending'}
          isOpen={!!selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          onMarkComplete={(nodeId) => {
            const currentStatus = nodeProgress[nodeId] || 'pending';
            const newStatus: NodeStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            setNodeProgress((prev) => ({ ...prev, [nodeId]: newStatus }));
            onProgressUpdate?.(nodeId, newStatus);
          }}
        />
      )}
    </div>
  );
}
