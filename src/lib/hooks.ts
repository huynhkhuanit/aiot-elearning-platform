import { useEffect, useState } from 'react';

/**
 * Hook để cập nhật title của document
 * @param title - Tiêu đề mới cho trang
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = 'CodeSense AIoT';
    };
  }, [title]);
}

/**
 * Hook để lấy nội dung markdown của bài học từ database
 * @param lessonId - ID của bài học
 * @returns Nội dung markdown của bài học
 */
export function useLessonContent(lessonId: string): string | null {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lessonId) {
      setContent(null);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      try {
        // Fetch từ API endpoint - lấy content từ database
        const response = await fetch(`/api/lessons/${lessonId}/content`);
        if (!response.ok) {
          console.warn(`Lesson ${lessonId} not found`);
          setContent(null);
          return;
        }
        
        const data = await response.json();
        setContent(data.content || null);
      } catch (error) {
        console.error('Error loading lesson content:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [lessonId]);

  return content;
}
