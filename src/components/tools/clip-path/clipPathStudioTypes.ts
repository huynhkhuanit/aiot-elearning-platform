import type { PresetCategoryId } from "./clipPathData";

export type PreviewMode = "hero" | "card" | "media";
export type CodeFormat = "css" | "tailwind" | "jsx" | "svg";
export type FilterCategory = PresetCategoryId | "all";
export type CopyState = CodeFormat | "polygon" | "svg-path" | null;
