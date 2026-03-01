import Image from "next/image";

interface AvatarWithProBadgeProps {
    avatarUrl?: string | null;
    fullName?: string | null;
    isPro: boolean;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

const sizeMap = {
    xs: { outer: 32, border: 2.5, gap: 1.5, text: "text-xs" },
    sm: { outer: 40, border: 3, gap: 1.5, text: "text-sm" },
    md: { outer: 48, border: 3, gap: 2, text: "text-base" },
    lg: { outer: 64, border: 3.5, gap: 2.5, text: "text-lg" },
    xl: { outer: 80, border: 4, gap: 3, text: "text-xl" },
    "2xl": { outer: 128, border: 5, gap: 4, text: "text-3xl" },
};

// Google 4-color ring — customized angles to match exact UI reference
// Red (top), Blue (right), Green (bottom), Yellow (narrow left strip)
const GOOGLE_RING =
    "conic-gradient(from 0deg, #EA4335 0deg 45deg, #4285F4 45deg 135deg, #34A853 135deg 250deg, #FBBC05 250deg 290deg, #EA4335 290deg 360deg)";

export default function AvatarWithProBadge({
    avatarUrl,
    fullName,
    isPro,
    size = "md",
    className = "",
}: AvatarWithProBadgeProps) {
    const s = sizeMap[size];
    const inset = s.border + s.gap;
    const inner = s.outer - inset * 2;

    const initials = (fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
            style={{ width: s.outer, height: s.outer }}
        >
            {/* Gradient ring */}
            <div
                className="absolute inset-0 rounded-full"
                style={{ background: isPro ? GOOGLE_RING : "#d1d5db" }}
            />

            {/* White gap */}
            <div
                className="absolute rounded-full bg-white"
                style={{
                    top: s.border,
                    left: s.border,
                    right: s.border,
                    bottom: s.border,
                }}
            />

            {/* Avatar — centered via top/left/right/bottom with fixed size */}
            <div
                className="absolute rounded-full overflow-hidden"
                style={{
                    top: inset,
                    left: inset,
                    width: inner,
                    height: inner,
                }}
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt={fullName || "User"}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                        <span
                            className={`${s.text} font-bold text-white leading-none`}
                        >
                            {initials}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
