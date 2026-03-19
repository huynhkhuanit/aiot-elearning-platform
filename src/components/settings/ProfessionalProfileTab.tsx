"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    BriefcaseBusiness,
    CheckCircle2,
    GraduationCap,
    Link2,
    Loader2,
    Save,
    Send,
    ShieldCheck,
    Sparkles,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import type {
    AppRole,
    ProfessionalProfileEditorResponse,
    ProfessionalProfileRecord,
} from "@/types/profile";

type ProfessionalRole = Extract<AppRole, "instructor" | "partner">;

interface ProfessionalProfileFormState {
    profileRoles: ProfessionalRole[];
    headline: string;
    summary: string;
    yearsExperience: string;
    currentTitle: string;
    currentOrganization: string;
    location: string;
    skills: string;
    educationItems: string;
    careerItems: string;
    achievementItems: string;
    featuredLinks: string;
}

function mapItemsToText(value: Record<string, unknown>[]) {
    return value
        .map((item) => {
            const title =
                typeof item.title === "string"
                    ? item.title
                    : typeof item.label === "string"
                      ? item.label
                      : "";
            const description =
                typeof item.description === "string" ? item.description : "";

            return description ? `${title} | ${description}` : title;
        })
        .filter(Boolean)
        .join("\n");
}

function mapFeaturedLinksToText(value: Record<string, unknown>[]) {
    return value
        .map((item) => {
            const label =
                typeof item.label === "string"
                    ? item.label
                    : typeof item.title === "string"
                      ? item.title
                      : "";
            const url = typeof item.url === "string" ? item.url : "";
            return [label, url].filter(Boolean).join(" | ");
        })
        .filter(Boolean)
        .join("\n");
}

function parseLineItems(value: string) {
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [title, description] = line.split("|").map((part) => part.trim());
            return description ? { title, description } : { title };
        });
}

function parseFeaturedLinks(value: string) {
    return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [label, url] = line.split("|").map((part) => part.trim());
            return { label, url: url || "" };
        });
}

function createInitialFormState(
    professionalProfile: ProfessionalProfileRecord | null,
): ProfessionalProfileFormState {
    return {
        profileRoles: ((professionalProfile?.profileRoles ?? []).filter(
            (role): role is ProfessionalRole =>
                role === "instructor" || role === "partner",
        ) as ProfessionalRole[]) ?? [],
        headline: professionalProfile?.headline ?? "",
        summary: professionalProfile?.summary ?? "",
        yearsExperience:
            professionalProfile?.yearsExperience !== null &&
            professionalProfile?.yearsExperience !== undefined
                ? String(professionalProfile.yearsExperience)
                : "",
        currentTitle: professionalProfile?.currentTitle ?? "",
        currentOrganization: professionalProfile?.currentOrganization ?? "",
        location: professionalProfile?.location ?? "",
        skills: (professionalProfile?.skills ?? []).join(", "),
        educationItems: mapItemsToText(
            professionalProfile?.educationItems ?? [],
        ),
        careerItems: mapItemsToText(professionalProfile?.careerItems ?? []),
        achievementItems: mapItemsToText(
            professionalProfile?.achievementItems ?? [],
        ),
        featuredLinks: mapFeaturedLinksToText(
            professionalProfile?.featuredLinks ?? [],
        ),
    };
}

export default function ProfessionalProfileTab() {
    const toast = useToast();
    const [data, setData] = useState<ProfessionalProfileEditorResponse | null>(
        null,
    );
    const [form, setForm] = useState<ProfessionalProfileFormState>(
        createInitialFormState(null),
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/profiles/me/professional", {
                cache: "no-store",
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load profile");
            }

            setData(result.data);
            setForm(createInitialFormState(result.data.professionalProfile));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to load professional profile",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const verificationSummary = useMemo(() => {
        return (data?.verifications ?? []).map((verification) => ({
            ...verification,
            label:
                verification.verificationType === "instructor_verification"
                    ? "Instructor verification"
                    : "Partner verification",
        }));
    }, [data?.verifications]);

    const handleRoleToggle = (role: ProfessionalRole) => {
        setForm((current) => ({
            ...current,
            profileRoles: current.profileRoles.includes(role)
                ? current.profileRoles.filter((item) => item !== role)
                : [...current.profileRoles, role],
        }));
    };

    const handleSaveDraft = async () => {
        try {
            setSaving(true);
            const response = await fetch("/api/profiles/me/professional", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    profileRoles: form.profileRoles,
                    headline: form.headline,
                    summary: form.summary,
                    yearsExperience: form.yearsExperience
                        ? Number(form.yearsExperience)
                        : null,
                    currentTitle: form.currentTitle,
                    currentOrganization: form.currentOrganization,
                    location: form.location,
                    skills: form.skills
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    educationItems: parseLineItems(form.educationItems),
                    careerItems: parseLineItems(form.careerItems),
                    achievementItems: parseLineItems(form.achievementItems),
                    featuredLinks: parseFeaturedLinks(form.featuredLinks),
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to save draft");
            }

            setData(result.data);
            setForm(createInitialFormState(result.data.professionalProfile));
            toast.success("Professional profile draft saved");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to save draft",
            );
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForReview = async () => {
        try {
            setSubmitting(true);
            const response = await fetch(
                "/api/profiles/me/professional/submit",
                {
                    method: "POST",
                },
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to submit professional profile",
                );
            }

            setData(result.data);
            toast.success("Professional profile submitted for review");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to submit professional profile",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[320px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Professional Profile
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Save a draft, then submit it for admin review once the
                        matching role and verification are active.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(data?.badges ?? []).map((badge) => (
                        <div
                            key={badge.code}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                        >
                            <VerifiedBadge badge={badge} className="h-5 w-5" />
                            <span>{badge.code.replace(/_/g, " ")}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_0.28fr]">
                <div className="space-y-6">
                    <section className="rounded-3xl border border-gray-200 bg-white p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-white">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">
                                    Roles and publishing
                                </h3>
                                <p className="text-sm text-gray-500">
                                    The backend decides whether the profile can be
                                    published.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {(["instructor", "partner"] as ProfessionalRole[]).map(
                                (role) => (
                                    <label
                                        key={role}
                                        className={`rounded-2xl border px-4 py-3 transition ${
                                            form.profileRoles.includes(role)
                                                ? "border-gray-900 bg-gray-900 text-white"
                                                : "border-gray-200 bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={form.profileRoles.includes(
                                                role,
                                            )}
                                            onChange={() => handleRoleToggle(role)}
                                        />
                                        <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                                            {role}
                                        </p>
                                        <p className="mt-1 text-sm opacity-80">
                                            {role === "instructor"
                                                ? "Education, teaching history, and courses."
                                                : "Organization, collaborations, and featured work."}
                                        </p>
                                    </label>
                                ),
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-gray-200 bg-white p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <InputField
                                label="Headline"
                                value={form.headline}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        headline: value,
                                    }))
                                }
                                placeholder="Senior embedded systems instructor"
                            />
                            <InputField
                                label="Years of experience"
                                value={form.yearsExperience}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        yearsExperience: value,
                                    }))
                                }
                                placeholder="8"
                            />
                            <InputField
                                label="Current title"
                                value={form.currentTitle}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        currentTitle: value,
                                    }))
                                }
                                placeholder="Lead AIoT Instructor"
                            />
                            <InputField
                                label="Current organization"
                                value={form.currentOrganization}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        currentOrganization: value,
                                    }))
                                }
                                placeholder="Nexa Labs"
                            />
                            <InputField
                                label="Location"
                                value={form.location}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        location: value,
                                    }))
                                }
                                placeholder="Ho Chi Minh City"
                            />
                            <InputField
                                label="Skills"
                                value={form.skills}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        skills: value,
                                    }))
                                }
                                placeholder="C, ESP32, Edge AI, Computer Vision"
                            />
                        </div>

                        <div className="mt-4">
                            <TextAreaField
                                label="Summary"
                                value={form.summary}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        summary: value,
                                    }))
                                }
                                placeholder="Describe your expertise, focus, and credibility."
                                rows={5}
                            />
                        </div>
                    </section>

                    <section className="rounded-3xl border border-gray-200 bg-white p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <TextAreaField
                                label="Education"
                                value={form.educationItems}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        educationItems: value,
                                    }))
                                }
                                placeholder="Degree | School or short note"
                                rows={5}
                            />
                            <TextAreaField
                                label="Career"
                                value={form.careerItems}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        careerItems: value,
                                    }))
                                }
                                placeholder="Role | Company or short note"
                                rows={5}
                            />
                            <TextAreaField
                                label="Achievements"
                                value={form.achievementItems}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        achievementItems: value,
                                    }))
                                }
                                placeholder="Achievement | Context"
                                rows={5}
                            />
                            <TextAreaField
                                label="Featured links"
                                value={form.featuredLinks}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        featuredLinks: value,
                                    }))
                                }
                                placeholder="Portfolio | https://example.com"
                                rows={5}
                            />
                        </div>
                    </section>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Save draft
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmitForReview}
                            disabled={
                                submitting ||
                                !data?.capabilities.canPublishProfessionalProfile
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            Submit for review
                        </button>
                    </div>
                </div>

                <aside className="space-y-4">
                    <StatusCard
                        title="Workflow"
                        icon={<Sparkles className="h-5 w-5" />}
                        content={
                            <>
                                <p className="text-2xl font-semibold capitalize text-gray-900">
                                    {data?.professionalProfile?.status?.replace(
                                        /_/g,
                                        " ",
                                    ) || "draft"}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    Only published profiles are visible publicly.
                                </p>
                            </>
                        }
                    />

                    <StatusCard
                        title="Publishing readiness"
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        content={
                            <p
                                className={`text-sm font-semibold ${
                                    data?.capabilities.canPublishProfessionalProfile
                                        ? "text-emerald-600"
                                        : "text-amber-600"
                                }`}
                            >
                                {data?.capabilities.canPublishProfessionalProfile
                                    ? "Eligible for review and publish"
                                    : "Missing a matching verified role or verification"}
                            </p>
                        }
                    />

                    <StatusCard
                        title="Verifications"
                        icon={<ShieldCheck className="h-5 w-5" />}
                        content={
                            <div className="space-y-3">
                                {verificationSummary.length > 0 ? (
                                    verificationSummary.map((verification) => (
                                        <div
                                            key={verification.verificationType}
                                            className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">
                                                {verification.label}
                                            </p>
                                            <p className="mt-1 text-sm capitalize text-gray-600">
                                                {verification.status.replace(
                                                    /_/g,
                                                    " ",
                                                )}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        No verification records yet.
                                    </p>
                                )}
                            </div>
                        }
                    />

                    {data?.professionalProfile?.reviewNotes ? (
                        <StatusCard
                            title="Admin notes"
                            icon={<AlertTriangle className="h-5 w-5" />}
                            content={
                                <p className="text-sm leading-6 text-gray-600">
                                    {data.professionalProfile.reviewNotes}
                                </p>
                            }
                        />
                    ) : null}

                    <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm leading-6 text-gray-600">
                        <p className="font-semibold text-gray-900">
                            Input format
                        </p>
                        <p className="mt-2">
                            Use one line per item. For structured entries, write
                            `Title | Description`. Featured links use
                            `Label | URL`.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function StatusCard({
    title,
    icon,
    content,
}: {
    title: string;
    icon: ReactNode;
    content: ReactNode;
}) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-white">
                    {icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            {content}
        </section>
    );
}

function InputField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
                {label}
            </label>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
            />
        </div>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    rows,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    rows: number;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:outline-none"
            />
        </div>
    );
}
