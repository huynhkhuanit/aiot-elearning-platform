"use client";

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { ArrowLeft, BookOpen, Grid3X3, List } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import SimpleRoadmapNode from './SimpleRoadmapNode';
import RoadmapDetailModal from './RoadmapDetailModal';

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  type: 'core' | 'optional' | 'beginner' | 'alternative';
  status: 'available' | 'completed' | 'current' | 'locked';
  duration?: string;
  technologies?: string[];
  difficulty?: 'Cơ bản' | 'Trung cấp' | 'Nâng cao';
  children?: RoadmapNode[];
}

interface RoadmapFlowProps {
  roadmapId: string;
  roadmapTitle: string;
  roadmapData: RoadmapNode;
}

// Node types - Using SimpleRoadmapNode for clean roadmap.sh-style design
const nodeTypes = {
  simpleRoadmapNode: SimpleRoadmapNode,
};

export default function RoadmapFlow({ roadmapId, roadmapTitle, roadmapData }: RoadmapFlowProps) {
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Store original status for each node
  const [originalStatus] = useState<Map<string, string>>(() => {
    const statusMap = new Map<string, string>();
    const collectStatus = (node: RoadmapNode) => {
      statusMap.set(node.id, node.status);
      if (node.children) {
        node.children.forEach(collectStatus);
      }
    };
    collectStatus(roadmapData);
    return statusMap;
  });
  
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(() => {
    // Initialize with nodes that are already completed in the data
    const initialCompleted = new Set<string>();
    const collectCompleted = (node: RoadmapNode) => {
      if (node.status === 'completed') {
        initialCompleted.add(node.id);
      }
      if (node.children) {
        node.children.forEach(collectCompleted);
      }
    };
    collectCompleted(roadmapData);
    return initialCompleted;
  });

  // Handle node click
  const handleNodeClick = useCallback((nodeId: string) => {
    const findNode = (node: RoadmapNode): RoadmapNode | null => {
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child);
          if (found) return found;
        }
      }
      return null;
    };
    
    const node = findNode(roadmapData);
    if (node) {
      setSelectedNode(node);
      setIsModalOpen(true);
    }
  }, [roadmapData]);

  // Handle toggle completion
  const handleToggleComplete = useCallback((nodeId: string) => {
    setCompletedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Convert roadmap data to React Flow format with improved layout
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 1;

    // Layout configuration - Ultra-compact for roadmap.sh-style single-screen display
    // All nodes must fit on one screen without zoom - minimize all gaps
    const NODE_WIDTH = 150;  // Ultra-compact width for single-screen display
    const NODE_HEIGHT = 40;  // Ultra-compact height for single-screen display
    const GAP_X = 12;        // Very tight horizontal gap - nodes close together
    const GAP_Y = 25;        // Very tight vertical gap - levels close together

    // Helper to calculate subtree dimensions
    const getSubtreeDimensions = (node: RoadmapNode, isVertical: boolean): number => {
      if (!node.children || node.children.length === 0) {
        return isVertical ? NODE_WIDTH : NODE_HEIGHT;
      }

      const childrenDimension = node.children.reduce((acc, child) => {
        return acc + getSubtreeDimensions(child, isVertical);
      }, 0);

      const gapTotal = (node.children.length - 1) * (isVertical ? GAP_X : GAP_Y);
      return Math.max(isVertical ? NODE_WIDTH : NODE_HEIGHT, childrenDimension + gapTotal);
    };

    // Recursive function to assign positions
    function processNode(
      node: RoadmapNode, 
      x: number, 
      y: number, 
      parentId?: string
    ): string {
      const currentId = node.id || `node-${nodeId++}`;

      // Determine status
      let actualStatus = node.status;
      if (completedNodes.has(currentId)) {
        actualStatus = 'completed';
      } else if (node.status === 'completed') {
        actualStatus = 'available';
      }

      nodes.push({
        id: currentId,
        type: 'simpleRoadmapNode',
        position: { x, y },
        data: {
          id: node.id,
          title: node.title,
          description: node.description,
          type: node.type,
          status: actualStatus,
          duration: node.duration,
          technologies: node.technologies,
          onClick: handleNodeClick,
        },
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          type: 'default',
          style: {
            stroke: '#cbd5e1', // slate-300 - cleaner, subtle color
            strokeWidth: 2,
          },
          animated: actualStatus === 'current',
        });
      }

      if (node.children && node.children.length > 0) {
        const isVertical = layoutMode === 'vertical';
        const subtreeSize = getSubtreeDimensions(node, isVertical);
        
        let currentPos = isVertical 
          ? x - subtreeSize / 2 
          : y - subtreeSize / 2;

        node.children.forEach((child) => {
          const childSubtreeSize = getSubtreeDimensions(child, isVertical);
          
          if (isVertical) {
            const childX = currentPos + childSubtreeSize / 2;
            const childY = y + NODE_HEIGHT + GAP_Y;
            processNode(child, childX, childY, currentId);
            currentPos += childSubtreeSize + GAP_X;
          } else {
            const childX = x + NODE_WIDTH + GAP_X;
            const childY = currentPos + childSubtreeSize / 2;
            processNode(child, childX, childY, currentId);
            currentPos += childSubtreeSize + GAP_Y;
          }
        });
      }

      return currentId;
    }

    // Start layout from center
    const startX = 600;
    const startY = 50;
    
    processNode(roadmapData, startX, startY);

    return { nodes, edges };
  }, [roadmapData, layoutMode, handleNodeClick, completedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when completedNodes changes
  const updateNodesStatus = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const nodeOriginalStatus = originalStatus.get(node.id) || 'available';
        let actualStatus = nodeOriginalStatus;
        
        if (completedNodes.has(node.id)) {
          actualStatus = 'completed';
        } else if (nodeOriginalStatus !== 'completed' && nodeOriginalStatus !== 'current' && nodeOriginalStatus !== 'locked') {
          // Keep original status if it's not completed
          actualStatus = nodeOriginalStatus;
        } else if (nodeOriginalStatus === 'completed') {
          // If originally completed but removed from completedNodes, set to available
          actualStatus = 'available';
        } else {
          // Keep current or locked status
          actualStatus = nodeOriginalStatus;
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            status: actualStatus,
          },
        };
      })
    );
  }, [completedNodes, setNodes, originalStatus]);

  // Trigger update when completedNodes changes
  useEffect(() => {
    updateNodesStatus();
  }, [completedNodes, updateNodesStatus]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Re-initialize nodes when layout mode changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 sticky top-0 z-10"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/roadmap" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Quay lại</span>
                </Link>
                <div className="self-stretch w-px bg-gray-200"></div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{roadmapTitle}</h2>
                  <p className="text-sm text-gray-500">
                    {nodes.length} kỹ năng • Bố cục {layoutMode === 'vertical' ? 'Dọc' : 'Ngang'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setLayoutMode(layoutMode === 'vertical' ? 'horizontal' : 'vertical')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                >
                  {layoutMode === 'vertical' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                  <span>Đổi bố cục</span>
                </button>

                <Link href={`/roadmap/${roadmapId}`}>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] hover:bg-[#5558e3] rounded-lg transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Xem khóa học</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* React Flow Container - Full screen, no zoom */}
        <div className="h-[calc(100vh-80px)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 15,  // Minimal padding to maximize visible area
              includeHiddenNodes: false,
              maxZoom: 1,  // Lock zoom at 1x
              minZoom: 1,  // Lock zoom at 1x
              duration: 300, // Smooth animation
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }} // Lock at 1x zoom
            attributionPosition="bottom-left"
            className="bg-transparent"
            minZoom={1}    // Disable zoom out
            maxZoom={1}    // Disable zoom in - completely disable zoom
            zoomOnScroll={false}  // Disable scroll zoom
            zoomOnPinch={false}   // Disable pinch zoom
            zoomOnDoubleClick={false}  // Disable double-click zoom
            panOnScroll={false}   // Disable pan on scroll
            panOnDrag={false}     // Disable pan on drag - roadmap.sh style is static
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            selectNodesOnDrag={false}
          >
            {/* Remove Controls - no zoom controls needed for roadmap.sh style */}

            <MiniMap
              className="bg-white border border-gray-200 rounded-lg shadow-sm"
              nodeColor={(node) => {
                // Match the node type colors from SimpleRoadmapNode
                if (node.data?.status === 'completed') return '#22c55e'; // green-500
                switch (node.data?.type) {
                  case 'core': return '#faf5ff';      // purple-50
                  case 'optional': return '#f9fafb'; // gray-50
                  case 'beginner': return '#f0fdf4'; // green-50
                  case 'project': return '#fff7ed';  // orange-50
                  case 'alternative': return '#f8fafc'; // slate-50
                  default: return '#f3f4f6';
                }
              }}
              maskColor="rgba(255, 255, 255, 0.9)"
              pannable={false}
              zoomable={false}
            />

            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />

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
                  <div className="roadmap-legend__color roadmap-legend__color--beginner"></div>
                  <span className="roadmap-legend__label">Cơ bản</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--alternative"></div>
                  <span className="roadmap-legend__label">Thay thế</span>
                </div>
              </div>

              <div className="roadmap-legend__section pt-3 border-t border-gray-100">
                <h4 className="roadmap-legend__section-title">Trạng thái</h4>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--completed"></div>
                  <span className="roadmap-legend__label">Đã hoàn thành</span>
                </div>
                <div className="roadmap-legend__item">
                  <div className="roadmap-legend__color roadmap-legend__color--active"></div>
                  <span className="roadmap-legend__label">Đang học</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Detail Modal */}
      <RoadmapDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        nodeData={selectedNode}
        isCompleted={selectedNode ? completedNodes.has(selectedNode.id) : false}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}