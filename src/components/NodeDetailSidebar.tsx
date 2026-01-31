"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, BookOpen, Sparkles, ExternalLink,
  Play, FileText, ChevronDown, Loader2, Clock, Star
} from 'lucide-react';

// ========== TYPES ==========
export interface NodeResource {
  type: 'article' | 'video' | 'course';
  title: string;
  url: string;
  source?: string;
  isPremium?: boolean;
  discount?: string;
}

export interface NodeDetailData {
  description: string;
  relatedConcepts: string[];
  freeResources: NodeResource[];
  aiTutorContent: string;
  premiumResources?: NodeResource[];
}

interface NodeDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  nodeTitle: string;
  nodeDescription?: string;
  nodeStatus: string;
  onStatusChange: (status: string) => void;
  nodeId: string;
}

// ========== RESOURCE BADGE ==========
const ResourceBadge: React.FC<{ type: string; discount?: string }> = ({ type, discount }) => {
  const colors: Record<string, string> = {
    article: 'bg-yellow-100 text-yellow-800',
    video: 'bg-purple-100 text-purple-800',
    course: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type === 'article' ? 'Article' : type === 'video' ? 'Video' : 'Course'}
      </span>
      {discount && (
        <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
          {discount}
        </span>
      )}
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export default function NodeDetailSidebar({
  isOpen,
  onClose,
  nodeTitle,
  nodeDescription,
  nodeStatus,
  onStatusChange,
  nodeId,
}: NodeDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'ai-tutor'>('resources');
  const [isLoading, setIsLoading] = useState(false);
  const [nodeDetail, setNodeDetail] = useState<NodeDetailData | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const isDone = nodeStatus === 'done' || nodeStatus === 'completed';
  const isLearning = nodeStatus === 'learning' || nodeStatus === 'current';

  // Fetch node details from AI API
  const fetchNodeDetail = useCallback(async () => {
    if (!nodeTitle) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/node-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: nodeTitle,
          context: null,
          user_level: 'intermediate',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setNodeDetail({
          description: data.description || nodeDescription || '',
          relatedConcepts: data.related_concepts || [],
          freeResources: data.free_resources || [],
          aiTutorContent: data.ai_tutor_content || '',
          premiumResources: data.premium_resources || [],
        });
      } else {
        // Fallback data if API fails
        setNodeDetail({
          description: nodeDescription || `Learn about ${nodeTitle} and its core concepts.`,
          relatedConcepts: [],
          freeResources: [
            { type: 'article', title: `Introduction to ${nodeTitle}`, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(nodeTitle)}`, source: 'MDN' },
            { type: 'video', title: `${nodeTitle} Tutorial`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(nodeTitle + ' tutorial')}`, source: 'YouTube' },
          ],
          aiTutorContent: '',
          premiumResources: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch node detail:', error);
      // Fallback
      setNodeDetail({
        description: nodeDescription || `Learn about ${nodeTitle} and its core concepts.`,
        relatedConcepts: [],
        freeResources: [
          { type: 'article', title: `Search: ${nodeTitle}`, url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(nodeTitle)}`, source: 'MDN' },
        ],
        aiTutorContent: '',
        premiumResources: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, [nodeTitle, nodeDescription]);

  useEffect(() => {
    if (isOpen && nodeTitle) {
      fetchNodeDetail();
    }
  }, [isOpen, nodeTitle, fetchNodeDetail]);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const getStatusLabel = () => {
    if (isDone) return 'Done';
    if (isLearning) return 'In Progress';
    return 'Pending';
  };

  const getStatusColor = () => {
    if (isDone) return 'bg-green-100 text-green-800';
    if (isLearning) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[90]"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-[480px] h-full bg-white shadow-2xl z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'resources'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Resources
                </button>
                <button
                  onClick={() => setActiveTab('ai-tutor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'ai-tutor'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Tutor
                </button>
              </div>

              {/* Status & Close */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg ${getStatusColor()}`}
                  >
                    {isDone && <CheckCircle className="w-3.5 h-3.5" />}
                    {getStatusLabel()}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                      <button
                        onClick={() => { onStatusChange('pending'); setStatusDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => { onStatusChange('learning'); setStatusDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => { onStatusChange('done'); setStatusDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : (
                <div className="p-6">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{nodeTitle}</h2>

                  {/* Description */}
                  {nodeDetail?.description && (
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {nodeDetail.description}
                    </p>
                  )}

                  {activeTab === 'resources' && (
                    <>
                      {/* Free Resources */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-green-600">💚</span>
                          <span className="text-sm font-semibold text-gray-900">Free Resources</span>
                        </div>
                        
                        <div className="space-y-3">
                          {nodeDetail?.freeResources && nodeDetail.freeResources.length > 0 ? (
                            nodeDetail.freeResources.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                              >
                                <ResourceBadge type={resource.type} />
                                <span className="flex-1 text-sm font-medium text-gray-900 group-hover:text-purple-600">
                                  {resource.title}
                                </span>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                              </a>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No free resources available yet.</p>
                          )}
                        </div>
                      </div>

                      {/* AI Tutor Quick Access */}
                      {nodeDetail?.aiTutorContent && (
                        <div className="mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-900">Your personalized AI tutor</span>
                          </div>
                          
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); setActiveTab('ai-tutor'); }}
                            className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                          >
                            <ResourceBadge type="article" />
                            <span className="flex-1 text-sm font-medium text-gray-900">
                              Learn more about {nodeTitle}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </a>
                        </div>
                      )}

                      {/* Premium Resources */}
                      {nodeDetail?.premiumResources && nodeDetail.premiumResources.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-semibold text-gray-900">Premium Resources</span>
                          </div>
                          
                          <div className="space-y-3">
                            {nodeDetail.premiumResources.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
                              >
                                <ResourceBadge type={resource.type} discount={resource.discount} />
                                <span className="flex-1 text-sm font-medium text-gray-900 group-hover:text-purple-600">
                                  {resource.title}
                                </span>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                              </a>
                            ))}
                          </div>

                          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
                            <p className="font-medium text-gray-700 mb-1">Note on Premium Resources</p>
                            <p>These are optional paid resources vetted by our team. If you purchase a resource, we may receive a small commission at no extra cost to you.</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'ai-tutor' && (
                    <div>
                      {nodeDetail?.aiTutorContent ? (
                        <div className="prose prose-sm max-w-none">
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{nodeDetail.aiTutorContent}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">AI-generated content for this topic is being prepared.</p>
                          <button
                            onClick={fetchNodeDetail}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Generate AI Content
                          </button>
                        </div>
                      )}

                      {/* Related Concepts */}
                      {nodeDetail?.relatedConcepts && nodeDetail.relatedConcepts.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Related Concepts</h3>
                          <div className="flex flex-wrap gap-2">
                            {nodeDetail.relatedConcepts.map((concept, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
                              >
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
