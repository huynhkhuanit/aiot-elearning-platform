// ============================================
// AI Personalized Learning Roadmap - Type Definitions
// ============================================

// ============================================
// User Profile (Input for AI Generation)
// ============================================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningStyle = 'documentation' | 'video' | 'project' | 'interactive';
export type PreferredLanguage = 'vi' | 'en';

export interface UserProfile {
  // Basic info
  currentRole: string;           // "Sinh viên năm 3", "Developer 1 năm"
  targetRole: string;            // "Frontend Senior", "AI Engineer"
  
  // Current skills
  currentSkills: string[];       // ["HTML/CSS", "JavaScript cơ bản"]
  skillLevel: SkillLevel;
  
  // Learning preferences
  learningStyle: LearningStyle[];
  
  // Time commitment
  hoursPerWeek: number;          // 5, 10, 20, 30+
  targetMonths: number;          // 3, 6, 12
  
  // Optional preferences
  preferredLanguage: PreferredLanguage;
  focusAreas?: string[];         // Specific areas to focus on
}

// Predefined options for the onboarding form
export const CURRENT_ROLE_OPTIONS = [
  { value: 'student-1', label: 'Sinh viên năm 1' },
  { value: 'student-2', label: 'Sinh viên năm 2' },
  { value: 'student-3', label: 'Sinh viên năm 3' },
  { value: 'student-4', label: 'Sinh viên năm 4' },
  { value: 'fresh-graduate', label: 'Mới tốt nghiệp' },
  { value: 'career-changer', label: 'Người chuyển ngành' },
  { value: 'junior-dev', label: 'Junior Developer (< 1 năm)' },
  { value: 'mid-dev', label: 'Developer (1-3 năm)' },
  { value: 'senior-dev', label: 'Senior Developer (3+ năm)' },
  { value: 'other', label: 'Khác' },
] as const;

export const TARGET_ROLE_OPTIONS = [
  { value: 'frontend-developer', label: 'Frontend Developer' },
  { value: 'backend-developer', label: 'Backend Developer' },
  { value: 'fullstack-developer', label: 'Fullstack Developer' },
  { value: 'mobile-developer', label: 'Mobile Developer' },
  { value: 'devops-engineer', label: 'DevOps Engineer' },
  { value: 'data-engineer', label: 'Data Engineer' },
  { value: 'data-scientist', label: 'Data Scientist' },
  { value: 'ml-engineer', label: 'Machine Learning Engineer' },
  { value: 'ai-engineer', label: 'AI Engineer' },
  { value: 'cloud-architect', label: 'Cloud Architect' },
  { value: 'security-engineer', label: 'Security Engineer' },
  { value: 'qa-engineer', label: 'QA Engineer' },
  { value: 'game-developer', label: 'Game Developer' },
  { value: 'blockchain-developer', label: 'Blockchain Developer' },
  { value: 'embedded-engineer', label: 'Embedded Systems Engineer' },
] as const;

export const SKILL_OPTIONS = [
  // Languages
  { value: 'html-css', label: 'HTML/CSS', category: 'Web Basics' },
  { value: 'javascript', label: 'JavaScript', category: 'Languages' },
  { value: 'typescript', label: 'TypeScript', category: 'Languages' },
  { value: 'python', label: 'Python', category: 'Languages' },
  { value: 'java', label: 'Java', category: 'Languages' },
  { value: 'csharp', label: 'C#', category: 'Languages' },
  { value: 'cpp', label: 'C/C++', category: 'Languages' },
  { value: 'go', label: 'Go', category: 'Languages' },
  { value: 'rust', label: 'Rust', category: 'Languages' },
  { value: 'php', label: 'PHP', category: 'Languages' },
  
  // Frontend Frameworks
  { value: 'react', label: 'React', category: 'Frontend' },
  { value: 'vue', label: 'Vue.js', category: 'Frontend' },
  { value: 'angular', label: 'Angular', category: 'Frontend' },
  { value: 'nextjs', label: 'Next.js', category: 'Frontend' },
  { value: 'tailwindcss', label: 'Tailwind CSS', category: 'Frontend' },
  
  // Backend
  { value: 'nodejs', label: 'Node.js', category: 'Backend' },
  { value: 'express', label: 'Express.js', category: 'Backend' },
  { value: 'django', label: 'Django', category: 'Backend' },
  { value: 'fastapi', label: 'FastAPI', category: 'Backend' },
  { value: 'spring', label: 'Spring Boot', category: 'Backend' },
  
  // Databases
  { value: 'sql', label: 'SQL', category: 'Database' },
  { value: 'postgresql', label: 'PostgreSQL', category: 'Database' },
  { value: 'mongodb', label: 'MongoDB', category: 'Database' },
  { value: 'redis', label: 'Redis', category: 'Database' },
  
  // DevOps & Cloud
  { value: 'git', label: 'Git', category: 'Tools' },
  { value: 'docker', label: 'Docker', category: 'DevOps' },
  { value: 'kubernetes', label: 'Kubernetes', category: 'DevOps' },
  { value: 'aws', label: 'AWS', category: 'Cloud' },
  { value: 'gcp', label: 'Google Cloud', category: 'Cloud' },
  { value: 'azure', label: 'Azure', category: 'Cloud' },
  
  // Data & AI
  { value: 'numpy', label: 'NumPy/Pandas', category: 'Data Science' },
  { value: 'tensorflow', label: 'TensorFlow', category: 'AI/ML' },
  { value: 'pytorch', label: 'PyTorch', category: 'AI/ML' },
  
  // Mobile
  { value: 'react-native', label: 'React Native', category: 'Mobile' },
  { value: 'flutter', label: 'Flutter', category: 'Mobile' },
  { value: 'swift', label: 'Swift', category: 'Mobile' },
  { value: 'kotlin', label: 'Kotlin', category: 'Mobile' },
] as const;

export const LEARNING_STYLE_OPTIONS = [
  { value: 'documentation', label: 'Đọc tài liệu', description: 'Đọc docs, articles, tutorials' },
  { value: 'video', label: 'Xem video', description: 'Video courses, YouTube tutorials' },
  { value: 'project', label: 'Làm project thực tế', description: 'Học qua việc xây dựng dự án' },
  { value: 'interactive', label: 'Bài tập tương tác', description: 'Coding challenges, quizzes' },
] as const;

export const HOURS_PER_WEEK_OPTIONS = [
  { value: 5, label: '5 giờ/tuần', description: 'Học nhẹ nhàng' },
  { value: 10, label: '10 giờ/tuần', description: 'Học vừa phải' },
  { value: 15, label: '15 giờ/tuần', description: 'Học tập trung' },
  { value: 20, label: '20 giờ/tuần', description: 'Học chuyên sâu' },
  { value: 30, label: '30+ giờ/tuần', description: 'Học full-time' },
] as const;

export const TARGET_MONTHS_OPTIONS = [
  { value: 3, label: '3 tháng', description: 'Lộ trình nhanh' },
  { value: 6, label: '6 tháng', description: 'Lộ trình chuẩn' },
  { value: 12, label: '12 tháng', description: 'Lộ trình chi tiết' },
] as const;

// ============================================
// AI Generated Roadmap (Output from AI)
// ============================================

export type NodeType = 'core' | 'optional' | 'project';
export type NodeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type NodeStatus = 'pending' | 'in_progress' | 'completed';

export interface LearningResources {
  keywords: string[];
  suggested_type: 'video' | 'doc' | 'project';
}

export interface RoadmapPhase {
  id: string;
  name: string;
  order: number;
}

export interface RoadmapNodeData {
  label: string;
  description: string;
  estimated_hours: number;
  difficulty: NodeDifficulty;
  learning_resources: LearningResources;
}

export interface RoadmapNode {
  id: string;
  phase_id: string;
  type: NodeType;
  data: RoadmapNodeData;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface AIGeneratedRoadmap {
  roadmap_title: string;
  roadmap_description: string;
  total_estimated_hours: number;
  phases: RoadmapPhase[];
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

// ============================================
// Generation Metadata (for Thesis Metrics)
// ============================================

export interface GenerationMetadata {
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  prompt_version: string;
  personalization_score?: number;
  generated_at: string;
}

// ============================================
// Database Models
// ============================================

export interface UserAIProfile {
  id: string;
  user_id: string;
  current_job_role: string;
  target_role: string;
  current_skills: string[];
  skill_level: SkillLevel;
  learning_style: LearningStyle[];
  hours_per_week: number;
  target_months: number;
  preferred_language: PreferredLanguage;
  focus_areas: string[];
  created_at: string;
  updated_at: string;
}

export interface AIGeneratedRoadmapDB {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  description: string | null;
  total_estimated_hours: number;
  phases: RoadmapPhase[];
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  generation_metadata: GenerationMetadata | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIRoadmapNodeProgress {
  id: string;
  roadmap_id: string;
  user_id: string;
  node_id: string;
  status: NodeStatus;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateRoadmapRequest {
  profile: UserProfile;
}

export interface GenerateRoadmapResponse {
  success: boolean;
  data?: {
    roadmap: AIGeneratedRoadmap;
    metadata: GenerationMetadata;
  };
  error?: string;
}

export interface SavedRoadmapResponse {
  success: boolean;
  data?: AIGeneratedRoadmapDB;
  error?: string;
}

export interface UpdateNodeProgressRequest {
  status: NodeStatus;
  notes?: string;
}

export interface UpdateNodeProgressResponse {
  success: boolean;
  data?: AIRoadmapNodeProgress;
  error?: string;
}

// ============================================
// React Flow Compatible Types
// ============================================

import type { Node, Edge } from 'reactflow';

export interface AIRoadmapNodeFlowData extends RoadmapNodeData {
  id: string;
  phase_id: string;
  type: NodeType;
  status: NodeStatus;
  onClick?: (nodeId: string) => void;
  onContextMenu?: (nodeId: string, event: React.MouseEvent) => void;
}

export type AIRoadmapFlowNode = Node<AIRoadmapNodeFlowData>;
export type AIRoadmapFlowEdge = Edge;

// ============================================
// Course Recommendation Types
// ============================================

export interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  match_score?: number;
}

export interface NodeDetailWithRecommendations {
  node: RoadmapNode;
  status: NodeStatus;
  recommended_courses: RecommendedCourse[];
  external_resources: {
    google_search_url: string;
    youtube_search_url: string;
  };
}
