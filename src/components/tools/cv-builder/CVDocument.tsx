"use client";

import { Mail, MapPin, Phone, Linkedin, Github, Globe } from "lucide-react";
import type { CVData, CVAction, CVSectionType } from "@/types/cv";
import { CVSectionEditor } from "./CVSectionEditor";

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

    // Auto-expand/shrink input
    const autoGrow = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.style.width = "0px";
        e.target.style.width = Math.max(e.target.scrollWidth, 50) + "px";
    };

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
            <div className="p-12">
                {/* ── Header: Personal Info ────────────────────── */}
                <div
                    className="mb-8 cursor-pointer rounded-lg border-2 border-transparent p-2 transition-colors hover:border-slate-200"
                    onClick={() => onFocusSection("personal-info")}
                >
                    <input
                        type="text"
                        value={personalInfo.fullName}
                        onChange={(e) =>
                            dispatch({
                                type: "UPDATE_PERSONAL_INFO",
                                field: "fullName",
                                value: e.target.value,
                            })
                        }
                        placeholder="HỌ VÀ TÊN"
                        className="w-full bg-transparent text-4xl font-black uppercase tracking-tight text-slate-900 outline-none focus:ring-2 focus:ring-sky-400"
                        style={{ color: settings.accentColor }}
                    />
                    <input
                        type="text"
                        value={personalInfo.jobTitle}
                        onChange={(e) =>
                            dispatch({
                                type: "UPDATE_PERSONAL_INFO",
                                field: "jobTitle",
                                value: e.target.value,
                            })
                        }
                        placeholder="Vị trí ứng tuyển (vd: Fullstack Developer)"
                        className="mt-1 w-full bg-transparent text-xl font-medium text-slate-600 outline-none focus:ring-2 focus:ring-sky-400"
                    />

                    {/* Contact Grid */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 border-b border-transparent hover:border-slate-300 focus-within:border-sky-400">
                            <Phone
                                className="size-3.5"
                                style={{ color: settings.accentColor }}
                            />
                            <input
                                type="text"
                                value={personalInfo.phone}
                                onChange={(e) => {
                                    dispatch({
                                        type: "UPDATE_PERSONAL_INFO",
                                        field: "phone",
                                        value: e.target.value,
                                    });
                                    autoGrow(e);
                                }}
                                onInput={autoGrow}
                                placeholder="Số điện thoại"
                                className="bg-transparent outline-none w-[120px]"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 border-b border-transparent hover:border-slate-300 focus-within:border-sky-400">
                            <Mail
                                className="size-3.5"
                                style={{ color: settings.accentColor }}
                            />
                            <input
                                type="text"
                                value={personalInfo.email}
                                onChange={(e) => {
                                    dispatch({
                                        type: "UPDATE_PERSONAL_INFO",
                                        field: "email",
                                        value: e.target.value,
                                    });
                                    autoGrow(e);
                                }}
                                onInput={autoGrow}
                                placeholder="Email"
                                className="bg-transparent outline-none w-[180px]"
                            />
                        </div>
                        <div className="flex items-center gap-1.5 border-b border-transparent hover:border-slate-300 focus-within:border-sky-400">
                            <MapPin
                                className="size-3.5"
                                style={{ color: settings.accentColor }}
                            />
                            <input
                                type="text"
                                value={personalInfo.address}
                                onChange={(e) => {
                                    dispatch({
                                        type: "UPDATE_PERSONAL_INFO",
                                        field: "address",
                                        value: e.target.value,
                                    });
                                    autoGrow(e);
                                }}
                                onInput={autoGrow}
                                placeholder="Địa chỉ"
                                className="bg-transparent outline-none w-[150px]"
                            />
                        </div>

                        {personalInfo.links?.map((link, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5 border-b border-transparent hover:border-slate-300 focus-within:border-sky-400"
                            >
                                {link.label
                                    .toLowerCase()
                                    .includes("linkedin") ? (
                                    <Linkedin
                                        className="size-3.5"
                                        style={{ color: settings.accentColor }}
                                    />
                                ) : link.label
                                      .toLowerCase()
                                      .includes("github") ? (
                                    <Github
                                        className="size-3.5"
                                        style={{ color: settings.accentColor }}
                                    />
                                ) : (
                                    <Globe
                                        className="size-3.5"
                                        style={{ color: settings.accentColor }}
                                    />
                                )}
                                <input
                                    type="text"
                                    value={link.url}
                                    onChange={(e) => {
                                        const newLinks = [
                                            ...(personalInfo.links || []),
                                        ];
                                        newLinks[idx] = {
                                            ...link,
                                            url: e.target.value,
                                        };
                                        dispatch({
                                            type: "UPDATE_PERSONAL_INFO",
                                            field: "links",
                                            value: newLinks as any,
                                        });
                                        autoGrow(e);
                                    }}
                                    onInput={autoGrow}
                                    placeholder={link.label}
                                    className="bg-transparent outline-none w-[180px]"
                                />
                            </div>
                        ))}
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
                </div>
            </div>
        </div>
    );
}
