import Image from "next/image";

interface AvatarWithProBadgeProps {
    avatarUrl?: string | null;
    fullName?: string | null;
    isPro: boolean;
    /** Whether this user has a registered account on the platform */
    isRegistered?: boolean;
    size?: "3xs" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

const sizeMap = {
    "3xs": { outer: 19, ring: 1, gap: 1, text: "text-[6px]" },
    "2xs": { outer: 22, ring: 2, gap: 1, text: "text-[8px]" },
    xs: { outer: 32, ring: 2, gap: 1, text: "text-xs" },
    sm: { outer: 40, ring: 3, gap: 2, text: "text-sm" },
    md: { outer: 48, ring: 3, gap: 2, text: "text-base" },
    lg: { outer: 64, ring: 3, gap: 2, text: "text-lg" },
    xl: { outer: 80, ring: 4, gap: 2, text: "text-xl" },
    "2xl": { outer: 128, ring: 5, gap: 3, text: "text-3xl" },
};

// Google 4-color ring for PRO users
const GOOGLE_RING =
    "conic-gradient(from 0deg, #EA4335 0deg 45deg, #4285F4 45deg 135deg, #34A853 135deg 250deg, #FBBC05 250deg 290deg, #EA4335 290deg 360deg)";

function AvatarContent({
    avatarUrl,
    fullName,
    initials,
    textClass,
}: {
    avatarUrl?: string | null;
    fullName: string;
    initials: string;
    textClass: string;
}) {
    if (avatarUrl) {
        return (
            <Image
                src={avatarUrl}
                alt={fullName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
            />
        );
    }
    return (
        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-700 flex items-center justify-center">
            <span
                className={`${textClass} font-light text-white/90 leading-none tracking-wide`}
            >
                {initials}
            </span>
        </div>
    );
}

export default function AvatarWithProBadge({
    avatarUrl,
    fullName,
    isPro,
    isRegistered,
    size = "md",
    className = "",
}: AvatarWithProBadgeProps) {
    const s = sizeMap[size];
    const initials = (fullName || "U")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Non-registered / external authors: clean avatar, no ring at all
    if (!isRegistered && !isPro) {
        return (
            <div
                className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden ${className}`}
                style={{ width: s.outer, height: s.outer }}
            >
                <AvatarContent
                    avatarUrl={avatarUrl}
                    fullName={fullName || "User"}
                    initials={initials}
                    textClass={s.text}
                />
            </div>
        );
    }

    // Registered FREE users: subtle gray ring to indicate platform member
    if (!isPro && isRegistered) {
        const avatarInset = s.ring + s.gap;
        return (
            <div
                className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
                style={{ width: s.outer, height: s.outer }}
            >
                {/* Subtle gray ring for registered free users */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-400" />
                {/* White gap ring */}
                <div
                    className="absolute rounded-full bg-white"
                    style={{ inset: s.ring }}
                />
                {/* Avatar */}
                <div
                    className="absolute rounded-full overflow-hidden"
                    style={{ inset: avatarInset }}
                >
                    <AvatarContent
                        avatarUrl={avatarUrl}
                        fullName={fullName || "User"}
                        initials={initials}
                        textClass={s.text}
                    />
                </div>
            </div>
        );
    }

    // PRO users: Google 4-color ring + white gap + avatar
    const avatarInset = s.ring + s.gap;

    return (
        <div
            className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
            style={{ width: s.outer, height: s.outer }}
        >
            {/* Google gradient ring */}
            <div
                className="absolute inset-0 rounded-full"
                style={{ background: GOOGLE_RING }}
            />

            {/* White gap ring */}
            <div
                className="absolute rounded-full bg-white"
                style={{ inset: s.ring }}
            />

            {/* Avatar — centered via inset shorthand */}
            <div
                className="absolute rounded-full overflow-hidden"
                style={{ inset: avatarInset }}
            >
                <AvatarContent
                    avatarUrl={avatarUrl}
                    fullName={fullName || "User"}
                    initials={initials}
                    textClass={s.text}
                />
            </div>
        </div>
    );
}
