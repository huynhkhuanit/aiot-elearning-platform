"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    Loader2,
    ShieldCheck,
    ShieldOff,
    UserCog,
    XCircle,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import type { AppRole, ProfileReviewSummary, VerificationType } from "@/types/profile";

const PROFESSIONAL_ROLES: Array<Extract<AppRole, "instructor" | "partner">> = [
    "instructor",
    "partner",
];

const VERIFICATION_TYPE_BY_ROLE: Record<
    Extract<AppRole, "instructor" | "partner">,
    VerificationType
> = {
    instructor: "instructor_verification",
    partner: "partner_verification",
};

export default function ProfileReviewQueue() {
    const toast = useToast();
    const [reviews, setReviews] = useState<ProfileReviewSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadReviews = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                "/api/admin/profile-reviews?status=pending_review",
                { cache: "no-store" },
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load review queue");
            }

            setReviews(result.data ?? []);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to load review queue",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const updateRoles = async (
        review: ProfileReviewSummary,
        role: Extract<AppRole, "instructor" | "partner">,
    ) => {
        try {
            setBusyId(`${review.userId}-role-${role}`);
            const nextRoles = review.roles.includes(role)
                ? review.roles.filter((item) => item !== role)
                : [...review.roles, role];
            const response = await fetch(
                `/api/admin/users/${review.userId}/roles`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ roles: nextRoles }),
                },
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to update roles");
            }

            await loadReviews();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Unable to update roles",
            );
        } finally {
            setBusyId(null);
        }
    };

    const updateVerification = async (
        review: ProfileReviewSummary,
        role: Extract<AppRole, "instructor" | "partner">,
    ) => {
        try {
            setBusyId(`${review.userId}-verification-${role}`);
            const verificationType = VERIFICATION_TYPE_BY_ROLE[role];
            const current = review.verifications.find(
                (item) => item.verificationType === verificationType,
            );
            const nextStatus =
                current?.status === "verified" ? "revoked" : "verified";

            const response = await fetch(
                `/api/admin/users/${review.userId}/verifications`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        verifications: [
                            {
                                verificationType,
                                status: nextStatus,
                            },
                        ],
                    }),
                },
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to update verification",
                );
            }

            await loadReviews();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to update verification",
            );
        } finally {
            setBusyId(null);
        }
    };

    const decideReview = async (
        review: ProfileReviewSummary,
        action: "approve" | "reject",
    ) => {
        try {
            setBusyId(`${review.userId}-${action}`);
            const response = await fetch(
                `/api/admin/profile-reviews/${review.userId}/${action}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        reviewNotes:
                            action === "approve"
                                ? "Approved from admin dashboard review queue."
                                : "Rejected from admin dashboard review queue.",
                    }),
                },
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || `Unable to ${action} profile review`,
                );
            }

            toast.success(
                action === "approve"
                    ? "Profile approved"
                    : "Profile rejected",
            );
            await loadReviews();
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Unable to ${action} profile review`,
            );
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className="rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-6 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-100">
                        Profile Review Queue
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Approvals are blocked until the requested role and its
                        matching verification are active.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
                    <Clock3 className="h-3.5 w-3.5" />
                    {loading ? "Loading" : `${reviews.length} pending`}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-200">
                        No pending professional profile reviews
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                        New submissions will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <article
                            key={review.userId}
                            className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5"
                        >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div>
                                            <p className="text-lg font-semibold text-slate-100">
                                                {review.displayName}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                @{review.username}
                                            </p>
                                        </div>
                                        {review.badges.map((badge) => (
                                            <VerifiedBadge
                                                key={badge.code}
                                                badge={badge}
                                            />
                                        ))}
                                    </div>

                                    <p className="max-w-3xl text-sm leading-6 text-slate-400">
                                        {review.headline || "No headline provided."}
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        {review.profileRoles.map((role) => (
                                            <span
                                                key={`${review.userId}-${role}-requested`}
                                                className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300"
                                            >
                                                requested: {role}
                                            </span>
                                        ))}
                                        {review.roles.map((role) => (
                                            <span
                                                key={`${review.userId}-${role}-active`}
                                                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                                            >
                                                active: {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                        review.canPublish
                                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                            : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
                                    }`}
                                >
                                    {review.canPublish
                                        ? "Ready to publish"
                                        : "Needs role/verification fix"}
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                        <UserCog className="h-4 w-4" />
                                        Role and verification controls
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {PROFESSIONAL_ROLES.map((role) => {
                                            const verificationType =
                                                VERIFICATION_TYPE_BY_ROLE[role];
                                            const verificationStatus =
                                                review.verifications.find(
                                                    (item) =>
                                                        item.verificationType ===
                                                        verificationType,
                                                )?.status ?? "pending";
                                            const roleBusy =
                                                busyId ===
                                                `${review.userId}-role-${role}`;
                                            const verificationBusy =
                                                busyId ===
                                                `${review.userId}-verification-${role}`;

                                            return (
                                                <div
                                                    key={`${review.userId}-${role}`}
                                                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                                                >
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                        {role}
                                                    </p>
                                                    <p className="mt-2 text-sm text-slate-200">
                                                        Role:{" "}
                                                        {review.roles.includes(role)
                                                            ? "active"
                                                            : "inactive"}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-400">
                                                        Verification:{" "}
                                                        {verificationStatus.replace(
                                                            /_/g,
                                                            " ",
                                                        )}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateRoles(
                                                                    review,
                                                                    role,
                                                                )
                                                            }
                                                            disabled={roleBusy}
                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-60"
                                                        >
                                                            {roleBusy ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <UserCog className="h-3.5 w-3.5" />
                                                            )}
                                                            {review.roles.includes(role)
                                                                ? "Remove role"
                                                                : "Assign role"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                updateVerification(
                                                                    review,
                                                                    role,
                                                                )
                                                            }
                                                            disabled={
                                                                verificationBusy
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 disabled:opacity-60"
                                                        >
                                                            {verificationBusy ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : verificationStatus ===
                                                              "verified" ? (
                                                                <ShieldOff className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                            )}
                                                            {verificationStatus ===
                                                            "verified"
                                                                ? "Revoke verification"
                                                                : "Verify"}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Review decision
                                    </div>
                                    <p className="text-sm leading-6 text-slate-400">
                                        {review.reviewNotes ||
                                            "No admin note has been added yet."}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                decideReview(review, "approve")
                                            }
                                            disabled={
                                                busyId ===
                                                    `${review.userId}-approve` ||
                                                !review.canPublish
                                            }
                                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {busyId ===
                                            `${review.userId}-approve` ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                decideReview(review, "reject")
                                            }
                                            disabled={
                                                busyId ===
                                                `${review.userId}-reject`
                                            }
                                            className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {busyId ===
                                            `${review.userId}-reject` ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
