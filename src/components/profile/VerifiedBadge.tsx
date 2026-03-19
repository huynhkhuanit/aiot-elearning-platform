import { Check } from "lucide-react";
import type { ProfileBadge } from "@/types/profile";

const BADGE_LABELS: Record<ProfileBadge["code"], string> = {
    verified_instructor: "Verified instructor",
    verified_partner: "Verified partner",
};

interface VerifiedBadgeProps {
    badge: ProfileBadge;
    className?: string;
}

export default function VerifiedBadge({
    badge,
    className = "",
}: VerifiedBadgeProps) {
    return (
        <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm ${className}`}
            title={BADGE_LABELS[badge.code]}
            aria-label={BADGE_LABELS[badge.code]}
        >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
    );
}
