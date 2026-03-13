// ============================================
// AI Personalized Learning Roadmap - Type Definitions
// ============================================

// ============================================
// User Profile (Input for AI Generation)
// ============================================

export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type LearningStyle =
    | "documentation"
    | "video"
    | "project"
    | "interactive";
export type PreferredLanguage = "vi" | "en";
export type ContentBias = "theory_heavy" | "balanced" | "practice_heavy";
export type RoadmapDepth = "standard" | "deep" | "expert";
export type LessonGranularity = "compact" | "detailed" | "micro_lesson";
export type FoundationCoverage = "auto" | "full_foundation" | "fast_track";
export type AudienceType =
    | "worker"
    | "non-worker"
    | "student"
    | "university_student"
    | "recent_graduate";

export interface GenerationPreferences {
    contentBias: ContentBias;
    roadmapDepth: RoadmapDepth;
    lessonGranularity: LessonGranularity;
    foundationCoverage: FoundationCoverage;
}

export interface RangeConstraint {
    min: number;
    max: number;
}

export interface GenerationDirectives {
    availableHoursTotal: number;
    targetNodeRange: RangeConstraint;
    minSections: number;
    minSubsectionsPerSection: number;
    minLessonsPerSubsection: RangeConstraint;
    theoryRatioTarget: number;
    projectCadence: string;
    requirePrerequisites: boolean;
    requireLearningOutcomes: boolean;
}

export interface UserProfile {
    // Basic info
    currentRole: string; // Auto-derived from audienceType + sub-fields
    targetRole: string; // "Frontend Senior", "AI Engineer"

    // Audience type (Đối tượng)
    audienceType: AudienceType;

    // Audience-specific detail fields
    specificJob?: string; // For 'worker': Công việc cụ thể
    classLevel?: string; // For 'student': Lớp mấy (1-12)
    major?: string; // For 'university_student' | 'recent_graduate': Ngành
    studyYear?: number; // For 'university_student': Năm (1-4)

    // Current skills
    currentSkills: string[]; // ["HTML/CSS", "JavaScript cơ bản"]
    skillLevel: SkillLevel;

    // Learning preferences
    learningStyle: LearningStyle[];

    // Time commitment
    hoursPerWeek: number; // 5, 10, 20, 30+
    targetMonths: number; // 3, 6, 12

    // Optional preferences
    preferredLanguage: PreferredLanguage;
    focusAreas?: string[]; // Specific areas to focus on
    generationPreferences: GenerationPreferences;
}

// Predefined options for the onboarding form
export const AUDIENCE_TYPE_OPTIONS = [
    {
        value: "worker",
        label: "Người đi làm",
        description: "Đang đi làm và muốn nâng cao kỹ năng",
    },
    {
        value: "non-worker",
        label: "Người không đi làm",
        description: "Chưa đi làm, muốn học kỹ năng mới",
    },
    {
        value: "student",
        label: "Học sinh",
        description: "Đang học phổ thông (THCS/THPT)",
    },
    {
        value: "university_student",
        label: "Sinh viên",
        description: "Đang học đại học / cao đẳng",
    },
    {
        value: "recent_graduate",
        label: "Người mới tốt nghiệp",
        description: "Vừa tốt nghiệp, muốn tìm việc",
    },
] as const;

export const CLASS_LEVEL_OPTIONS = [
    { value: "6", label: "Lớp 6" },
    { value: "7", label: "Lớp 7" },
    { value: "8", label: "Lớp 8" },
    { value: "9", label: "Lớp 9" },
    { value: "10", label: "Lớp 10" },
    { value: "11", label: "Lớp 11" },
    { value: "12", label: "Lớp 12" },
] as const;

export const STUDY_YEAR_OPTIONS = [
    { value: 1, label: "Năm 1" },
    { value: 2, label: "Năm 2" },
    { value: 3, label: "Năm 3" },
    { value: 4, label: "Năm 4" },
] as const;

export const CURRENT_ROLE_OPTIONS = [
    { value: "student-1", label: "Sinh viên năm 1" },
    { value: "student-2", label: "Sinh viên năm 2" },
    { value: "student-3", label: "Sinh viên năm 3" },
    { value: "student-4", label: "Sinh viên năm 4" },
    { value: "fresh-graduate", label: "Mới tốt nghiệp" },
    { value: "career-changer", label: "Chuyển hướng nghề nghiệp" },
    { value: "junior-dev", label: "Junior Developer" },
    { value: "mid-dev", label: "Mid-level Developer" },
    { value: "senior-dev", label: "Senior Developer" },
    { value: "other", label: "Khác" },
] as const;

export const TARGET_ROLE_OPTIONS = [
    { value: "frontend-developer", label: "Frontend Developer" },
    { value: "backend-developer", label: "Backend Developer" },
    { value: "fullstack-developer", label: "Fullstack Developer" },
    { value: "mobile-developer", label: "Mobile Developer" },
    { value: "devops-engineer", label: "DevOps Engineer" },
    { value: "data-engineer", label: "Data Engineer" },
    { value: "data-scientist", label: "Data Scientist" },
    { value: "ml-engineer", label: "Machine Learning Engineer" },
    { value: "ai-engineer", label: "AI Engineer" },
    { value: "cloud-architect", label: "Cloud Architect" },
    { value: "security-engineer", label: "Security Engineer" },
    { value: "qa-engineer", label: "QA Engineer" },
    { value: "game-developer", label: "Game Developer" },
    { value: "blockchain-developer", label: "Blockchain Developer" },
    { value: "embedded-engineer", label: "Embedded Systems Engineer" },
] as const;

export const SKILL_OPTIONS = [
    // Languages
    { value: "html-css", label: "HTML/CSS", category: "Web Basics" },
    { value: "javascript", label: "JavaScript", category: "Languages" },
    { value: "typescript", label: "TypeScript", category: "Languages" },
    { value: "python", label: "Python", category: "Languages" },
    { value: "java", label: "Java", category: "Languages" },
    { value: "csharp", label: "C#", category: "Languages" },
    { value: "cpp", label: "C/C++", category: "Languages" },
    { value: "go", label: "Go", category: "Languages" },
    { value: "rust", label: "Rust", category: "Languages" },
    { value: "php", label: "PHP", category: "Languages" },

    // Frontend Frameworks
    { value: "react", label: "React", category: "Frontend" },
    { value: "vue", label: "Vue.js", category: "Frontend" },
    { value: "angular", label: "Angular", category: "Frontend" },
    { value: "nextjs", label: "Next.js", category: "Frontend" },
    { value: "tailwindcss", label: "Tailwind CSS", category: "Frontend" },

    // Backend
    { value: "nodejs", label: "Node.js", category: "Backend" },
    { value: "express", label: "Express.js", category: "Backend" },
    { value: "django", label: "Django", category: "Backend" },
    { value: "fastapi", label: "FastAPI", category: "Backend" },
    { value: "spring", label: "Spring Boot", category: "Backend" },

    // Databases
    { value: "sql", label: "SQL", category: "Database" },
    { value: "postgresql", label: "PostgreSQL", category: "Database" },
    { value: "mongodb", label: "MongoDB", category: "Database" },
    { value: "redis", label: "Redis", category: "Database" },

    // DevOps & Cloud
    { value: "git", label: "Git", category: "Tools" },
    { value: "docker", label: "Docker", category: "DevOps" },
    { value: "kubernetes", label: "Kubernetes", category: "DevOps" },
    { value: "aws", label: "AWS", category: "Cloud" },
    { value: "gcp", label: "Google Cloud", category: "Cloud" },
    { value: "azure", label: "Azure", category: "Cloud" },

    // Data & AI
    { value: "numpy", label: "NumPy/Pandas", category: "Data Science" },
    { value: "tensorflow", label: "TensorFlow", category: "AI/ML" },
    { value: "pytorch", label: "PyTorch", category: "AI/ML" },

    // Mobile
    { value: "react-native", label: "React Native", category: "Mobile" },
    { value: "flutter", label: "Flutter", category: "Mobile" },
    { value: "swift", label: "Swift", category: "Mobile" },
    { value: "kotlin", label: "Kotlin", category: "Mobile" },
] as const;

export const LEARNING_STYLE_OPTIONS = [
    {
        value: "documentation",
        label: "Đọc tài liệu",
        description: "Đọc docs, articles, tutorials",
    },
    {
        value: "video",
        label: "Xem video",
        description: "Video courses, YouTube tutorials",
    },
    {
        value: "project",
        label: "Làm project thực tế",
        description: "Học qua việc xây dựng dự án",
    },
    {
        value: "interactive",
        label: "Bài tập tương tác",
        description: "Coding challenges, quizzes",
    },
] as const;

export const CONTENT_BIAS_OPTIONS = [
    {
        value: "theory_heavy",
        label: "Nặng lý thuyết",
        description:
            "Ưu tiên khái niệm, nguyên lý, tài liệu và các bài học nền tảng",
    },
    {
        value: "balanced",
        label: "Cân bằng",
        description: "Kết hợp lý thuyết, bài tập và project theo tỷ lệ đều",
    },
    {
        value: "practice_heavy",
        label: "Nặng thực hành",
        description: "Ưu tiên project, bài tập và checkpoint thực chiến",
    },
] as const;

export const LESSON_GRANULARITY_OPTIONS = [
    {
        value: "compact",
        label: "Gọn",
        description: "Gộp nhóm bài học thành topic lớn để đi nhanh",
    },
    {
        value: "detailed",
        label: "Chi tiết",
        description: "Chia bài học rõ ràng theo từng cụm kiến thức",
    },
    {
        value: "micro_lesson",
        label: "Vi bài học",
        description:
            "Tách nhỏ thành nhiều bài học có độ chi tiết cao và rất dày",
    },
] as const;

export const ROADMAP_DEPTH_OPTIONS = [
    {
        value: "standard",
        label: "Standard",
        description: "Lộ trình đầy đủ ở mức cơ bản cho mục tiêu nghề nghiệp",
    },
    {
        value: "deep",
        label: "Deep",
        description:
            "Đào sâu lý thuyết, hệ thống hóa kiến thức và best practices",
    },
    {
        value: "expert",
        label: "Expert",
        description: "Mở rộng thêm internals, kiến trúc, tối ưu và ecosystem",
    },
] as const;

export const FOUNDATION_COVERAGE_OPTIONS = [
    {
        value: "auto",
        label: "Tự động",
        description:
            "AI cân đối giữa nền tảng và tốc độ dựa trên hồ sơ của bạn",
    },
    {
        value: "full_foundation",
        label: "Nền tảng đầy đủ",
        description:
            "Đi lại nền tảng một cách hệ thống trước khi lên phần nâng cao",
    },
    {
        value: "fast_track",
        label: "Fast track",
        description: "Rút gọn nền tảng để đi nhanh vào kỹ năng mục tiêu",
    },
] as const;

export const HOURS_PER_WEEK_OPTIONS = [
    { value: 5, label: "5 giờ/tuần", description: "Học nhẹ nhàng" },
    { value: 10, label: "10 giờ/tuần", description: "Học vừa phải" },
    { value: 15, label: "15 giờ/tuần", description: "Học tập trung" },
    { value: 20, label: "20 giờ/tuần", description: "Học chuyên sâu" },
    { value: 30, label: "30+ giờ/tuần", description: "Học full-time" },
] as const;

export const TARGET_MONTHS_OPTIONS = [
    { value: 3, label: "3 tháng", description: "Lộ trình nhanh" },
    { value: 6, label: "6 tháng", description: "Lộ trình chuẩn" },
    { value: 12, label: "12 tháng", description: "Lộ trình chi tiết" },
] as const;

// ============================================
// AI Generated Roadmap (Output from AI)
// ============================================

export type NodeType = "core" | "optional" | "project" | "alternative";
export type NodeDifficulty = "beginner" | "intermediate" | "advanced";
export type NodeStatus = "pending" | "in_progress" | "completed" | "skipped";

export interface LearningResources {
    keywords: string[];
    suggested_type: "video" | "doc" | "project";
}

// ============================================
// New roadmap.sh-style structure
// ============================================

export interface RoadmapSubsection {
    id: string;
    name: string;
    order: number;
    description?: string;
}

export interface RoadmapSection {
    id: string;
    name: string;
    order: number;
    description?: string;
    subsections?: RoadmapSubsection[];
}

// Backward compatibility alias
export interface RoadmapPhase {
    id: string;
    name: string;
    order: number;
}

// Enhanced node data with prerequisites and learning outcomes
export interface RoadmapNodeData {
    label: string;
    description: string;
    estimated_hours: number;
    difficulty: NodeDifficulty;
    prerequisites?: string[]; // NEW: prerequisite topics
    learning_outcomes?: string[]; // NEW: what you'll learn
    learning_resources: LearningResources;
}

export interface RoadmapNode {
    id: string;
    phase_id?: string; // Backward compatibility
    section_id: string; // NEW: parent section
    subsection_id?: string; // NEW: parent subsection (optional)
    type: NodeType;
    is_hub?: boolean; // NEW: true if this is a hub node that branches to multiple children
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
    sections?: RoadmapSection[]; // NEW: roadmap.sh-style sections
    phases?: RoadmapPhase[]; // Backward compatibility
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
    quality_warnings?: string[];
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

export interface GenerationPreferencesRequest {
    content_bias: ContentBias;
    roadmap_depth: RoadmapDepth;
    lesson_granularity: LessonGranularity;
    foundation_coverage: FoundationCoverage;
}

export interface GenerationDirectivesRequest {
    available_hours_total: number;
    target_node_range: RangeConstraint;
    min_sections: number;
    min_subsections_per_section: number;
    min_lessons_per_subsection: RangeConstraint;
    theory_ratio_target: number;
    project_cadence: string;
    require_prerequisites: boolean;
    require_learning_outcomes: boolean;
}

export interface AIGeneratedRoadmapDB {
    id: string;
    user_id: string;
    profile_id: string;
    title: string;
    description: string | null;
    total_estimated_hours: number;
    sections?: RoadmapSection[]; // NEW: support sections
    phases?: RoadmapPhase[]; // Backward compatibility
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

import type { Node, Edge } from "reactflow";

export interface AIRoadmapNodeFlowData extends RoadmapNodeData {
    id: string;
    phase_id?: string; // Backward compatibility
    section_id: string; // NEW: parent section
    subsection_id?: string; // NEW: parent subsection
    type: NodeType;
    is_hub?: boolean; // NEW: mark hub nodes for special styling
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
    level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
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
