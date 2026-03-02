/**
 * Dagre Layout Utility for React Flow
 * Automatically positions nodes in a hierarchical graph layout
 */

import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';  // Top-Bottom, Bottom-Top, Left-Right, Right-Left
  nodeWidth: number;
  nodeHeight: number;
  nodeSep: number;      // Horizontal separation between nodes
  rankSep: number;      // Vertical separation between ranks/levels
  edgeSep: number;      // Minimum separation between edges
  align?: 'UL' | 'UR' | 'DL' | 'DR';  // Alignment within rank
}

/**
 * Default layout options optimized for roadmap.sh-style minimal nodes
 * Ultra-compact spacing for vertical scrollable layout
 * Nodes arranged by depth, scrollable vertically to see all clusters
 */
const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 150,    // Compact width for single-screen display
  nodeHeight: 40,    // Compact height for single-screen display
  nodeSep: 10,        // Ultra-tight horizontal spacing - nodes very close together
  rankSep: 18,        // Ultra-tight vertical spacing - minimize gaps between levels
  edgeSep: 3,         // Minimal edge separation
};

/**
 * Get source and target handle positions based on layout direction
 */
function getHandlePositions(direction: string): { source: Position; target: Position } {
  switch (direction) {
    case 'TB':
      return { source: Position.Bottom, target: Position.Top };
    case 'BT':
      return { source: Position.Top, target: Position.Bottom };
    case 'LR':
      return { source: Position.Right, target: Position.Left };
    case 'RL':
      return { source: Position.Left, target: Position.Right };
    default:
      return { source: Position.Bottom, target: Position.Top };
  }
}

/**
 * Apply dagre layout to nodes and edges
 * Returns new nodes with calculated positions and edges with handle positions
 */
export function getLayoutedElements<T = any>(
  nodes: Node<T>[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a new dagre graph
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Set graph options
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep,
    edgesep: opts.edgeSep,
    align: opts.align,
  });
  
  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });
  
  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Run the layout algorithm
  dagre.layout(dagreGraph);
  
  // Get handle positions based on direction
  const { source: sourcePos, target: targetPos } = getHandlePositions(opts.direction);
  
  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Center the node around the dagre position
    const position = {
      x: nodeWithPosition.x - opts.nodeWidth / 2,
      y: nodeWithPosition.y - opts.nodeHeight / 2,
    };
    
    return {
      ...node,
      position,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    };
  });
  
  // Update edge positions (optional - React Flow handles this automatically)
  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    // You can add additional edge styling here if needed
  }));
  
  return { nodes: layoutedNodes, edges: layoutedEdges };
}

/**
 * Get the bounding box of all nodes after layout
 * Useful for fitView calculations
 */
export function getLayoutBounds(nodes: Node[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  nodes.forEach((node) => {
    const { x, y } = node.position;
    const width = (node.width as number) || 280;
    const height = (node.height as number) || 120;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Group nodes by phase for phased layout
 */
export function groupNodesByPhase<T extends { phase_id?: string }>(
  nodes: Node<T>[]
): Map<string, Node<T>[]> {
  const groups = new Map<string, Node<T>[]>();
  
  nodes.forEach((node) => {
    const phaseId = node.data?.phase_id || 'default';
    if (!groups.has(phaseId)) {
      groups.set(phaseId, []);
    }
    groups.get(phaseId)!.push(node);
  });
  
  return groups;
}

/**
 * Calculate layout with phase separators
 * Adds extra spacing between different phases
 * @deprecated Use getLayoutedElementsWithSections for new roadmap.sh-style structure
 */
export function getLayoutedElementsWithPhases<T extends { phase_id?: string; section_id?: string }>(
  nodes: Node<T>[],
  edges: Edge[],
  phases: { id: string; order: number }[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Sort phases by order
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  
  // Create dagre graph with subgraph support
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep, // No extra space between phases - keep ultra-compact
    edgesep: opts.edgeSep,
    align: 'UL', // Align to top-left for consistent compact layout
  });
  
  // Add phase containers as parent nodes
  sortedPhases.forEach((phase) => {
    dagreGraph.setNode(phase.id, {});
  });
  
  // Add nodes and assign to phases (support both phase_id and section_id)
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
    
    const phaseId = node.data?.phase_id || node.data?.section_id;
    if (phaseId && sortedPhases.some(p => p.id === phaseId)) {
      dagreGraph.setParent(node.id, phaseId);
    }
  });
  
  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Run layout
  dagre.layout(dagreGraph);
  
  // Get handle positions
  const { source: sourcePos, target: targetPos } = getHandlePositions(opts.direction);
  
  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    };
  });
  
  return { nodes: layoutedNodes, edges };
}

/**
 * Calculate layout with section separators (roadmap.sh style)
 * Supports multi-level structure with sections and subsections
 * Adds extra spacing between different sections for better visual grouping
 */
export function getLayoutedElementsWithSections<T extends { section_id?: string; subsection_id?: string; is_hub?: boolean }>(
  nodes: Node<T>[],
  edges: Edge[],
  sections: { id: string; order: number }[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node<T>[]; edges: Edge[] } {
  // Ultra-compact spacing for vertical scrollable layout
  // Minimize all gaps between nodes and clusters for compact display
  const opts = { 
    ...DEFAULT_OPTIONS,
    nodeSep: 10,   // Ultra-tight horizontal spacing - nodes very close
    rankSep: 18,   // Ultra-tight vertical spacing - minimize gaps between levels
    ...options 
  };
  
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  // Create dagre graph with compound/subgraph support
  const dagreGraph = new dagre.graphlib.Graph({ compound: true });
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep, // No extra space between sections - keep ultra-compact
    edgesep: opts.edgeSep,
    align: opts.align || 'UL', // Align to top-left for consistent compact layout
  });
  
  // Add section containers as parent nodes
  sortedSections.forEach((section) => {
    dagreGraph.setNode(section.id, {});
  });
  
  // Add nodes and assign to sections
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
    
    const sectionId = node.data?.section_id;
    if (sectionId && sortedSections.some(s => s.id === sectionId)) {
      dagreGraph.setParent(node.id, sectionId);
    }
  });
  
  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Run the layout algorithm
  dagre.layout(dagreGraph);
  
  // Get handle positions based on direction
  const { source: sourcePos, target: targetPos } = getHandlePositions(opts.direction);
  
  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    };
  });
  
  return { nodes: layoutedNodes, edges };
}
