"use client";

/* ══════════════════════════════════════════════════════════════
   CV Builder – Main Orchestrator Component
   ══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useReducer, useState } from "react";

import type { CVData, CVSectionType } from "@/types/cv";
import { createCVFromTemplate, CV_TEMPLATES } from "@/lib/cv-templates";

import { cvReducer, loadCVFromStorage, saveCVToStorage } from "./cv-reducer";
import { CVTemplateSelector } from "./CVTemplateSelector";
import { CVEditorLayout } from "./CVEditorLayout";

export type CVBuilderView = "templates" | "editor";

export function CVBuilder() {
    const [view, setView] = useState<CVBuilderView>("templates");
    const [cvData, dispatch] = useReducer(cvReducer, null as unknown as CVData);
    const [isLoaded, setIsLoaded] = useState(false);

    /* ── Load saved CV from localStorage on mount ─────────── */
    useEffect(() => {
        const saved = loadCVFromStorage();
        if (saved) {
            dispatch({ type: "LOAD_FROM_JSON", data: saved });
            setView("editor");
        }
        setIsLoaded(true);
    }, []);

    /* ── Save to localStorage on every change ─────────────── */
    useEffect(() => {
        if (cvData && isLoaded) {
            saveCVToStorage(cvData);
        }
    }, [cvData, isLoaded]);

    /* ── Handlers ─────────────────────────────────────────── */
    const handleSelectTemplate = useCallback((templateId: string) => {
        const template = CV_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;
        const data = createCVFromTemplate(template);
        dispatch({ type: "SET_TEMPLATE", templateId, data });
        setView("editor");
    }, []);

    const handleBackToTemplates = useCallback(() => {
        setView("templates");
    }, []);

    const handleNewCV = useCallback(() => {
        setView("templates");
    }, []);

    /* ── Render ────────────────────────────────────────────── */
    if (!isLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3 text-slate-500">
                    <div className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                    Đang tải...
                </div>
            </div>
        );
    }

    if (view === "templates" || !cvData) {
        return <CVTemplateSelector onSelect={handleSelectTemplate} />;
    }

    return (
        <CVEditorLayout
            cvData={cvData}
            dispatch={dispatch}
            onBackToTemplates={handleBackToTemplates}
            onNewCV={handleNewCV}
        />
    );
}
