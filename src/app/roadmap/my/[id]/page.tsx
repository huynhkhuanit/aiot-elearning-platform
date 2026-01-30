"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIRoadmapTreeView from '@/components/AIRoadmap/AIRoadmapTreeView';
import type { AIGeneratedRoadmap, NodeStatus } from '@/types/ai-roadmap';

export default function AIRoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [roadmap, setRoadmap] = useState<AIGeneratedRoadmap | null>(null);
  const [progress, setProgress] = useState<Record<string, NodeStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTempRoadmap, setIsTempRoadmap] = useState(false);

  useEffect(() => {
    if (id) {
      loadRoadmap();
    }
  }, [id]);

  const loadRoadmap = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if it's a temp roadmap (stored in localStorage)
      if (id.startsWith('temp-')) {
        const tempData = localStorage.getItem(`temp-roadmap-${id}`);
        if (tempData) {
          const tempRoadmap = JSON.parse(tempData);
          setRoadmap({
            roadmap_title: tempRoadmap.roadmap_title || 'Lộ trình học tập',
            roadmap_description: tempRoadmap.roadmap_description || '',
            total_estimated_hours: tempRoadmap.total_estimated_hours || 0,
            phases: tempRoadmap.phases || [],
            nodes: tempRoadmap.nodes || [],
            edges: tempRoadmap.edges || [],
          });
          setProgress(tempRoadmap.progress || {});
          setIsTempRoadmap(true);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API
      const response = await fetch(`/api/ai-roadmap/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Lộ trình không tồn tại hoặc đã bị xóa.');
        } else {
          setError('Không thể tải lộ trình. Vui lòng thử lại.');
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setRoadmap({
          roadmap_title: data.data.title,
          roadmap_description: data.data.description || '',
          total_estimated_hours: data.data.total_estimated_hours,
          phases: data.data.phases,
          nodes: data.data.nodes,
          edges: data.data.edges,
        });
        setProgress(data.data.progress || {});
      } else {
        setError(data.error || 'Không thể tải lộ trình.');
      }
    } catch (err) {
      console.error('Error loading roadmap:', err);
      setError('Đã xảy ra lỗi khi tải lộ trình.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (nodeId: string, status: NodeStatus) => {
    // Update local state immediately
    setProgress((prev) => ({ ...prev, [nodeId]: status }));

    // If temp roadmap, save to localStorage
    if (isTempRoadmap) {
      const tempData = localStorage.getItem(`temp-roadmap-${id}`);
      if (tempData) {
        const tempRoadmap = JSON.parse(tempData);
        tempRoadmap.progress = { ...tempRoadmap.progress, [nodeId]: status };
        localStorage.setItem(`temp-roadmap-${id}`, JSON.stringify(tempRoadmap));
      }
      return;
    }

    // Otherwise, update via API
    try {
      await fetch(`/api/ai-roadmap/${id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ node_id: nodeId, status }),
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải lộ trình...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không thể tải lộ trình</h2>
          <p className="text-gray-600 mb-6">{error || 'Lộ trình không tồn tại.'}</p>
          <Button onClick={() => router.push('/roadmap/my')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AIRoadmapTreeView
      roadmap={roadmap}
      roadmapId={id}
      initialProgress={progress}
      onProgressUpdate={handleProgressUpdate}
      isTempRoadmap={isTempRoadmap}
    />
  );
}
