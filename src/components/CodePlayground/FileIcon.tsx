// VSCode-like File Icons for different languages

import type { LanguageType } from "./types"

interface FileIconProps {
  type: LanguageType
  className?: string
}

export function FileIcon({ type, className = "w-4 h-4" }: FileIconProps) {
  switch (type) {
    case "html":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.902 27.201L3.655 2h24.69l-2.25 25.197L15.985 30L5.902 27.201z" fill="#E44D26"/>
          <path d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z" fill="#F16529"/>
          <path d="M16 13.407h4.09l.282-3.165H16V7.151h7.75l-.074.83-.759 8.517H16v-3.091z" fill="#EBEBEB"/>
          <path d="M16 21.434l-.014.004-3.442-.929-.22-2.465H9.221l.433 4.852 6.332 1.758.014-.004v-3.216z" fill="#EBEBEB"/>
          <path d="M19.82 16.498l-.372 4.166-3.434.927v3.216l6.318-1.751.046-.522.537-6.036h-3.095z" fill="#FFF"/>
          <path d="M16.003 13.407v3.091h-3.399l-.199-2.232-.045-.83-.074-.829h3.717z" fill="#FFF"/>
        </svg>
      )
    case "css":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30L5.902 27.201z" fill="#1572B6"/>
          <path d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z" fill="#33A9DC"/>
          <path d="M16 13.191h4.09l.282-3.165H16V6.935h7.75l-.074.829-.759 8.518H16v-3.091z" fill="#FFF"/>
          <path d="M16.019 21.218l-.014.004-3.442-.93-.22-2.465H9.24l.433 4.853 6.331 1.758.015-.004v-3.216z" fill="#EBEBEB"/>
          <path d="M19.827 16.151l-.372 4.139-3.426.925v3.216l6.292-1.743.046-.522.726-8.015h-7.749v3h4.483z" fill="#FFF"/>
          <path d="M16.011 6.935v3.091h-7.611l-.062-.695-.141-1.567-.074-.829h7.888z" fill="#EBEBEB"/>
          <path d="M16 13.191v3.091H9.567l-.062-.695-.141-1.567-.074-.829H16z" fill="#EBEBEB"/>
        </svg>
      )
    case "javascript":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="2" fill="#F7DF1E"/>
          <path d="M20.83 23.371c.443.737 1.021 1.278 2.042 1.278.857 0 1.401-.428 1.401-1.021 0-.709-.561-0.96-1.501-1.373l-.515-.221c-1.489-.634-2.478-1.429-2.478-3.109 0-1.547 1.178-2.726 3.021-2.726 1.312 0 2.255.457 2.933 1.655l-1.606.031c-.354-.634-.737-.884-1.327-.884-.604 0-.987.383-.987.884 0 .619.383.87 1.268 1.254l.515.221c1.753.751 2.743 1.517 2.743 3.238 0 1.855-1.458 2.876-3.415 2.876-1.914 0-3.151-.912-3.756-2.109l1.662-.994zM11.539 23.519c.325.576.619 1.062 1.327 1.062.678 0 1.105-.265 1.105-1.295v-7.003h2.042v7.042c0 2.134-1.25 3.107-3.074 3.107-1.647 0-2.602-.853-3.091-1.879l1.691-1.034z" fill="#000"/>
        </svg>
      )
    case "cpp":
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L3 9v14l13 7 13-7V9L16 2z" fill="#00599C"/>
          <path d="M16 2v28l13-7V9L16 2z" fill="#004482"/>
          <path d="M16 10.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c.816 0 1.565-.28 2.157-.748l-1.407-2.002a1.5 1.5 0 11-.75-2.798V10.5zm5 1v1.5h1.5V14h-1.5v1.5H19V14h-1.5v-1.5H19v-1.5h1.5zm4 0v1.5H26V14h-1v1.5h-1.5V14H22v-1.5h1.5v-1.5H25z" fill="#FFF"/>
        </svg>
      )
  }
}
