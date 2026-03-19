"use client";

export const dynamic = "force-dynamic";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    BookOpen,
    BriefcaseBusiness,
    Globe,
    GraduationCap,
    Link2,
    MapPin,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import PageContainer from "@/components/PageContainer";
import PageLoading from "@/components/PageLoading";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import { formatUsernameHandle, normalizeUsername } from "@/lib/profile-url";
import type {
    ProfessionalProfileRecord,
    UnifiedProfileResponse,
} from "@/types/profile";

function readItemLabel(item: Record<string, unknown>): string {
    const preferredKeys = [
        "title",
        "label",
        "name",
        "institution",
        "organization",
        "company",
        "role",
    ];

    for (const key of preferredKeys) {
        const value = item[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return JSON.stringify(item);
}

function readItemDescription(item: Record<string, unknown>): string | null {
    const preferredKeys = ["description", "summary", "subtitle", "details"];

    for (const key of preferredKeys) {
        const value = item[key];
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }

    return null;
}

function renderListSection(
    title: string,
    items: Record<string, unknown>[],
    icon: ReactNode,
) {
    if (items.length === 0) {
        return null;
    }

    return (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
            <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    {icon}
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    {title}
                </h2>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={`${title}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                        <p className="text-sm font-semibold text-slate-900">
                            {readItemLabel(item)}
                        </p>
                        {readItemDescription(item) ? (
                            <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                {readItemDescription(item)}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProfessionalHighlights({
    professionalProfile,
}: {
    professionalProfile: ProfessionalProfileRecord;
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Professional Overview
                        </h2>
                        <p className="text-sm text-slate-500">
                            Published professional profile
                        </p>
                    </div>
                </div>

                {professionalProfile.summary ? (
                    <p className="text-[15px] leading-7 text-slate-600">
                        {professionalProfile.summary}
                    </p>
                ) : (
                    <p className="text-sm text-slate-500">
                        This professional profile is published without a summary.
                    </p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Current Role
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                            {professionalProfile.currentTitle || "Not provided"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            {professionalProfile.currentOrganization ||
                                "Organization not provided"}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Experience
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                            {professionalProfile.yearsExperience !== null
                                ? `${professionalProfile.yearsExperience}+ years`
                                : "Not provided"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                            {professionalProfile.location || "Location not provided"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_40px_-30px_rgba(15,23,42,0.55)]">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                            Publication State
                        </h2>
                        <p className="text-sm text-slate-300">
                            Returned directly by backend workflow
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                        Status
                    </p>
                    <p className="mt-2 text-2xl font-semibold capitalize">
                        {professionalProfile.status.replace(/_/g, " ")}
                    </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {professionalProfile.profileRoles.map((role) => (
                        <span
                            key={role}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200"
                        >
                            {role}
                        </span>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default function UserProfilePage() {
    const params = useParams();
    const rawUsername = params.username as string | undefined;
    const username = normalizeUsername(rawUsername);

    const [profile, setProfile] = useState<UnifiedProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/profiles/${username}`, {
                    cache: "no-store",
                });
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to load profile");
                }

                setProfile(data.data);
                setError(null);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load profile",
                );
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            loadProfile();
        }
    }, [username]);

    const allBadges = useMemo(() => profile?.badges ?? [], [profile?.badges]);

    if (loading) {
        return <PageLoading message="Loading profile..." />;
    }

    if (error || !profile) {
        return (
            <PageContainer>
                <div className="mx-auto flex min-h-[70dvh] max-w-3xl items-center justify-center px-4 py-10">
                    <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Profile unavailable
                        </p>
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                            This profile could not be loaded
                        </h1>
                        <p className="mt-3 text-base leading-7 text-slate-600">
                            {error || "The requested profile does not exist."}
                        </p>
                        <Link
                            href="/"
                            className="mt-8 inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]"
                        >
                            Return home
                        </Link>
                    </div>
                </div>
            </PageContainer>
        );
    }

    const { publicProfile, professionalProfile, courses, user } = profile;

    return (
        <PageContainer>
            <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
                <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)]">
                    <div
                        className="min-h-[220px] border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_45%,_#f8fafc_100%)]"
                        style={
                            publicProfile.bannerUrl
                                ? {
                                      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.4)), url(${publicProfile.bannerUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                  }
                                : undefined
                        }
                    />

                    <div className="px-6 pb-8 pt-0 md:px-10">
                        <div className="-mt-16 flex flex-col gap-8 md:-mt-20 md:flex-row md:items-end">
                            <AvatarWithProBadge
                                avatarUrl={publicProfile.avatarUrl}
                                fullName={publicProfile.displayName}
                                isPro={false}
                                isRegistered={false}
                                size="2xl"
                                className="border-4 border-white shadow-lg"
                            />

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                                        {publicProfile.displayName}
                                    </h1>
                                    {allBadges.map((badge) => (
                                        <VerifiedBadge
                                            key={badge.code}
                                            badge={badge}
                                        />
                                    ))}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                    <span>{formatUsernameHandle(user.username)}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                    <span className="capitalize">
                                        {user.primaryRole}
                                    </span>
                                    {publicProfile.location ? (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <span className="inline-flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4" />
                                                {publicProfile.location}
                                            </span>
                                        </>
                                    ) : null}
                                    {publicProfile.websiteUrl ? (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <a
                                                href={publicProfile.websiteUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-slate-700 transition hover:text-slate-900"
                                            >
                                                <Globe className="h-4 w-4" />
                                                Website
                                            </a>
                                        </>
                                    ) : null}
                                </div>

                                {publicProfile.headline ? (
                                    <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
                                        {publicProfile.headline}
                                    </p>
                                ) : null}

                                {publicProfile.bio ? (
                                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                                        {publicProfile.bio}
                                    </p>
                                ) : null}

                                <div className="mt-6 flex flex-wrap gap-2">
                                    {user.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.78fr_0.22fr]">
                    <div className="space-y-6">
                        {professionalProfile ? (
                            <>
                                <ProfessionalHighlights
                                    professionalProfile={professionalProfile}
                                />

                                {professionalProfile.skills.length > 0 ? (
                                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                                        <div className="mb-5 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                                Skills
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {professionalProfile.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                ) : null}

                                {renderListSection(
                                    "Career",
                                    professionalProfile.careerItems,
                                    <BriefcaseBusiness className="h-5 w-5" />,
                                )}
                                {renderListSection(
                                    "Education",
                                    professionalProfile.educationItems,
                                    <GraduationCap className="h-5 w-5" />,
                                )}
                                {renderListSection(
                                    "Achievements",
                                    professionalProfile.achievementItems,
                                    <ShieldCheck className="h-5 w-5" />,
                                )}

                                {professionalProfile.featuredLinks.length > 0 ? (
                                    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                                        <div className="mb-5 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                                <Link2 className="h-5 w-5" />
                                            </div>
                                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                                Featured Links
                                            </h2>
                                        </div>
                                        <div className="space-y-3">
                                            {professionalProfile.featuredLinks.map(
                                                (item, index) => {
                                                    const label =
                                                        readItemLabel(item);
                                                    const url =
                                                        typeof item.url ===
                                                        "string"
                                                            ? item.url
                                                            : null;

                                                    return (
                                                        <a
                                                            key={`featured-link-${index}`}
                                                            href={url || "#"}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                                        >
                                                            <span>{label}</span>
                                                            <Link2 className="h-4 w-4" />
                                                        </a>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </section>
                                ) : null}
                            </>
                        ) : null}

                        {courses.length > 0 ? (
                            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                                Public Courses
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                Published instructor catalog
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {courses.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {courses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/learn/${course.slug}`}
                                            className="group rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-slate-100"
                                        >
                                            <p className="text-lg font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                                                {course.title}
                                            </p>
                                            {course.shortDescription ? (
                                                <p className="mt-2 text-sm leading-7 text-slate-600">
                                                    {course.shortDescription}
                                                </p>
                                            ) : null}
                                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                Explore course
                                                <BookOpen className="h-4 w-4" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {!professionalProfile && courses.length === 0 ? (
                            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_20px_40px_-30px_rgba(15,23,42,0.25)]">
                                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                                    Basic profile
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                                    No published professional profile yet
                                </h2>
                                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
                                    This user currently shares the standard public
                                    profile only. Professional sections appear here
                                    after a verified instructor or partner profile is
                                    approved and published.
                                </p>
                            </section>
                        ) : null}
                    </div>

                    <aside className="space-y-6">
                        {Object.keys(publicProfile.socialLinks).length > 0 ? (
                            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.35)]">
                                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                    Links
                                </h2>
                                <div className="mt-4 space-y-3">
                                    {Object.entries(publicProfile.socialLinks).map(
                                        ([key, value]) => (
                                            <a
                                                key={key}
                                                href={value}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium capitalize text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                            >
                                                <span>{key}</span>
                                                <Link2 className="h-4 w-4" />
                                            </a>
                                        ),
                                    )}
                                </div>
                            </section>
                        ) : null}

                        <section className="rounded-[28px] border border-slate-200 bg-slate-900 p-6 text-white shadow-[0_20px_40px_-30px_rgba(15,23,42,0.55)]">
                            <h2 className="text-lg font-semibold tracking-tight">
                                Backend-driven state
                            </h2>
                            <div className="mt-5 space-y-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                        Roles
                                    </p>
                                    <p className="mt-2 text-sm text-slate-100">
                                        {user.roles.join(", ")}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                        Badges
                                    </p>
                                    <p className="mt-2 text-sm text-slate-100">
                                        {allBadges.length > 0
                                            ? allBadges
                                                  .map((badge) => badge.code)
                                                  .join(", ")
                                            : "None"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                        Professional profile
                                    </p>
                                    <p className="mt-2 text-sm text-slate-100">
                                        {professionalProfile
                                            ? professionalProfile.status
                                            : "hidden or unavailable"}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </PageContainer>
    );
}
