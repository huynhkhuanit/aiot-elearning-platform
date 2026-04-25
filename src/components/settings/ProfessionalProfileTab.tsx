"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    BriefcaseBusiness,
    CheckCircle2,
    Clock,
    GraduationCap,
    Info,
    Loader2,
    Save,
    Send,
    ShieldCheck,
    Sparkles,
    XCircle,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import type {
    AppRole,
    ProfessionalProfileEditorResponse,
    ProfessionalProfileRecord,
    ProfessionalProfileStatus,
    VerificationStatus,
} from "@/types/profile";

type ProfessionalRole = Extract<AppRole, "instructor" | "partner">;

const STATUS_CONFIG: Record<
    ProfessionalProfileStatus,
    {
        label: string;
        description: string;
        icon: typeof CheckCircle2;
        color: string;
        bg: string;
        border: string;
    }
> = {
    draft: {
        label: "Bản nháp",
        description: "Hồ sơ chỉ được lưu cục bộ, chưa gửi duyệt.",
        icon: Save,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
    },
    pending_review: {
        label: "Đang chờ duyệt",
        description: "Hồ sơ đang được quản trị viên xem xét.",
        icon: Clock,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
    },
    published: {
        label: "Đã xuất bản",
        description: "Hồ sơ đã được duyệt và hiển thị công khai.",
        icon: CheckCircle2,
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
    },
    rejected: {
        label: "Bị từ chối",
        description: "Hồ sơ chưa đạt yêu cầu duyệt. Xem ghi chú bên dưới.",
        icon: XCircle,
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
    },
};

const VERIFICATION_STATUS_LABELS: Record<
    VerificationStatus,
    { label: string; color: string }
> = {
    pending: { label: "Đang chờ", color: "text-amber-600" },
    verified: { label: "Đã xác thực", color: "text-emerald-600" },
    rejected: { label: "Bị từ chối", color: "text-red-600" },
    revoked: { label: "Đã thu hồi", color: "text-gray-500" },
};

const BADGE_LABELS: Record<string, string> = {
    verified_instructor: "Giảng viên xác thực",
    verified_partner: "Đối tác xác thực",
};

const VERIFICATION_TYPE_LABELS: Record<string, string> = {
    instructor_verification: "Xác thực giảng viên",
    partner_verification: "Xác thực đối tác",
};

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
                throw new Error(
                    result.message || "Không thể tải hồ sơ chuyên môn",
                );
            }

            setData(result.data);
            setForm(createInitialFormState(result.data.professionalProfile));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể tải hồ sơ chuyên môn",
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
                VERIFICATION_TYPE_LABELS[verification.verificationType] ??
                verification.verificationType,
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
                throw new Error(
                    result.message || "Không thể lưu bản nháp",
                );
            }

            setData(result.data);
            setForm(createInitialFormState(result.data.professionalProfile));
            toast.success("Đã lưu bản nháp hồ sơ chuyên môn");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể lưu bản nháp",
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
                    result.message || "Không thể gửi hồ sơ chuyên môn",
                );
            }

            setData(result.data);
            toast.success("Đã gửi hồ sơ chuyên môn để duyệt");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Không thể gửi hồ sơ chuyên môn",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="text-xs text-gray-500">
                    Đang tải hồ sơ chuyên môn...
                </p>
            </div>
        );
    }

    const currentStatus: ProfessionalProfileStatus =
        data?.professionalProfile?.status ?? "draft";
    const statusInfo = STATUS_CONFIG[currentStatus];
    const StatusIcon = statusInfo.icon;
    const canPublish =
        data?.capabilities.canPublishProfessionalProfile ?? false;

    return (
        <div className="space-y-6">
            {/* Heading */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">
                        Hồ sơ chuyên môn
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Lưu bản nháp, sau đó gửi cho quản trị viên duyệt khi
                        vai trò và xác thực phù hợp đã được kích hoạt.
                    </p>
                </div>

                {(data?.badges ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {(data?.badges ?? []).map((badge) => (
                            <div
                                key={badge.code}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                            >
                                <VerifiedBadge
                                    badge={badge}
                                    className="h-4 w-4"
                                />
                                <span>
                                    {BADGE_LABELS[badge.code] ?? badge.code}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Banner */}
            <div
                className={`p-4 rounded-xl border ${statusInfo.border} ${statusInfo.bg}`}
            >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <StatusIcon
                            className={`w-5 h-5 ${statusInfo.color} mt-0.5 shrink-0`}
                        />
                        <div className="min-w-0">
                            <p
                                className={`font-semibold text-sm ${statusInfo.color}`}
                            >
                                {statusInfo.label}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                                {statusInfo.description}
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                            canPublish
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                    >
                        {canPublish ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đủ điều kiện duyệt
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Chưa đủ điều kiện
                            </>
                        )}
                    </span>
                </div>
            </div>

            {/* Roles Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900">
                        Vai trò chuyên môn
                    </span>
                </div>
                <p className="text-xs text-gray-500 ml-6 -mt-1.5">
                    Hệ thống sẽ kiểm tra vai trò xác thực phù hợp trước khi
                    cho phép xuất bản.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(["instructor", "partner"] as ProfessionalRole[]).map(
                        (role) => {
                            const isActive =
                                form.profileRoles.includes(role);
                            const RoleIcon =
                                role === "instructor"
                                    ? GraduationCap
                                    : BriefcaseBusiness;
                            return (
                                <label
                                    key={role}
                                    className={`block cursor-pointer rounded-xl border-2 px-4 py-3 transition-all ${
                                        isActive
                                            ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={isActive}
                                        onChange={() =>
                                            handleRoleToggle(role)
                                        }
                                    />
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                                isActive
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <RoleIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    isActive
                                                        ? "text-indigo-700"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {role === "instructor"
                                                    ? "Giảng viên"
                                                    : "Đối tác"}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                                {role === "instructor"
                                                    ? "Học vấn, lịch sử giảng dạy và các khóa học."
                                                    : "Tổ chức, hợp tác và các dự án nổi bật."}
                                            </p>
                                        </div>
                                        {isActive && (
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                        )}
                                    </div>
                                </label>
                            );
                        },
                    )}
                </div>
            </div>

            {/* Profile Info Section */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900">
                        Thông tin chuyên môn
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Tiêu đề (headline)"
                        value={form.headline}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                headline: value,
                            }))
                        }
                        placeholder="Giảng viên hệ thống nhúng cấp cao"
                    />
                    <InputField
                        label="Số năm kinh nghiệm"
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
                        label="Chức danh hiện tại"
                        value={form.currentTitle}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                currentTitle: value,
                            }))
                        }
                        placeholder="Giảng viên AIoT chính"
                    />
                    <InputField
                        label="Tổ chức hiện tại"
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
                        label="Địa điểm"
                        value={form.location}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                location: value,
                            }))
                        }
                        placeholder="Hồ Chí Minh"
                    />
                    <InputField
                        label="Kỹ năng"
                        value={form.skills}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                skills: value,
                            }))
                        }
                        placeholder="C, ESP32, Edge AI, Computer Vision"
                        hint="Phân tách bằng dấu phẩy"
                    />
                </div>
                <TextAreaField
                    label="Tóm tắt"
                    value={form.summary}
                    onChange={(value) =>
                        setForm((current) => ({
                            ...current,
                            summary: value,
                        }))
                    }
                    placeholder="Mô tả chuyên môn, lĩnh vực tập trung và uy tín của bạn."
                    rows={4}
                />
            </div>

            {/* Detailed Entries Section */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900">
                        Học vấn, sự nghiệp & thành tựu
                    </span>
                </div>
                <div className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Mỗi mục viết trên một dòng. Định dạng:{" "}
                        <code className="px-1 py-0.5 bg-white rounded border border-blue-200 font-mono text-[11px]">
                            Tiêu đề | Mô tả
                        </code>
                        . Liên kết nổi bật dùng{" "}
                        <code className="px-1 py-0.5 bg-white rounded border border-blue-200 font-mono text-[11px]">
                            Tên | URL
                        </code>
                        .
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextAreaField
                        label="Học vấn"
                        value={form.educationItems}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                educationItems: value,
                            }))
                        }
                        placeholder="Bằng cấp | Trường hoặc ghi chú ngắn"
                        rows={5}
                    />
                    <TextAreaField
                        label="Sự nghiệp"
                        value={form.careerItems}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                careerItems: value,
                            }))
                        }
                        placeholder="Vị trí | Công ty hoặc ghi chú ngắn"
                        rows={5}
                    />
                    <TextAreaField
                        label="Thành tựu"
                        value={form.achievementItems}
                        onChange={(value) =>
                            setForm((current) => ({
                                ...current,
                                achievementItems: value,
                            }))
                        }
                        placeholder="Thành tựu | Bối cảnh"
                        rows={5}
                    />
                    <TextAreaField
                        label="Liên kết nổi bật"
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
            </div>

            {/* Verifications Section */}
            {verificationSummary.length > 0 && (
                <div className="border-t border-gray-100 pt-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-gray-900">
                            Trạng thái xác thực
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {verificationSummary.map((verification) => {
                            const vstatus =
                                VERIFICATION_STATUS_LABELS[
                                    verification.status
                                ] ?? {
                                    label: verification.status,
                                    color: "text-gray-600",
                                };
                            return (
                                <div
                                    key={verification.verificationType}
                                    className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-900">
                                            {verification.label}
                                        </p>
                                        <p
                                            className={`text-xs font-medium mt-0.5 ${vstatus.color}`}
                                        >
                                            {vstatus.label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Admin Notes */}
            {data?.professionalProfile?.reviewNotes ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-amber-900 mb-1">
                            Ghi chú từ quản trị viên
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed whitespace-pre-line">
                            {data.professionalProfile.reviewNotes}
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
                <button
                    type="button"
                    onClick={handleSubmitForReview}
                    disabled={submitting || !canPublish}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                    {submitting ? "Đang gửi..." : "Gửi duyệt"}
                </button>
            </div>
        </div>
    );
}

function InputField({
    label,
    value,
    onChange,
    placeholder,
    hint,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    hint?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label}
            </label>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
            />
            {hint && (
                <p className="text-[11px] text-gray-400 mt-1.5">{hint}</p>
            )}
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label}
            </label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none"
            />
        </div>
    );
}
