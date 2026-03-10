"use client";

import {
    GripVertical,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import type { CVContentItem, CVSection, CVAction } from "@/types/cv";
import { RichTextEditor } from "./RichTextEditor";
import { cvId } from "@/lib/cv-templates";

interface CVSectionEditorProps {
    section: CVSection;
    accentColor: string;
    onFocus: () => void;
    dispatch: React.Dispatch<CVAction>;
    isActive: boolean;
}

export function CVSectionEditor({
    section,
    accentColor,
    onFocus,
    dispatch,
    isActive,
}: CVSectionEditorProps) {
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
            className={`group relative mb-6 rounded-lg border-2 p-4 transition-colors ${
                isActive
                    ? "border-sky-400 bg-sky-50/30"
                    : "border-transparent hover:border-slate-200"
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
                className="mb-4 flex items-center gap-2 border-b-2 pb-1"
                style={{ borderColor: accentColor }}
            >
                <div className="cursor-move text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="size-5" />
                </div>
                <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                        dispatch({
                            type: "UPDATE_SECTION_TITLE",
                            sectionId: section.id,
                            title: e.target.value,
                        })
                    }
                    className="flex-1 bg-transparent text-xl font-bold uppercase tracking-wider outline-none"
                    style={{ color: accentColor }}
                />
            </div>

            {/* Items */}
            <div className="space-y-4">
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
                            className="absolute -left-3 top-1 hidden -translate-x-full rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 group-hover/item:block"
                            title="Xóa ý này"
                        >
                            <Trash2 className="size-3.5" />
                        </button>

                        {/* Top row: Title + Date/Location */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <input
                                type="text"
                                value={item.value}
                                onChange={(e) =>
                                    dispatch({
                                        type: "UPDATE_ITEM",
                                        sectionId: section.id,
                                        itemId: item.id,
                                        updates: { value: e.target.value },
                                    })
                                }
                                placeholder="Tên công ty / Trường học / Vị trí"
                                className="flex-1 bg-transparent font-bold text-slate-800 outline-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -ml-1 rounded"
                            />
                            {item.meta && (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    {item.meta.period !== undefined && (
                                        <input
                                            type="text"
                                            value={item.meta.period}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: "UPDATE_ITEM",
                                                    sectionId: section.id,
                                                    itemId: item.id,
                                                    updates: {
                                                        meta: {
                                                            ...item.meta,
                                                            period: e.target
                                                                .value,
                                                        },
                                                    },
                                                })
                                            }
                                            placeholder="Thời gian"
                                            className="w-[120px] text-right bg-transparent outline-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -mr-1 rounded"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Middle row: Subtitle/Meta */}
                        {item.meta && item.meta.company !== undefined && (
                            <div className="text-slate-600 mb-1">
                                <input
                                    type="text"
                                    value={item.meta.company}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "UPDATE_ITEM",
                                            sectionId: section.id,
                                            itemId: item.id,
                                            updates: {
                                                meta: {
                                                    ...item.meta,
                                                    company: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                    placeholder="Tên công ty"
                                    className="w-full bg-transparent italic outline-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -ml-1 rounded"
                                />
                            </div>
                        )}
                        {item.meta && item.meta.degree !== undefined && (
                            <div className="text-slate-600 mb-1">
                                <input
                                    type="text"
                                    value={item.meta.degree}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "UPDATE_ITEM",
                                            sectionId: section.id,
                                            itemId: item.id,
                                            updates: {
                                                meta: {
                                                    ...item.meta,
                                                    degree: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                    placeholder="Loại bằng cấp"
                                    className="w-full bg-transparent italic outline-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -ml-1 rounded"
                                />
                            </div>
                        )}
                        {item.meta && item.meta.role !== undefined && (
                            <div className="text-slate-600 mb-1">
                                <input
                                    type="text"
                                    value={item.meta.role}
                                    onChange={(e) =>
                                        dispatch({
                                            type: "UPDATE_ITEM",
                                            sectionId: section.id,
                                            itemId: item.id,
                                            updates: {
                                                meta: {
                                                    ...item.meta,
                                                    role: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                    placeholder="Vai trò"
                                    className="w-full bg-transparent font-medium outline-none hover:bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-sky-400 p-1 -ml-1 rounded"
                                />
                            </div>
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
            <button
                onClick={handleAddItem}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-2 text-sm text-slate-500 opacity-0 transition-all hover:border-sky-400 hover:text-sky-600 group-hover:opacity-100"
            >
                <Plus className="size-4" />
                Thêm thông tin
            </button>
        </div>
    );
}
