/* ══════════════════════════════════════════════════════════════
   CV Builder – State Reducer
   ══════════════════════════════════════════════════════════════ */

import type { CVAction, CVData } from "@/types/cv";

export function cvReducer(state: CVData, action: CVAction): CVData {
    const now = new Date().toISOString();

    switch (action.type) {
        case "SET_TEMPLATE":
            return { ...action.data, updatedAt: now };

        case "UPDATE_PERSONAL_INFO":
            return {
                ...state,
                personalInfo: {
                    ...state.personalInfo,
                    [action.field]: action.value,
                },
                updatedAt: now,
            };

        case "UPDATE_SECTION_TITLE":
            return {
                ...state,
                sections: state.sections.map((s) =>
                    s.id === action.sectionId
                        ? { ...s, title: action.title }
                        : s,
                ),
                updatedAt: now,
            };

        case "UPDATE_ITEM":
            return {
                ...state,
                sections: state.sections.map((s) =>
                    s.id === action.sectionId
                        ? {
                              ...s,
                              items: s.items.map((item) =>
                                  item.id === action.itemId
                                      ? { ...item, ...action.updates }
                                      : item,
                              ),
                          }
                        : s,
                ),
                updatedAt: now,
            };

        case "ADD_ITEM":
            return {
                ...state,
                sections: state.sections.map((s) =>
                    s.id === action.sectionId
                        ? { ...s, items: [...s.items, action.item] }
                        : s,
                ),
                updatedAt: now,
            };

        case "REMOVE_ITEM":
            return {
                ...state,
                sections: state.sections.map((s) =>
                    s.id === action.sectionId
                        ? {
                              ...s,
                              items: s.items.filter(
                                  (item) => item.id !== action.itemId,
                              ),
                          }
                        : s,
                ),
                updatedAt: now,
            };

        case "REORDER_SECTION": {
            const sections = [...state.sections].sort(
                (a, b) => a.order - b.order,
            );
            const idx = sections.findIndex((s) => s.id === action.sectionId);
            if (idx < 0) return state;

            const targetIdx = action.direction === "up" ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= sections.length) return state;

            // Swap orders
            const currentOrder = sections[idx].order;
            const targetOrder = sections[targetIdx].order;
            sections[idx] = { ...sections[idx], order: targetOrder };
            sections[targetIdx] = {
                ...sections[targetIdx],
                order: currentOrder,
            };

            return { ...state, sections, updatedAt: now };
        }

        case "ADD_SECTION":
            return {
                ...state,
                sections: [...state.sections, action.section],
                updatedAt: now,
            };

        case "REMOVE_SECTION":
            return {
                ...state,
                sections: state.sections.filter(
                    (s) => s.id !== action.sectionId,
                ),
                updatedAt: now,
            };

        case "TOGGLE_SECTION_VISIBILITY":
            return {
                ...state,
                sections: state.sections.map((s) =>
                    s.id === action.sectionId
                        ? { ...s, visible: !s.visible }
                        : s,
                ),
                updatedAt: now,
            };

        case "UPDATE_SETTINGS":
            return {
                ...state,
                settings: { ...state.settings, ...action.settings },
                updatedAt: now,
            };

        case "SET_AVATAR":
            return {
                ...state,
                personalInfo: {
                    ...state.personalInfo,
                    avatarUrl: action.url,
                },
                updatedAt: now,
            };

        case "LOAD_FROM_JSON":
            return { ...action.data, updatedAt: now };

        default:
            return state;
    }
}

/* ── LocalStorage persistence ─────────────────────────────── */

const STORAGE_KEY = "codesense-cv-builder-data";

export function saveCVToStorage(data: CVData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        console.warn("[CV Builder] Failed to save to localStorage");
    }
}

export function loadCVFromStorage(): CVData | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as CVData;
    } catch {
        return null;
    }
}

export function clearCVStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // noop
    }
}
