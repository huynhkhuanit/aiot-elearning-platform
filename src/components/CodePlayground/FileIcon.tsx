import {
  getLanguageConfig,
  type LanguageId,
} from "./languages"
import type { IconThemeId } from "./editorThemes"

interface FileIconProps {
  type: LanguageId
  iconTheme?: IconThemeId
  className?: string
}

export function FileIcon({
  type,
  iconTheme = "vscode",
  className = "w-4 h-4",
}: FileIconProps) {
  const language = getLanguageConfig(type)
  const radius =
    iconTheme === "material" ? "rounded-[2px]" : iconTheme === "minimal" ? "" : "rounded"
  const background =
    iconTheme === "minimal"
      ? "transparent"
      : iconTheme === "material"
        ? `${language.iconColor}22`
        : `${language.iconColor}18`

  return (
    <span
      className={`${className} ${radius} inline-flex items-center justify-center text-[9px] font-bold leading-none`}
      style={{
        color: language.iconColor,
        background,
        border:
          iconTheme === "minimal"
            ? "0"
            : `1px solid ${language.iconColor}44`,
      }}
      aria-hidden
    >
      {language.iconText}
    </span>
  )
}
