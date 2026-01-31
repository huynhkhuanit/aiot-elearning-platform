"use client";

import React, { useMemo, useState, useEffect } from 'react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getLayoutedElementsWithPhases, getLayoutedElementsWithSections } from '@/lib/dagre-layout';
import SimpleRoadmapNode from '@/components/SimpleRoadmapNode';
import AINodeDetailDrawer from './AINodeDetailDrawer';
import type { AIGeneratedRoadmap, RoadmapNode, NodeStatus } from '@/types/ai-roadmap';

// Use SimpleRoadmapNode for clean roadmap.sh-style design
const nodeTypes = {
  simpleRoadmapNode: SimpleRoadmapNode,
};

// Helper component to trigger fitView when nodes/edges change
function FitViewHelper() {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    // Small delay to ensure nodes are rendered, then fit view horizontally
    // Allow vertical scroll to see all nodes by depth
    const timer = setTimeout(() => {
      fitView({ 
        padding: 20,
        maxZoom: 1,
        minZoom: 0.8,
        duration: 300, // Smooth animation
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [fitView]);
  
  // Also trigger on window resize to maintain fit
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        fitView({ 
          padding: 20,
          maxZoom: 1,
          minZoom: 0.8,
          duration: 200,
        });
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);
  
  return null;
}

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

  // Convert roadmap nodes to React Flow nodes using SimpleRoadmapNode
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const flowNodes: Node[] = roadmap.nodes.map((node: RoadmapNode) => ({
      id: node.id,
      type: 'simpleRoadmapNode',
      data: {
        // Map to SimpleRoadmapNode data interface
        id: node.id,
        title: node.data.label, // AI roadmap uses 'label' instead of 'title'
        label: node.data.label,
        description: node.data.description,
        type: node.type,
        status: nodeProgress[node.id] || 'pending',
        // Additional data for detail drawer (not shown on node)
        phase_id: node.phase_id,
        estimated_hours: node.data.estimated_hours,
        difficulty: node.data.difficulty,
        // Callbacks
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
      animated: false, // Disable animation for cleaner look
      style: { stroke: '#cbd5e1', strokeWidth: 2 }, // Cleaner slate-300 color
    }));

    // Use sections-based layout if sections exist, otherwise fall back to phases
    if (roadmap.sections && roadmap.sections.length > 0) {
      return getLayoutedElementsWithSections(flowNodes, flowEdges, roadmap.sections);
    } else {
      return getLayoutedElementsWithPhases(flowNodes, flowEdges, roadmap.phases || []);
    }
  }, [roadmap, nodeProgress, onProgressUpdate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when progress changes
  useEffect(() => {
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
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 to-indigo-50">
      {isTempRoadmap && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            ⚠️ Lộ trình này chưa được lưu vào database. Vui lòng chạy migration để lưu trữ.
          </p>
        </div>
      )}

      {/* ReactFlow with vertical scroll - compact layout, scrollable by depth */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 20,  // Padding around edges
          includeHiddenNodes: false,
          maxZoom: 1,   // Prevent zooming in
          minZoom: 0.8, // Allow slight zoom out to see more content
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }} // Start at 1x zoom
        minZoom={0.5}   // Allow zoom out to see full roadmap
        maxZoom={1.5}   // Allow slight zoom in
        zoomOnScroll={true}   // Enable scroll to zoom (optional)
        zoomOnPinch={true}    // Enable pinch zoom
        zoomOnDoubleClick={false}  // Disable double-click zoom
        panOnScroll={true}    // Enable pan on scroll - allow vertical scrolling
        panOnDrag={true}      // Enable pan on drag - allow dragging to navigate
        nodesDraggable={false}  // Nodes should not be draggable
        className="bg-gradient-to-br from-slate-50 to-indigo-50"
        style={{ width: '100%', height: '100%' }}
      >
        <FitViewHelper />
        {/* Remove Controls - no zoom controls needed */}
        <MiniMap
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => {
            // Match SimpleRoadmapNode colors
            if (node.data?.status === 'completed') return '#22c55e'; // green-500
            switch (node.data?.type) {
              case 'core': return '#faf5ff';      // purple-50
              case 'optional': return '#f9fafb'; // gray-50
              case 'project': return '#fff7ed';  // orange-50
              default: return '#f3f4f6';
            }
          }}
          pannable={false}
          zoomable={false}
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />

        {/* Roadmap Info Panel */}
        <Panel position="top-left" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm max-w-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{roadmap.roadmap_title}</h1>
          {roadmap.roadmap_description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{roadmap.roadmap_description}</p>
          )}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>{roadmap.nodes.length} topics</span>
            <span>{roadmap.total_estimated_hours}h total</span>
          </div>
        </Panel>

        {/* Legend Panel - Matching roadmap.sh style */}
        <Panel position="top-right" className="roadmap-legend">
          <h3 className="roadmap-legend__title">Chú giải</h3>
          <div className="roadmap-legend__section">
            <h4 className="roadmap-legend__section-title">Loại nội dung</h4>
            <div className="roadmap-legend__item">
              <div className="roadmap-legend__color roadmap-legend__color--core"></div>
              <span className="roadmap-legend__label">Cốt lõi</span>
            </div>
            <div className="roadmap-legend__item">
              <div className="roadmap-legend__color roadmap-legend__color--optional"></div>
              <span className="roadmap-legend__label">Tùy chọn</span>
            </div>
            <div className="roadmap-legend__item">
              <div className="roadmap-legend__color roadmap-legend__color--project"></div>
              <span className="roadmap-legend__label">Thực hành</span>
            </div>
          </div>
          <div className="roadmap-legend__section pt-3 border-t border-gray-100">
            <h4 className="roadmap-legend__section-title">Trạng thái</h4>
            <div className="roadmap-legend__item">
              <div className="roadmap-legend__color roadmap-legend__color--completed"></div>
              <span className="roadmap-legend__label">Đã hoàn thành</span>
            </div>
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
