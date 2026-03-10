"use client";

import {
    Mail,
    MapPin,
    Phone,
    Linkedin,
    Github,
    Globe,
    Camera,
    Plus,
} from "lucide-react";
import type { CVData, CVAction, CVSectionType } from "@/types/cv";
import { CVSectionEditor } from "./CVSectionEditor";
import { EditableField } from "./EditableField";

interface CVDocumentProps {
    data: CVData;
    dispatch: React.Dispatch<CVAction>;
    onFocusSection: (type: CVSectionType) => void;
    activeSectionType: CVSectionType | null;
}

export function CVDocument({
    data,
    dispatch,
    onFocusSection,
    activeSectionType,
}: CVDocumentProps) {
    const { personalInfo, sections, settings } = data;

    return (
        <div
            id="cv-document-canvas"
            className="mx-auto min-h-[1122px] w-[794px] bg-white shadow-2xl"
            style={{
                fontFamily: settings.fontFamily,
                fontSize: `${settings.fontSize}px`,
                color: "#334155",
            }}
        >
            <div className="px-10 py-8">
                {/* ── Header: Personal Info ────────────────────── */}
                <div
                    className="mb-4 flex gap-6 cursor-pointer rounded-lg border-2 border-transparent p-2 transition-colors hover:border-slate-100"
                    onClick={() => onFocusSection("personal-info")}
                >
                    {/* Avatar Upload */}
                    <div className="relative shrink-0 mt-1">
                        {personalInfo.avatarUrl ? (
                            <img
                                src={personalInfo.avatarUrl}
                                alt="Avatar"
                                className="h-32 w-32 object-cover rounded-md border shadow-sm"
                            />
                        ) : (
                            <div className="h-32 w-32 rounded-md border-2 border-dashed border-slate-200 bg-transparent flex flex-col items-center justify-center text-slate-300 transition-colors hover:border-sky-400 hover:text-sky-500 group relative cursor-pointer">
                                <Camera className="size-8 mb-1" />
                                <span className="text-[10px] font-medium text-center px-2">
                                    Nhấn để tải ảnh
                                    <br />
                                    hoặc để trống để dán ảnh thật
                                </span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Tải ảnh lên"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        dispatch({
                                            type: "UPDATE_PERSONAL_INFO",
                                            field: "avatarUrl",
                                            value: ev.target?.result as string,
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <EditableField
                            value={personalInfo.fullName}
                            onChange={(val) =>
                                dispatch({
                                    type: "UPDATE_PERSONAL_INFO",
                                    field: "fullName",
                                    value: val,
                                })
                            }
                            placeholder="HỌ VÀ TÊN"
                            className="block w-full text-4xl font-black uppercase tracking-tight text-slate-900"
                            style={{ color: settings.accentColor }}
                        />
                        <EditableField
                            value={personalInfo.jobTitle}
                            onChange={(val) =>
                                dispatch({
                                    type: "UPDATE_PERSONAL_INFO",
                                    field: "jobTitle",
                                    value: val,
                                })
                            }
                            placeholder="Vị trí ứng tuyển (vd: Fullstack Developer)"
                            className="mt-1 block w-full text-xl font-medium text-slate-600"
                        />

                        {/* Contact Grid */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5 focus-within:text-sky-600">
                                <Phone
                                    className="size-3.5"
                                    style={{ color: settings.accentColor }}
                                />
                                <EditableField
                                    value={personalInfo.phone}
                                    onChange={(val) => {
                                        dispatch({
                                            type: "UPDATE_PERSONAL_INFO",
                                            field: "phone",
                                            value: val,
                                        });
                                    }}
                                    placeholder="Số điện thoại"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 focus-within:text-sky-600">
                                <Mail
                                    className="size-3.5"
                                    style={{ color: settings.accentColor }}
                                />
                                <EditableField
                                    value={personalInfo.email}
                                    onChange={(val) => {
                                        dispatch({
                                            type: "UPDATE_PERSONAL_INFO",
                                            field: "email",
                                            value: val,
                                        });
                                    }}
                                    placeholder="Email"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 focus-within:text-sky-600">
                                <MapPin
                                    className="size-3.5"
                                    style={{ color: settings.accentColor }}
                                />
                                <EditableField
                                    value={personalInfo.address}
                                    onChange={(val) => {
                                        dispatch({
                                            type: "UPDATE_PERSONAL_INFO",
                                            field: "address",
                                            value: val,
                                        });
                                    }}
                                    placeholder="Địa chỉ"
                                />
                            </div>

                            {personalInfo.links?.map((link, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 focus-within:text-sky-600"
                                >
                                    {link.label
                                        .toLowerCase()
                                        .includes("linkedin") ? (
                                        <Linkedin
                                            className="size-3.5"
                                            style={{
                                                color: settings.accentColor,
                                            }}
                                        />
                                    ) : link.label
                                          .toLowerCase()
                                          .includes("github") ? (
                                        <Github
                                            className="size-3.5"
                                            style={{
                                                color: settings.accentColor,
                                            }}
                                        />
                                    ) : (
                                        <Globe
                                            className="size-3.5"
                                            style={{
                                                color: settings.accentColor,
                                            }}
                                        />
                                    )}
                                    <EditableField
                                        value={link.url}
                                        onChange={(val) => {
                                            const newLinks = [
                                                ...(personalInfo.links || []),
                                            ];
                                            newLinks[idx] = {
                                                ...link,
                                                url: val,
                                            };
                                            dispatch({
                                                type: "UPDATE_PERSONAL_INFO",
                                                field: "links",
                                                value: newLinks as any,
                                            });
                                        }}
                                        placeholder={link.label}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Dynamic Sections ─────────────────────────── */}
                <div className="flex flex-col gap-2">
                    {sections
                        .sort((a, b) => a.order - b.order)
                        .filter((s) => s.visible)
                        .map((section) => (
                            <CVSectionEditor
                                key={section.id}
                                section={section}
                                accentColor={settings.accentColor}
                                dispatch={dispatch}
                                isActive={activeSectionType === section.type}
                                onFocus={() => onFocusSection(section.type)}
                            />
                        ))}

                    {/* Add Section Button */}
                    <div className="mt-2 flex justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                dispatch({
                                    type: "ADD_SECTION",
                                    section: {
                                        id: `cv-${Date.now()}`,
                                        type: "custom",
                                        title: "Mục Tùy Chỉnh",
                                        items: [],
                                        order: sections.length + 1,
                                        visible: true,
                                    },
                                });
                            }}
                            className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-500 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                            <Plus className="size-4" />
                            Thêm mục mới
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
