"use client";

import {
    GripVertical,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Briefcase,
    GraduationCap,
    Wrench,
    FolderKanban,
    Award,
    Languages,
    Heart,
    Trophy,
    Users,
} from "lucide-react";
import type {
    CVContentItem,
    CVSection,
    CVAction,
    CVSectionType,
} from "@/types/cv";
import { RichTextEditor } from "./RichTextEditor";
import { cvId } from "@/lib/cv-templates";
import { EditableField } from "./EditableField";

interface CVSectionEditorProps {
    section: CVSection;
    accentColor: string;
    onFocus: () => void;
    dispatch: React.Dispatch<CVAction>;
    isActive: boolean;
}

const SECTION_ICONS: Record<CVSectionType, React.ElementType | null> = {
    "personal-info": null,
    overview: null,
    experience: Briefcase,
    education: GraduationCap,
    skills: Wrench,
    projects: FolderKanban,
    certifications: Award,
    languages: Languages,
    references: Heart,
    awards: Trophy,
    activities: Users,
    custom: null,
};

export function CVSectionEditor({
    section,
    accentColor,
    onFocus,
    dispatch,
    isActive,
}: CVSectionEditorProps) {
    const Icon = SECTION_ICONS[section.type];

    // Add a new empty item
    const handleAddItem = () => {
        const newItem: CVContentItem = {
            id: cvId(),
            label: "Mục mới",
            value: "Tiêu đề",
            richHtml: "<p>Mô tả chi tiết tại đây...</p>",
            meta: {},
        };
        dispatch({ type: "ADD_ITEM", sectionId: section.id, item: newItem });
    };

    return (
        <div
            className={`group relative rounded-lg border-2 px-3 py-1.5 transition-colors ${
                isActive
                    ? "border-sky-400 bg-sky-50/20"
                    : "border-transparent hover:border-slate-100"
            }`}
            onClick={onFocus}
        >
            {/* Hover Actions (Reorder/Delete Section) */}
            <div className="absolute right-0 top-0 hidden -translate-y-1/2 translate-x-1/2 gap-1 rounded border border-slate-200 bg-white p-1 shadow-sm group-hover:flex">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                            type: "REORDER_SECTION",
                            sectionId: section.id,
                            direction: "up",
                        });
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Di chuyển lên"
                >
                    <ChevronUp className="size-4" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                            type: "REORDER_SECTION",
                            sectionId: section.id,
                            direction: "down",
                        });
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Di chuyển xuống"
                >
                    <ChevronDown className="size-4" />
                </button>
                <div className="mx-1 w-px bg-slate-200" />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        dispatch({
                            type: "REMOVE_SECTION",
                            sectionId: section.id,
                        });
                    }}
                    className="rounded p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Xóa mục này"
                >
                    <Trash2 className="size-4" />
                </button>
            </div>

            {/* Section Title */}
            <div
                className="mb-2 flex items-center gap-2 border-b-2 pb-1 relative"
                style={{ borderColor: accentColor }}
            >
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 cursor-move text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-5" />
                </div>
                {Icon && (
                    <Icon className="size-5" style={{ color: accentColor }} />
                )}
                <EditableField
                    value={section.title}
                    onChange={(val) =>
                        dispatch({
                            type: "UPDATE_SECTION_TITLE",
                            sectionId: section.id,
                            title: val,
                        })
                    }
                    className="flex-1 text-xl font-bold uppercase tracking-wider"
                    style={{ color: accentColor }}
                />
            </div>

            {/* Items */}
            <div className="space-y-2">
                {section.items.map((item) => (
                    <div key={item.id} className="relative group/item">
                        {/* Remove item button */}
                        <button
                            onClick={() =>
                                dispatch({
                                    type: "REMOVE_ITEM",
                                    sectionId: section.id,
                                    itemId: item.id,
                                })
                            }
                            className="absolute -left-[38px] top-1 hidden rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 group-hover/item:flex group-focus-within/item:flex items-center justify-center transition-colors z-10"
                            title="Xóa ý này"
                        >
                            <Trash2 className="size-4" />
                        </button>

                        {/* Top row: Title + Date/Location */}
                        <div className="flex flex-nowrap items-center justify-between gap-x-4">
                            <EditableField
                                value={item.value}
                                onChange={(val) =>
                                    dispatch({
                                        type: "UPDATE_ITEM",
                                        sectionId: section.id,
                                        itemId: item.id,
                                        updates: { value: val },
                                    })
                                }
                                placeholder="Tên công ty / Trường học / Vị trí"
                                className="flex-1 font-bold text-slate-800"
                            />
                            {item.meta && (
                                <div className="flex items-center justify-end shrink-0 text-sm text-slate-500">
                                    {item.meta.period !== undefined && (
                                        <EditableField
                                            value={item.meta.period}
                                            onChange={(val) =>
                                                dispatch({
                                                    type: "UPDATE_ITEM",
                                                    sectionId: section.id,
                                                    itemId: item.id,
                                                    updates: {
                                                        meta: {
                                                            ...item.meta,
                                                            period: val,
                                                        },
                                                    },
                                                })
                                            }
                                            placeholder="Thời gian"
                                            className="text-right whitespace-nowrap min-w-[100px]"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Middle row: Subtitle/Meta */}
                        {item.meta && item.meta.company !== undefined && (
                            <EditableField
                                value={item.meta.company}
                                onChange={(val) =>
                                    dispatch({
                                        type: "UPDATE_ITEM",
                                        sectionId: section.id,
                                        itemId: item.id,
                                        updates: {
                                            meta: {
                                                ...item.meta,
                                                company: val,
                                            },
                                        },
                                    })
                                }
                                placeholder="Tên công ty"
                                className="block w-full italic text-slate-600"
                            />
                        )}
                        {item.meta && item.meta.degree !== undefined && (
                            <EditableField
                                value={item.meta.degree}
                                onChange={(val) =>
                                    dispatch({
                                        type: "UPDATE_ITEM",
                                        sectionId: section.id,
                                        itemId: item.id,
                                        updates: {
                                            meta: {
                                                ...item.meta,
                                                degree: val,
                                            },
                                        },
                                    })
                                }
                                placeholder="Loại bằng cấp"
                                className="block w-full italic text-slate-600"
                            />
                        )}
                        {item.meta && item.meta.role !== undefined && (
                            <EditableField
                                value={item.meta.role}
                                onChange={(val) =>
                                    dispatch({
                                        type: "UPDATE_ITEM",
                                        sectionId: section.id,
                                        itemId: item.id,
                                        updates: {
                                            meta: {
                                                ...item.meta,
                                                role: val,
                                            },
                                        },
                                    })
                                }
                                placeholder="Vai trò"
                                className="block w-full font-medium text-slate-600"
                            />
                        )}

                        {/* Rich Text Editor */}
                        {(item.richHtml !== undefined ||
                            (item.bullets && item.bullets.length > 0)) && (
                            <div className="mt-1 text-slate-700">
                                <RichTextEditor
                                    value={
                                        item.richHtml !== undefined
                                            ? item.richHtml
                                            : item.bullets
                                              ? `<ul>${item.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`
                                              : ""
                                    }
                                    onChange={(html) =>
                                        dispatch({
                                            type: "UPDATE_ITEM",
                                            sectionId: section.id,
                                            itemId: item.id,
                                            updates: {
                                                richHtml: html,
                                                bullets: [],
                                            },
                                        })
                                    }
                                    placeholder="Mô tả chi tiết tại đây..."
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Item Button */}
            <div className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    onClick={handleAddItem}
                    className="flex items-center justify-center gap-1.5 rounded-full border shadow shadow-slate-100 bg-white px-3 py-1 text-xs font-medium text-slate-500 hover:border-sky-400 border-slate-200 hover:text-sky-600"
                >
                    <Plus className="size-3.5" />
                    Thêm thông tin
                </button>
            </div>
        </div>
    );
}
