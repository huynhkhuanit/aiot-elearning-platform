export type EditorThemeId = "dark-plus" | "light-plus" | "monokai";
export type IconThemeId = "vscode" | "material" | "minimal";

export interface EditorThemeOption {
    id: EditorThemeId;
    label: string;
    monacoTheme: string;
    colorMode: "light" | "dark";
}

export interface IconThemeOption {
    id: IconThemeId;
    label: string;
}

export const DEFAULT_EDITOR_THEME_ID: EditorThemeId = "dark-plus";
export const DEFAULT_ICON_THEME_ID: IconThemeId = "vscode";

export const EDITOR_THEME_OPTIONS: EditorThemeOption[] = [
    {
        id: "dark-plus",
        label: "Dark+",
        monacoTheme: "codeplayground-dark",
        colorMode: "dark",
    },
    {
        id: "light-plus",
        label: "Light+",
        monacoTheme: "codeplayground-light",
        colorMode: "light",
    },
    {
        id: "monokai",
        label: "Monokai",
        monacoTheme: "codeplayground-monokai",
        colorMode: "dark",
    },
];

export const ICON_THEME_OPTIONS: IconThemeOption[] = [
    { id: "vscode", label: "VS Code" },
    { id: "material", label: "Material" },
    { id: "minimal", label: "Minimal" },
];

const EDITOR_THEME_IDS = new Set(
    EDITOR_THEME_OPTIONS.map((theme) => theme.id),
);
const ICON_THEME_IDS = new Set(ICON_THEME_OPTIONS.map((theme) => theme.id));

export function normalizeEditorThemeId(value: unknown): EditorThemeId {
    return typeof value === "string" &&
        EDITOR_THEME_IDS.has(value as EditorThemeId)
        ? (value as EditorThemeId)
        : DEFAULT_EDITOR_THEME_ID;
}

export function normalizeIconThemeId(value: unknown): IconThemeId {
    return typeof value === "string" && ICON_THEME_IDS.has(value as IconThemeId)
        ? (value as IconThemeId)
        : DEFAULT_ICON_THEME_ID;
}

export function getEditorThemeOption(
    themeId: EditorThemeId,
): EditorThemeOption {
    return (
        EDITOR_THEME_OPTIONS.find((theme) => theme.id === themeId) ??
        EDITOR_THEME_OPTIONS[0]
    );
}
