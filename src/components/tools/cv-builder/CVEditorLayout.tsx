"use client";

import { useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import type { CVData, CVAction, CVSectionType } from "@/types/cv";
import { CVToolbar } from "./CVToolbar";
import { CVDocument } from "./CVDocument";
import { CVFieldSuggestionPanel } from "./CVFieldSuggestionPanel";
import { cvId } from "@/lib/cv-templates";

interface CVEditorLayoutProps {
    cvData: CVData;
    dispatch: React.Dispatch<CVAction>;
    onBackToTemplates: () => void;
    onNewCV: () => void;
}

export function CVEditorLayout({
    cvData,
    dispatch,
    onBackToTemplates,
}: CVEditorLayoutProps) {
    const [activeSection, setActiveSection] = useState<CVSectionType | null>(
        null,
    );

    const handleDownloadPDF = async () => {
        const input = document.getElementById("cv-document-canvas");
        if (!input) return;

        try {
            // Add a small delay to ensure fonts/icons are loaded
            await new Promise((r) => setTimeout(r, 100));

            const canvas = await html2canvas(input, {
                scale: 2, // higher resolution
                useCORS: true,
                logging: false,
                windowWidth: input.scrollWidth,
                windowHeight: input.scrollHeight,
            });

            const imgData = canvas.toDataURL("image/jpeg", 1.0);

            // A4 dimensions in mm: 210 x 297
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(
                `CV_${cvData.personalInfo.fullName.replace(/\s+/g, "_") || "Builder"}.pdf`,
            );
        } catch (error) {
            console.error("PDF generation failed", error);
            // In a real app we'd show a toast here
            alert("Lỗi khi tạo PDF. Vui lòng thử lại.");
        }
    };

    const handleApplySuggestion = (suggestion: string) => {
        if (!activeSection) return;

        // Try to update the last focused item in the active section
        // Note: For simplicity in this demo, if the user hits "áp dụng",
        // we might just want to add it as a new item or append to an existing one.
        // Let's create a new item with this suggestion in the current active section.

        const section = cvData.sections.find((s) => s.type === activeSection);
        if (!section) return;

        dispatch({
            type: "ADD_ITEM",
            sectionId: section.id,
            item: {
                id: cvId(),
                label: "AI Generated",
                value: "Nội dung đề xuất",
                richHtml: `<p>${suggestion.replace(/\n/g, "<br/>")}</p>`,
            },
        });
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
            {/* Top Toolbar */}
            <CVToolbar
                settings={cvData.settings}
                onUpdateSettings={(settings) =>
                    dispatch({ type: "UPDATE_SETTINGS", settings })
                }
                onDownloadPDF={handleDownloadPDF}
                onBackToTemplates={onBackToTemplates}
            />

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Center: document viewer */}
                <main className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
                    <div className="mx-auto w-[794px]">
                        {" "}
                        {/* A4 width */}
                        <CVDocument
                            data={cvData}
                            dispatch={dispatch}
                            activeSectionType={activeSection}
                            onFocusSection={setActiveSection}
                        />
                    </div>
                </main>

                {/* Right Sidebar: AI Suggestions */}
                <aside className="w-80 flex-shrink-0 overflow-hidden border-l border-slate-200 bg-white">
                    <CVFieldSuggestionPanel
                        activeSection={activeSection}
                        currentRole={cvData.personalInfo.jobTitle}
                        currentContent=""
                        onApplySuggestion={handleApplySuggestion}
                    />
                </aside>
            </div>
        </div>
    );
}

// Add global styles for scrollbar
if (typeof document !== "undefined") {
    const style = document.createElement("style");
    style.innerHTML = `
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
        }
    `;
    document.head.appendChild(style);
}
