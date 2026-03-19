import { supabaseAdmin } from "@/lib/supabase";
import { normalizeUsername } from "@/lib/profile-url";
import {
    buildVisibleBadges,
    canEditProfessionalProfile,
    canPublishProfessionalProfile,
    canViewProfessionalProfile,
    getPrimaryRole,
} from "@/lib/profile-policies";
import type { PublicUser } from "@/types/auth";
import type {
    AppRole,
    ProfessionalProfileEditorResponse,
    ProfessionalProfileRecord,
    ProfessionalProfileStatus,
    ProfessionalProfileUpdateInput,
    ProfileCourse,
    ProfileReviewSummary,
    PublicProfileRecord,
    PublicProfileUpdateInput,
    UnifiedProfileResponse,
    UserVerificationRecord,
    VerificationStatus,
    VerificationType,
} from "@/types/profile";

interface DbUserRow {
    id: string;
    email: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    phone: string | null;
    membership_type: "FREE" | "PRO";
    membership_expires_at: string | null;
    learning_streak: number | null;
    total_study_time: number | null;
    is_verified: boolean | null;
    is_active: boolean | null;
    last_login: string | null;
    created_at: string;
    role: string | null;
}

interface DbPublicProfileRow {
    user_id: string;
    display_name: string | null;
    headline: string | null;
    bio: string | null;
    avatar_url: string | null;
    banner_url: string | null;
    location: string | null;
    website_url: string | null;
    social_links: Record<string, unknown> | null;
}

interface DbUserRoleRow {
    user_id: string;
    role: AppRole;
    revoked_at: string | null;
}

interface DbVerificationRow {
    user_id: string;
    verification_type: VerificationType;
    status: VerificationStatus;
    requested_at: string | null;
    reviewed_at: string | null;
    review_notes: string | null;
}

interface DbProfessionalProfileRow {
    user_id: string;
    profile_roles: AppRole[] | null;
    headline: string | null;
    summary: string | null;
    years_experience: number | null;
    current_title: string | null;
    current_organization: string | null;
    location: string | null;
    skills: unknown;
    education_items: unknown;
    career_items: unknown;
    achievement_items: unknown;
    featured_links: unknown;
    status: ProfessionalProfileStatus;
    submitted_at: string | null;
    reviewed_at: string | null;
    published_at: string | null;
    review_notes: string | null;
}

interface DbCourseRow {
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string | null;
    short_description: string | null;
}

interface DbCountResult {
    count?: number | null;
}

export interface VerificationUpdateInput {
    verificationType: VerificationType;
    status: VerificationStatus;
    reviewNotes?: string | null;
}

const USER_SELECT =
    "id, email, username, full_name, avatar_url, bio, phone, membership_type, membership_expires_at, learning_streak, total_study_time, is_verified, is_active, last_login, created_at, role";

function requireSupabase() {
    if (!supabaseAdmin) {
        throw new Error("Supabase admin client not initialized");
    }

    return supabaseAdmin;
}

function rolePriority(role: AppRole): number {
    switch (role) {
        case "admin":
            return 0;
        case "instructor":
            return 1;
        case "partner":
            return 2;
        case "student":
        default:
            return 3;
    }
}

function normalizeRoles(roles: AppRole[]): AppRole[] {
    return Array.from(new Set(roles)).sort(
        (left, right) => rolePriority(left) - rolePriority(right),
    );
}

function normalizeSocialLinks(
    value: Record<string, unknown> | null | undefined,
): Record<string, string> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return Object.entries(value).reduce<Record<string, string>>(
        (accumulator, [key, rawValue]) => {
            if (typeof rawValue === "string" && rawValue.trim()) {
                accumulator[key] = rawValue.trim();
            }

            return accumulator;
        },
        {},
    );
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeObjectArray(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(
        (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
}

function mapPublicProfile(
    user: DbUserRow,
    row: DbPublicProfileRow | null,
): PublicProfileRecord {
    const username = normalizeUsername(user.username);

    return {
        displayName: row?.display_name?.trim() || user.full_name || username,
        headline: row?.headline ?? null,
        bio: row?.bio ?? user.bio ?? null,
        avatarUrl: row?.avatar_url ?? user.avatar_url ?? null,
        bannerUrl: row?.banner_url ?? null,
        location: row?.location ?? null,
        websiteUrl: row?.website_url ?? null,
        socialLinks: normalizeSocialLinks(row?.social_links),
    };
}

function mapProfessionalProfile(
    row: DbProfessionalProfileRow | null,
): ProfessionalProfileRecord | null {
    if (!row) {
        return null;
    }

    return {
        profileRoles: normalizeRoles(row.profile_roles ?? []),
        status: row.status,
        headline: row.headline ?? null,
        summary: row.summary ?? null,
        yearsExperience: row.years_experience ?? null,
        currentTitle: row.current_title ?? null,
        currentOrganization: row.current_organization ?? null,
        location: row.location ?? null,
        skills: normalizeStringArray(row.skills),
        educationItems: normalizeObjectArray(row.education_items),
        careerItems: normalizeObjectArray(row.career_items),
        achievementItems: normalizeObjectArray(row.achievement_items),
        featuredLinks: normalizeObjectArray(row.featured_links),
        submittedAt: row.submitted_at ?? null,
        reviewedAt: row.reviewed_at ?? null,
        publishedAt: row.published_at ?? null,
        reviewNotes: row.review_notes ?? null,
    };
}

function mapVerificationRows(
    rows: DbVerificationRow[],
): UserVerificationRecord[] {
    return rows.map((row) => ({
        verificationType: row.verification_type,
        status: row.status,
        requestedAt: row.requested_at ?? null,
        reviewedAt: row.reviewed_at ?? null,
        reviewNotes: row.review_notes ?? null,
    }));
}

function mapCourseRow(row: DbCourseRow): ProfileCourse {
    return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        thumbnailUrl: row.thumbnail_url ?? null,
        shortDescription: row.short_description ?? null,
    };
}

async function fetchUserById(userId: string): Promise<DbUserRow | null> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("users")
        .select(USER_SELECT)
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data as DbUserRow | null;
}

async function fetchUserByUsername(
    username: string,
): Promise<DbUserRow | null> {
    const client = requireSupabase();
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
        return null;
    }

    const { data, error } = await client
        .from("users")
        .select(USER_SELECT)
        .ilike("username", normalizedUsername)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (data) {
        return data as DbUserRow | null;
    }

    const fallbackResult = await client
        .from("users")
        .select(USER_SELECT)
        .ilike("username", `@${normalizedUsername}`)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

    if (fallbackResult.error) {
        throw fallbackResult.error;
    }

    return fallbackResult.data as DbUserRow | null;
}

async function fetchPublicProfileByUserId(
    userId: string,
): Promise<DbPublicProfileRow | null> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("public_profiles")
        .select(
            "user_id, display_name, headline, bio, avatar_url, banner_url, location, website_url, social_links",
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data as DbPublicProfileRow | null;
}

async function fetchActiveRoles(userId: string): Promise<AppRole[]> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("user_roles")
        .select("user_id, role, revoked_at")
        .eq("user_id", userId)
        .is("revoked_at", null);

    if (error) {
        throw error;
    }

    const rows = (data ?? []) as DbUserRoleRow[];
    return normalizeRoles(
        rows.length > 0 ? rows.map((row) => row.role) : ["student"],
    );
}

async function fetchVerifications(
    userId: string,
): Promise<UserVerificationRecord[]> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("user_verifications")
        .select(
            "user_id, verification_type, status, requested_at, reviewed_at, review_notes",
        )
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return mapVerificationRows((data ?? []) as DbVerificationRow[]);
}

async function fetchProfessionalProfileByUserId(
    userId: string,
): Promise<ProfessionalProfileRecord | null> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("professional_profiles")
        .select(
            "user_id, profile_roles, headline, summary, years_experience, current_title, current_organization, location, skills, education_items, career_items, achievement_items, featured_links, status, submitted_at, reviewed_at, published_at, review_notes",
        )
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return mapProfessionalProfile(data as DbProfessionalProfileRow | null);
}

async function fetchPublicCoursesByInstructor(
    userId: string,
): Promise<ProfileCourse[]> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("courses")
        .select("id, slug, title, thumbnail_url, short_description")
        .eq("instructor_id", userId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return ((data ?? []) as DbCourseRow[]).map(mapCourseRow);
}

async function fetchLegacyProfileStats(userId: string) {
    const client = requireSupabase();
    const [
        enrollmentsResult,
        completedEnrollmentsResult,
        blogPostsResult,
        forumTopicsResult,
        forumRepliesResult,
    ] = await Promise.all([
        client
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        client
            .from("enrollments")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .or("progress_percentage.gte.100,completed_at.not.is.null"),
        client
            .from("blog_posts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "published"),
        client
            .from("forum_topics")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
        client
            .from("forum_replies")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId),
    ]);

    for (const result of [
        enrollmentsResult,
        completedEnrollmentsResult,
        blogPostsResult,
        forumTopicsResult,
        forumRepliesResult,
    ]) {
        if (result.error) {
            throw result.error;
        }
    }

    return {
        totalCoursesEnrolled: (enrollmentsResult as DbCountResult).count ?? 0,
        totalCoursesCompleted:
            (completedEnrollmentsResult as DbCountResult).count ?? 0,
        totalArticlesPublished: (blogPostsResult as DbCountResult).count ?? 0,
        totalForumPosts:
            ((forumTopicsResult as DbCountResult).count ?? 0) +
            ((forumRepliesResult as DbCountResult).count ?? 0),
    };
}

async function buildUnifiedProfile(
    user: DbUserRow,
): Promise<UnifiedProfileResponse> {
    const [
        publicProfileRow,
        roles,
        verifications,
        professionalProfile,
        courses,
        legacyStats,
    ] = await Promise.all([
        fetchPublicProfileByUserId(user.id),
        fetchActiveRoles(user.id),
        fetchVerifications(user.id),
        fetchProfessionalProfileByUserId(user.id),
        fetchPublicCoursesByInstructor(user.id),
        fetchLegacyProfileStats(user.id),
    ]);

    const primaryRole = getPrimaryRole(roles);
    const publicProfile = mapPublicProfile(user, publicProfileRow);

    return {
        user: {
            id: user.id,
            username: normalizeUsername(user.username),
            fullName: publicProfile.displayName,
            roles,
            primaryRole,
            role: primaryRole,
        },
        publicProfile,
        professionalProfile: canViewProfessionalProfile(
            professionalProfile,
            roles,
            verifications,
        )
            ? professionalProfile
            : null,
        badges: buildVisibleBadges(roles, verifications),
        courses,
        stats: legacyStats,
    };
}

function rolesFallback(role: string | null): AppRole[] {
    switch ((role ?? "").toLowerCase()) {
        case "admin":
            return ["admin", "student"];
        case "instructor":
        case "teacher":
            return ["instructor", "student"];
        case "partner":
            return ["partner", "student"];
        default:
            return ["student"];
    }
}

export async function getPublicProfileByUsername(
    username: string,
): Promise<UnifiedProfileResponse | null> {
    const user = await fetchUserByUsername(username);

    if (!user || !user.is_active) {
        return null;
    }

    return buildUnifiedProfile(user);
}

export async function getProfileEditorByUserId(
    targetUserId: string,
    actorUserId: string,
): Promise<ProfessionalProfileEditorResponse | null> {
    const [targetUser, actorRoles] = await Promise.all([
        fetchUserById(targetUserId),
        fetchActiveRoles(actorUserId),
    ]);

    if (!targetUser || !targetUser.is_active) {
        return null;
    }

    const [
        publicProfileRow,
        targetRoles,
        verifications,
        professionalProfile,
        courses,
        legacyStats,
    ] = await Promise.all([
        fetchPublicProfileByUserId(targetUserId),
        fetchActiveRoles(targetUserId),
        fetchVerifications(targetUserId),
        fetchProfessionalProfileByUserId(targetUserId),
        fetchPublicCoursesByInstructor(targetUserId),
        fetchLegacyProfileStats(targetUserId),
    ]);

    const primaryRole = getPrimaryRole(targetRoles);
    const publicProfile = mapPublicProfile(targetUser, publicProfileRow);
    const canPublish = professionalProfile
        ? canPublishProfessionalProfile(
              professionalProfile.profileRoles,
              targetRoles,
              verifications,
          )
        : false;

    return {
        user: {
            id: targetUser.id,
            username: normalizeUsername(targetUser.username),
            fullName: publicProfile.displayName,
            roles: targetRoles,
            primaryRole,
            role: primaryRole,
        },
        publicProfile,
        professionalProfile,
        badges: buildVisibleBadges(targetRoles, verifications),
        courses,
        stats: legacyStats,
        verifications,
        capabilities: {
            canViewProfessionalProfile: canViewProfessionalProfile(
                professionalProfile,
                targetRoles,
                verifications,
            ),
            canEditProfessionalProfile: canEditProfessionalProfile(
                {
                    userId: actorUserId,
                    roles: actorRoles,
                },
                targetUserId,
            ),
            canPublishProfessionalProfile: canPublish,
        },
    };
}

export async function getAuthUserById(
    userId: string,
): Promise<PublicUser | null> {
    const user = await fetchUserById(userId);

    if (!user || !user.is_active) {
        return null;
    }

    const [fetchedRoles, verifications] = await Promise.all([
        fetchActiveRoles(user.id),
        fetchVerifications(user.id),
    ]);
    const roles =
        fetchedRoles.length > 0 ? fetchedRoles : rolesFallback(user.role);
    const primaryRole = getPrimaryRole(roles);

    return {
        id: user.id,
        email: user.email,
        username: normalizeUsername(user.username),
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: primaryRole,
        roles,
        primaryRole,
        membership_type: user.membership_type,
        learning_streak: user.learning_streak ?? 0,
        total_study_time: user.total_study_time ?? 0,
        is_verified: Boolean(user.is_verified),
        created_at: new Date(user.created_at),
        badges: buildVisibleBadges(roles, verifications),
    };
}

export async function updatePublicProfile(
    userId: string,
    input: PublicProfileUpdateInput,
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const upsertPayload: Record<string, unknown> = { user_id: userId };

    if (input.displayName !== undefined) {
        upsertPayload.display_name = input.displayName?.trim() || null;
    }
    if (input.headline !== undefined) {
        upsertPayload.headline = input.headline?.trim() || null;
    }
    if (input.bio !== undefined) {
        upsertPayload.bio = input.bio?.trim() || null;
    }
    if (input.avatarUrl !== undefined) {
        upsertPayload.avatar_url = input.avatarUrl?.trim() || null;
    }
    if (input.bannerUrl !== undefined) {
        upsertPayload.banner_url = input.bannerUrl?.trim() || null;
    }
    if (input.location !== undefined) {
        upsertPayload.location = input.location?.trim() || null;
    }
    if (input.websiteUrl !== undefined) {
        upsertPayload.website_url = input.websiteUrl?.trim() || null;
    }
    if (input.socialLinks !== undefined) {
        upsertPayload.social_links = Object.entries(input.socialLinks).reduce<
            Record<string, string>
        >((accumulator, [key, value]) => {
            if (typeof value === "string" && value.trim()) {
                accumulator[key] = value.trim();
            }
            return accumulator;
        }, {});
    }

    const { error: publicProfileError } = await client
        .from("public_profiles")
        .upsert(upsertPayload, { onConflict: "user_id" });

    if (publicProfileError) {
        throw publicProfileError;
    }

    const userUpdates: Record<string, unknown> = {};
    if (input.username !== undefined) {
        const normalizedInputUsername = normalizeUsername(input.username);

        if (!normalizedInputUsername) {
            throw new Error("Username is required");
        }

        userUpdates.username = normalizedInputUsername;
    }
    if (input.phone !== undefined) {
        userUpdates.phone = input.phone?.trim() || null;
    }

    if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await client
            .from("users")
            .update(userUpdates)
            .eq("id", userId);

        if (userError) {
            throw userError;
        }
    }

    return getProfileEditorByUserId(userId, userId);
}

export async function upsertProfessionalProfileDraft(
    userId: string,
    input: ProfessionalProfileUpdateInput,
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const { error } = await client.from("professional_profiles").upsert(
        {
            user_id: userId,
            profile_roles: normalizeRoles(input.profileRoles),
            headline: input.headline?.trim() || null,
            summary: input.summary?.trim() || null,
            years_experience: input.yearsExperience ?? null,
            current_title: input.currentTitle?.trim() || null,
            current_organization: input.currentOrganization?.trim() || null,
            location: input.location?.trim() || null,
            skills: input.skills ?? [],
            education_items: input.educationItems ?? [],
            career_items: input.careerItems ?? [],
            achievement_items: input.achievementItems ?? [],
            featured_links: input.featuredLinks ?? [],
            status: "draft" as ProfessionalProfileStatus,
            submitted_at: null,
            published_at: null,
        },
        { onConflict: "user_id" },
    );

    if (error) {
        throw error;
    }

    return getProfileEditorByUserId(userId, userId);
}

export async function submitProfessionalProfileForReview(
    userId: string,
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const editorState = await getProfileEditorByUserId(userId, userId);

    if (!editorState?.professionalProfile) {
        throw new Error("Professional profile draft not found");
    }

    if (!editorState.capabilities.canPublishProfessionalProfile) {
        throw new Error(
            "Only verified instructors or partners can submit a professional profile",
        );
    }

    const { error } = await client
        .from("professional_profiles")
        .update({
            status: "pending_review",
            submitted_at: new Date().toISOString(),
            reviewed_at: null,
            published_at: null,
        })
        .eq("user_id", userId);

    if (error) {
        throw error;
    }

    return getProfileEditorByUserId(userId, userId);
}

async function demoteInvalidPublishedProfessionalProfile(
    userId: string,
    note: string,
) {
    const client = requireSupabase();
    const user = await fetchUserById(userId);

    if (!user || !user.is_active) {
        return;
    }

    const [roles, verifications, professionalProfile] = await Promise.all([
        fetchActiveRoles(userId),
        fetchVerifications(userId),
        fetchProfessionalProfileByUserId(userId),
    ]);

    if (
        !professionalProfile ||
        professionalProfile.status !== "published" ||
        canPublishProfessionalProfile(
            professionalProfile.profileRoles,
            roles,
            verifications,
        )
    ) {
        return;
    }

    const { error } = await client
        .from("professional_profiles")
        .update({
            status: "draft",
            published_at: null,
            review_notes: note,
        })
        .eq("user_id", userId);

    if (error) {
        throw error;
    }
}

export async function approveProfessionalProfile(
    adminUserId: string,
    targetUserId: string,
    reviewNotes?: string | null,
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const editorState = await getProfileEditorByUserId(
        targetUserId,
        adminUserId,
    );

    if (!editorState?.professionalProfile) {
        throw new Error("Professional profile not found");
    }

    if (!editorState.capabilities.canPublishProfessionalProfile) {
        throw new Error(
            "Profile cannot be published until matching roles and verifications are active",
        );
    }

    const now = new Date().toISOString();
    const { error } = await client
        .from("professional_profiles")
        .update({
            status: "published",
            reviewed_at: now,
            reviewed_by: adminUserId,
            published_at: now,
            review_notes: reviewNotes ?? null,
        })
        .eq("user_id", targetUserId);

    if (error) {
        throw error;
    }

    return getProfileEditorByUserId(targetUserId, adminUserId);
}

export async function rejectProfessionalProfile(
    adminUserId: string,
    targetUserId: string,
    reviewNotes?: string | null,
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const { error } = await client
        .from("professional_profiles")
        .update({
            status: "rejected",
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminUserId,
            published_at: null,
            review_notes:
                reviewNotes?.trim() || "Profile rejected during review",
        })
        .eq("user_id", targetUserId);

    if (error) {
        throw error;
    }

    return getProfileEditorByUserId(targetUserId, adminUserId);
}

export async function listProfileReviews(
    status: ProfessionalProfileStatus = "pending_review",
): Promise<ProfileReviewSummary[]> {
    const client = requireSupabase();
    const { data, error } = await client
        .from("professional_profiles")
        .select(
            "user_id, profile_roles, headline, status, submitted_at, review_notes",
        )
        .eq("status", status)
        .order("submitted_at", { ascending: true });

    if (error) {
        throw error;
    }

    const profiles = (data ?? []) as Array<{
        user_id: string;
        profile_roles: AppRole[] | null;
        headline: string | null;
        status: ProfessionalProfileStatus;
        submitted_at: string | null;
        review_notes: string | null;
    }>;

    return Promise.all(
        profiles.map(async (profile) => {
            const user = await fetchUserById(profile.user_id);

            if (!user) {
                throw new Error("Profile review user not found");
            }

            const [publicProfileRow, roles, verifications] = await Promise.all([
                fetchPublicProfileByUserId(profile.user_id),
                fetchActiveRoles(profile.user_id),
                fetchVerifications(profile.user_id),
            ]);
            const publicProfile = mapPublicProfile(user, publicProfileRow);
            const profileRoles = normalizeRoles(profile.profile_roles ?? []);

            return {
                userId: profile.user_id,
                username: normalizeUsername(user.username),
                displayName: publicProfile.displayName,
                avatarUrl: publicProfile.avatarUrl,
                roles,
                verifications,
                status: profile.status,
                submittedAt: profile.submitted_at,
                reviewNotes: profile.review_notes,
                profileRoles,
                headline: profile.headline,
                badges: buildVisibleBadges(roles, verifications),
                canPublish: canPublishProfessionalProfile(
                    profileRoles,
                    roles,
                    verifications,
                ),
            };
        }),
    );
}

export async function replaceUserRoles(
    adminUserId: string,
    targetUserId: string,
    roles: AppRole[],
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const desiredRoles = normalizeRoles(
        roles.length > 0
            ? Array.from(new Set(["student", ...roles]))
            : ["student"],
    );
    const currentRoles = await fetchActiveRoles(targetUserId);
    const rolesToAdd = desiredRoles.filter(
        (role) => !currentRoles.includes(role),
    );
    const rolesToRevoke = currentRoles.filter(
        (role) => !desiredRoles.includes(role),
    );

    if (rolesToRevoke.length > 0) {
        const { error: revokeError } = await client
            .from("user_roles")
            .update({
                revoked_at: new Date().toISOString(),
                revoked_by: adminUserId,
            })
            .eq("user_id", targetUserId)
            .is("revoked_at", null)
            .in("role", rolesToRevoke);

        if (revokeError) {
            throw revokeError;
        }
    }

    if (rolesToAdd.length > 0) {
        const { error: addError } = await client.from("user_roles").insert(
            rolesToAdd.map((role) => ({
                user_id: targetUserId,
                role,
                assigned_by: adminUserId,
            })),
        );

        if (addError) {
            throw addError;
        }
    }

    await demoteInvalidPublishedProfessionalProfile(
        targetUserId,
        "Professional profile moved back to draft because one or more required roles were revoked.",
    );

    return getProfileEditorByUserId(targetUserId, adminUserId);
}

export async function replaceUserVerifications(
    adminUserId: string,
    targetUserId: string,
    updates: VerificationUpdateInput[],
): Promise<ProfessionalProfileEditorResponse | null> {
    const client = requireSupabase();
    const dedupedUpdates = Array.from(
        new Map(
            updates.map((update) => [update.verificationType, update]),
        ).values(),
    );

    if (dedupedUpdates.length === 0) {
        return getProfileEditorByUserId(targetUserId, adminUserId);
    }

    const { error } = await client.from("user_verifications").upsert(
        dedupedUpdates.map((update) => ({
            user_id: targetUserId,
            verification_type: update.verificationType,
            status: update.status,
            requested_at:
                update.status === "pending"
                    ? new Date().toISOString()
                    : undefined,
            reviewed_at:
                update.status === "pending" ? null : new Date().toISOString(),
            reviewed_by: update.status === "pending" ? null : adminUserId,
            review_notes: update.reviewNotes?.trim() || null,
        })),
        {
            onConflict: "user_id,verification_type",
        },
    );

    if (error) {
        throw error;
    }

    await demoteInvalidPublishedProfessionalProfile(
        targetUserId,
        "Professional profile moved back to draft because one or more required verifications were revoked.",
    );

    return getProfileEditorByUserId(targetUserId, adminUserId);
}

export async function getLegacyProfileByUsername(username: string) {
    const publicProfile = await getPublicProfileByUsername(username);

    if (!publicProfile) {
        return null;
    }

    const user = await fetchUserById(publicProfile.user.id);

    if (!user) {
        return null;
    }

    const stats = await fetchLegacyProfileStats(publicProfile.user.id);

    return {
        id: user.id,
        email: "",
        username: normalizeUsername(user.username),
        full_name: publicProfile.publicProfile.displayName,
        avatar_url: publicProfile.publicProfile.avatarUrl,
        bio: publicProfile.publicProfile.bio,
        phone: user.phone,
        membership_type: user.membership_type,
        membership_expires_at: user.membership_expires_at
            ? new Date(user.membership_expires_at)
            : null,
        learning_streak: user.learning_streak ?? 0,
        total_study_time: user.total_study_time ?? 0,
        is_verified: publicProfile.badges.length > 0,
        created_at: new Date(user.created_at),
        website: publicProfile.publicProfile.websiteUrl,
        linkedin: publicProfile.publicProfile.socialLinks.linkedin ?? null,
        github: publicProfile.publicProfile.socialLinks.github ?? null,
        twitter: publicProfile.publicProfile.socialLinks.twitter ?? null,
        facebook: publicProfile.publicProfile.socialLinks.facebook ?? null,
        total_courses_enrolled: stats.totalCoursesEnrolled,
        total_courses_completed: stats.totalCoursesCompleted,
        total_articles_published: stats.totalArticlesPublished,
        total_forum_posts: stats.totalForumPosts,
        followers_count: 0,
        following_count: 0,
    };
}
