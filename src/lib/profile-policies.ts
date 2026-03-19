import type {
    AppRole,
    ProfessionalProfileRecord,
    ProfileBadge,
    ProfileBadgeCode,
    VerificationType,
    UserVerificationRecord,
} from "@/types/profile";

export interface ProfilePolicyActor {
    userId: string;
    roles: AppRole[];
}

const ROLE_PRIORITY: AppRole[] = [
    "admin",
    "instructor",
    "partner",
    "student",
];

const PROFESSIONAL_ROLES: AppRole[] = ["instructor", "partner"];

const ROLE_TO_VERIFICATION: Record<
    Extract<AppRole, "instructor" | "partner">,
    VerificationType
> = {
    instructor: "instructor_verification",
    partner: "partner_verification",
};

const ROLE_TO_BADGE: Record<
    Extract<AppRole, "instructor" | "partner">,
    ProfileBadgeCode
> = {
    instructor: "verified_instructor",
    partner: "verified_partner",
};

export function getPrimaryRole(roles: AppRole[]): AppRole {
    for (const role of ROLE_PRIORITY) {
        if (roles.includes(role)) {
            return role;
        }
    }

    return "student";
}

export function verificationTypeForRole(
    role: AppRole,
): VerificationType | null {
    if (role === "instructor" || role === "partner") {
        return ROLE_TO_VERIFICATION[role];
    }

    return null;
}

export function badgeCodeForRole(role: AppRole): ProfileBadgeCode | null {
    if (role === "instructor" || role === "partner") {
        return ROLE_TO_BADGE[role];
    }

    return null;
}

export function isProfessionalRole(role: AppRole): boolean {
    return PROFESSIONAL_ROLES.includes(role);
}

export function hasRole(roles: AppRole[], role: AppRole): boolean {
    return roles.includes(role);
}

export function hasVerifiedVerification(
    role: AppRole,
    verifications: UserVerificationRecord[],
): boolean {
    const verificationType = verificationTypeForRole(role);

    if (!verificationType) {
        return false;
    }

    return verifications.some(
        (verification) =>
            verification.verificationType === verificationType &&
            verification.status === "verified",
    );
}

export function canShowVerifiedBadge(
    role: AppRole,
    roles: AppRole[],
    verifications: UserVerificationRecord[],
): boolean {
    return (
        isProfessionalRole(role) &&
        hasRole(roles, role) &&
        hasVerifiedVerification(role, verifications)
    );
}

export function buildVisibleBadges(
    roles: AppRole[],
    verifications: UserVerificationRecord[],
): ProfileBadge[] {
    return PROFESSIONAL_ROLES.filter((role) =>
        canShowVerifiedBadge(role, roles, verifications),
    )
        .map((role) => badgeCodeForRole(role))
        .filter((badgeCode): badgeCode is ProfileBadgeCode => Boolean(badgeCode))
        .map((badgeCode) => ({
            code: badgeCode,
            visible: true,
        }));
}

export function canPublishProfessionalProfile(
    profileRoles: AppRole[],
    roles: AppRole[],
    verifications: UserVerificationRecord[],
): boolean {
    if (profileRoles.length === 0) {
        return false;
    }

    return profileRoles.every(
        (role) =>
            isProfessionalRole(role) &&
            hasRole(roles, role) &&
            hasVerifiedVerification(role, verifications),
    );
}

export function canViewProfessionalProfile(
    profile: Pick<ProfessionalProfileRecord, "profileRoles" | "status"> | null,
    roles: AppRole[],
    verifications: UserVerificationRecord[],
): boolean {
    if (!profile) {
        return false;
    }

    if (profile.status !== "published") {
        return false;
    }

    return canPublishProfessionalProfile(
        profile.profileRoles,
        roles,
        verifications,
    );
}

export function canEditProfessionalProfile(
    actor: ProfilePolicyActor,
    targetUserId: string,
): boolean {
    return actor.userId === targetUserId || actor.roles.includes("admin");
}
