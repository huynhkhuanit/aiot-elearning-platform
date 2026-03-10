/* ══════════════════════════════════════════════════════════════
   CV Builder – Core Data Types
   ══════════════════════════════════════════════════════════════ */

/* ── Section Types ─────────────────────────────────────────── */

export type CVSectionType =
    | "personal-info"
    | "overview"
    | "experience"
    | "education"
    | "skills"
    | "projects"
    | "certifications"
    | "languages"
    | "references"
    | "awards"
    | "activities"
    | "custom";

/** Label map for Vietnamese UI display */
export const CV_SECTION_LABELS: Record<CVSectionType, string> = {
    "personal-info": "Thông tin cá nhân",
    overview: "Mục tiêu nghề nghiệp",
    experience: "Kinh nghiệm làm việc",
    education: "Học vấn",
    skills: "Kỹ năng",
    projects: "Dự án",
    certifications: "Chứng chỉ",
    languages: "Ngôn ngữ",
    references: "Người tham chiếu",
    awards: "Giải thưởng",
    activities: "Hoạt động",
    custom: "Mục tùy chỉnh",
};

/* ── Content Item (single editable field) ──────────────────── */

export interface CVContentItem {
    /** Unique identifier */
    id: string;
    /** Display label (e.g. "Họ tên", "Email") */
    label: string;
    /** Plain text value */
    value: string;
    /** Rich-text HTML (for sections that support formatting) */
    richHtml?: string;
    /** Optional sub-items (e.g. bullet points in experience) */
    bullets?: string[];
    /** Metadata — period, company, location, etc. */
    meta?: Record<string, string>;
}

/* ── CV Section ────────────────────────────────────────────── */

export interface CVSection {
    /** Unique identifier */
    id: string;
    /** Section type determines editing UI + suggestion context */
    type: CVSectionType;
    /** Display title (defaults to CV_SECTION_LABELS[type]) */
    title: string;
    /** Ordered list of content items within this section */
    items: CVContentItem[];
    /** Sort order (lower = higher in the CV) */
    order: number;
    /** Whether section is visible in the final CV */
    visible: boolean;
}

/* ── Personal Info (top of CV) ─────────────────────────────── */

export interface CVPersonalInfo {
    fullName: string;
    jobTitle: string;
    phone: string;
    email: string;
    address: string;
    birthDate?: string;
    avatarUrl?: string;
    /** Optional social/portfolio links */
    links?: Array<{ label: string; url: string }>;
}

/* ── Complete CV Data Model ────────────────────────────────── */

export interface CVData {
    /** Which template is applied */
    templateId: string;
    /** Personal header information */
    personalInfo: CVPersonalInfo;
    /** Ordered sections (experience, education, etc.) */
    sections: CVSection[];
    /** User preferences */
    settings: CVSettings;
    /** Timestamps */
    createdAt: string;
    updatedAt: string;
}

export interface CVSettings {
    /** Font family name */
    fontFamily: string;
    /** Accent color hex (for section headings) */
    accentColor: string;
    /** Font size base in px */
    fontSize: number;
}

/* ── Template Definition ───────────────────────────────────── */

export type CVTemplateCategory =
    | "all"
    | "it-developer"
    | "marketing"
    | "business"
    | "design"
    | "fresher";

export interface CVTemplate {
    id: string;
    name: string;
    /** Short description */
    description: string;
    /** Category tag for filtering */
    category: CVTemplateCategory;
    /** Style tag shown on card (e.g. "ATS-friendly") */
    styleTag: string;
    /** Accent color hex */
    accentColor: string;
    /** Thumbnail image path */
    thumbnail: string;
    /** Default sections included with this template */
    defaultSections: CVSectionType[];
    /** Default font family */
    defaultFont: string;
}

/* ── AI Field Suggestion ───────────────────────────────────── */

export interface CVFieldSuggestion {
    /** Which section type this suggestion is for */
    sectionType: CVSectionType;
    /** The suggested content text */
    suggestion: string;
    /** Source: "preset" for built-in, "ai" for Ollama-generated */
    source: "preset" | "ai";
}

export interface CVSuggestionRequest {
    sectionType: CVSectionType;
    currentContent: string;
    role?: string;
}

export interface CVSuggestionResponse {
    suggestion: string;
    source: "preset" | "ai";
}

/* ── CV Editor State Actions ───────────────────────────────── */

export type CVAction =
    | { type: "SET_TEMPLATE"; templateId: string; data: CVData }
    | {
          type: "UPDATE_PERSONAL_INFO";
          field: keyof CVPersonalInfo;
          value: string;
      }
    | { type: "UPDATE_SECTION_TITLE"; sectionId: string; title: string }
    | {
          type: "UPDATE_ITEM";
          sectionId: string;
          itemId: string;
          updates: Partial<CVContentItem>;
      }
    | { type: "ADD_ITEM"; sectionId: string; item: CVContentItem }
    | { type: "REMOVE_ITEM"; sectionId: string; itemId: string }
    | { type: "REORDER_SECTION"; sectionId: string; direction: "up" | "down" }
    | { type: "ADD_SECTION"; section: CVSection }
    | { type: "REMOVE_SECTION"; sectionId: string }
    | { type: "TOGGLE_SECTION_VISIBILITY"; sectionId: string }
    | { type: "UPDATE_SETTINGS"; settings: Partial<CVSettings> }
    | { type: "SET_AVATAR"; url: string }
    | { type: "LOAD_FROM_JSON"; data: CVData };
