"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, ExternalLink,
  ChevronDown, Loader2, Heart, Zap, Star
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
  const badgeStyles: Record<string, string> = {
    article: 'bg-yellow-400 text-black',
    video: 'bg-purple-400 text-white icon-play', 
    course: 'bg-yellow-400 text-black',
  };

  return (
    <div className="flex items-center gap-2 shrink-0 select-none">
      <span className={`px-2 py-[2px] text-[10px] font-bold uppercase rounded-sm flex items-center justify-center min-w-[50px] tracking-wide ${badgeStyles[type] || 'bg-gray-200'}`}>
        {type}
      </span>
      {discount && (
        <span className="px-1.5 py-[2px] text-[10px] font-bold bg-green-500 text-white rounded-sm uppercase tracking-wide">
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
  const [isLoading, setIsLoading] = useState(false);
  const [nodeDetail, setNodeDetail] = useState<NodeDetailData | null>(null);

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
        // Fallback data
        setNodeDetail({
          description: nodeDescription || `Learn about ${nodeTitle}.`,
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
      setNodeDetail({
        description: nodeDescription || `Learn about ${nodeTitle}.`,
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


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[90]"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            className="fixed top-0 right-0 w-full max-w-[500px] h-full bg-white z-[100] flex flex-col font-sans shadow-2xl"
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-100">
               {/* Empty left side for spacing or future use */}
               <div></div>

              <div className="flex items-center justify-end w-full">
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                  <span className="text-sm font-medium">Gathering resources...</span>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Title & Description */}
                  <header>
                    <h1 className="text-[32px] font-black leading-tight text-gray-900 mb-4 tracking-tight">
                      {nodeTitle}
                    </h1>
                    {nodeDetail?.description && (
                      <p className="text-[16px] leading-[1.6] text-gray-600 font-normal">
                        {nodeDetail.description}
                      </p>
                    )}
                  </header>

                  {/* Free Resources */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-[1px] bg-green-200 flex-1"></div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        Free Resources
                      </span>
                      <div className="h-[1px] bg-green-200 flex-1"></div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {nodeDetail?.freeResources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-baseline gap-3 py-2 group hover:bg-gray-50 -mx-3 px-3 rounded-md transition-colors"
                        >
                          <ResourceBadge type={resource.type} />
                          <span className="flex-1 text-[14px] text-gray-800 group-hover:text-blue-600 group-hover:underline underline-offset-4 decoration-blue-300 transition-all leading-normal">
                            {resource.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>

                  {/* AI Tutor */}
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-[1px] bg-blue-200 flex-1"></div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        AI Tutor
                      </span>
                      <div className="h-[1px] bg-blue-200 flex-1"></div>
                    </div>

                    <div className="space-y-3">
                      <a
                         href="#"
                         className="flex items-baseline gap-3 py-2 group hover:bg-gray-50 -mx-3 px-3 rounded-md transition-colors"
                      >
                        <ResourceBadge type="article" />
                        <span className="flex-1 text-[14px] text-gray-800 group-hover:text-blue-600 group-hover:underline underline-offset-4 decoration-blue-300 transition-all leading-normal">
                          Read explanation: How {nodeTitle} works
                        </span>
                      </a>
                    </div>
                  </section>

                  {/* Premium Resources */}
                  {nodeDetail?.premiumResources && nodeDetail.premiumResources.length > 0 && (
                    <section>
                       <div className="flex items-center gap-3 mb-4">
                        <div className="h-[1px] bg-purple-200 flex-1"></div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                          Premium
                        </span>
                        <div className="h-[1px] bg-purple-200 flex-1"></div>
                      </div>

                      <div className="space-y-1.5">
                        {nodeDetail.premiumResources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-baseline gap-3 py-2 group hover:bg-gray-50 -mx-3 px-3 rounded-md transition-colors"
                          >
                            <ResourceBadge type={resource.type} discount={resource.discount} />
                            <span className="flex-1 text-[14px] text-gray-800 group-hover:text-blue-600 group-hover:underline underline-offset-4 decoration-blue-300 transition-all leading-normal">
                              {resource.title}
                            </span>
                          </a>
                        ))}
                      </div>

                      {/* Disclaimer */}
                      <div className="mt-8 bg-gray-50 p-4 rounded text-[12px] leading-relaxed text-gray-500">
                        <p>
                          <strong>Note:</strong> We may earn a commission if you buy through these links. 
                          This helps keep the roadmap free.
                        </p>
                      </div>
                    </section>
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
