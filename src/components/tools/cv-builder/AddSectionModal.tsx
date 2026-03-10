import {
    X,
    User,
    BookOpen,
    Target,
    Briefcase,
    GraduationCap,
    Wrench,
    Languages,
    Puzzle,
    FileBadge,
    Trophy,
    BarChart,
    List,
} from "lucide-react";
import { CVSectionType, CV_SECTION_LABELS } from "@/types/cv";
import { cvId } from "@/lib/cv-templates";

interface AddSectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSection: (section: any) => void;
    currentSections: any[];
}

export function AddSectionModal({
    isOpen,
    onClose,
    onAddSection,
    currentSections,
}: AddSectionModalProps) {
    if (!isOpen) return null;

    const sections = [
        { type: "personal-info", icon: User, label: "Thông tin liên hệ" },
        { type: "overview", icon: Target, label: "Mục tiêu nghề nghiệp" },
        { type: "experience", icon: Briefcase, label: "Kinh nghiệm làm việc" },
        { type: "education", icon: GraduationCap, label: "Trình độ học vấn" },
        { type: "skills", icon: Wrench, label: "Kiến thức & Kỹ năng" },
        { type: "languages", icon: Languages, label: "Ngôn ngữ" },
        { type: "projects", icon: Puzzle, label: "Dự án đã làm" },
        { type: "certifications", icon: FileBadge, label: "Chứng chỉ" },
        { type: "awards", icon: Trophy, label: "Giải thưởng" },
        { type: "activities", icon: BarChart, label: "Hoạt động" },
        { type: "references", icon: BookOpen, label: "Người tham chiếu" },
        { type: "custom", icon: List, label: "Tùy chỉnh" },
    ];

    const handleAdd = (type: CVSectionType, label: string) => {
        const newSection = {
            id: cvId(),
            type,
            title:
                type === "custom"
                    ? "Mục tùy chỉnh"
                    : CV_SECTION_LABELS[type] || label,
            items: [],
            order: currentSections.length + 1,
            visible: true,
        };
        onAddSection(newSection);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl rounded-xl bg-white p-8 shadow-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-slate-800">
                        Thêm thành phần mới
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-4 gap-4">
                    {sections.map(({ type, icon: Icon, label }) => {
                        const isAdded = currentSections.some(
                            (s) => s.type === type && type !== "custom",
                        );
                        return (
                            <button
                                key={type}
                                onClick={() =>
                                    handleAdd(type as CVSectionType, label)
                                }
                                disabled={isAdded}
                                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 p-6 transition-all ${
                                    isAdded
                                        ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                                        : "border-transparent bg-slate-50 hover:bg-white hover:border-sky-200 hover:shadow-md cursor-pointer"
                                }`}
                            >
                                <div className="rounded-full bg-white p-3 shadow-sm text-slate-400">
                                    <Icon className="size-6" />
                                </div>
                                <span className="text-sm font-medium text-slate-600 text-center leading-tight">
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
