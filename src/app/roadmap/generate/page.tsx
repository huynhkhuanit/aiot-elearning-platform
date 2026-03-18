"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Sparkles, Target, Clock, Zap } from "lucide-react";
import Link from "next/link";
import OnboardingForm from "@/components/AIRoadmap/OnboardingForm";
import type { UserProfile } from "@/types/ai-roadmap";
import { useAuth } from "@/contexts/AuthContext";

export default function GenerateRoadmapPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    const handleSubmit = async (profile: UserProfile) => {
        if (!isAuthenticated) {
            setError("Vui lòng đăng nhập để tạo lộ trình.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setWarning(null);

        try {
            const response = await fetch("/api/ai-roadmap/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ profile }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Không thể tạo lộ trình.");
            }

            if (data.warning) {
                setWarning(data.warning);
            }

            if (data.data.id.startsWith("temp-")) {
                const tempRoadmap = {
                    id: data.data.id,
                    ...data.data,
                    saved_at: new Date().toISOString(),
                };
                localStorage.setItem(
                    `temp-roadmap-${data.data.id}`,
                    JSON.stringify(tempRoadmap),
                );
            }

            router.push(`/roadmap/my/${data.data.id}`);
        } catch (err) {
            console.error("Error generating roadmap:", err);
            setError(
                err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="roadmap-route">
            <section className="roadmap-shell__hero">
                <div className="roadmap-shell roadmap-shell__hero-grid">
                    <div>
                        <span className="roadmap-shell__eyebrow">
                            <Sparkles className="h-4 w-4" />
                            AI roadmap generator
                        </span>
                        <h1 className="roadmap-shell__title">
                            Tạo lộ trình học tập theo hồ sơ của bạn
                        </h1>
                        <p className="roadmap-shell__description">
                            AI phân tích mục tiêu, kỹ năng hiện tại và quỹ thời gian
                            để tạo ra một roadmap có thứ tự rõ ràng, đủ sâu và dễ theo dõi.
                        </p>

                        <div className="roadmap-shell__actions">
                            <Link href="/roadmap" className="roadmap-button roadmap-button--dark">
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại thư viện
                            </Link>
                            <Link href="/roadmap/my" className="roadmap-button roadmap-button--dark">
                                <Brain className="h-4 w-4" />
                                Xem roadmap đã tạo
                            </Link>
                        </div>
                    </div>

                    <div className="roadmap-shell__panel">
                        <div>
                            <h2 className="roadmap-shell__panel-title">
                                Input gọn, output theo dạng tree viewer
                            </h2>
                            <p className="roadmap-shell__panel-copy">
                                Sau khi trả lời form, roadmap AI sẽ mở trong cùng
                                shell viewer với roadmap chuẩn để bạn không phải học lại giao diện.
                            </p>
                        </div>

                        <div className="roadmap-shell__meta">
                            <span className="roadmap-shell__meta-item">
                                <Target className="h-4 w-4" />
                                Cá nhân hóa mục tiêu
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <Clock className="h-4 w-4" />
                                Cân theo thời gian học
                            </span>
                            <span className="roadmap-shell__meta-item">
                                <Zap className="h-4 w-4" />
                                Mở nhanh trong viewer
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="roadmap-shell roadmap-shell__body">
                <div className="grid gap-6 lg:grid-cols-[0.72fr_1.08fr]">
                    <div className="roadmap-surface p-6 md:p-8">
                        <div className="roadmap-section-heading">
                            <div>
                                <h2 className="roadmap-section-heading__title">
                                    Trước khi bắt đầu
                                </h2>
                                <p className="roadmap-section-heading__body">
                                    Trả lời form theo mức độ trung thực về kỹ năng
                                    hiện tại để AI sắp đúng thứ tự chủ đề và độ sâu.
                                </p>
                            </div>
                        </div>

                        <div className="roadmap-simple-list">
                            {[
                                "Chọn đúng vai trò mục tiêu và các chủ đề muốn đào sâu.",
                                "Khai báo quỹ thời gian hàng tuần sát thực tế để roadmap không bị quá tải.",
                                "Sau khi tạo xong, bạn có thể đánh dấu tiến độ ngay trên từng node.",
                            ].map((item) => (
                                <div key={item} className="roadmap-simple-list__item">
                                    <div>
                                        <p className="font-bold text-roadmap-ink">
                                            Gợi ý
                                        </p>
                                        <p className="roadmap-simple-list__copy">
                                            {item}
                                        </p>
                                    </div>
                                    <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
                                </div>
                            ))}
                        </div>

                        {!isAuthenticated ? (
                            <div className="mt-6 rounded-[24px] bg-slate-950 p-6 text-white">
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                                    Cần đăng nhập
                                </p>
                                <h3 className="mt-3 !text-[1.35rem] font-bold tracking-[-0.04em] text-white">
                                    Đăng nhập để lưu roadmap và đồng bộ tiến độ.
                                </h3>
                                <p className="mt-3 text-sm leading-7 text-slate-300">
                                    Bạn vẫn có thể xem roadmap tạm thời, nhưng đăng nhập sẽ giúp lưu bền vững và quay lại sau.
                                </p>
                                <div className="mt-5">
                                    <Link href="/auth/login" className="roadmap-button roadmap-button--primary">
                                        Đăng nhập ngay
                                    </Link>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-4">
                        {error ? (
                            <div className="roadmap-notice roadmap-notice--error">
                                {error}
                            </div>
                        ) : null}

                        {warning ? (
                            <div className="roadmap-notice roadmap-notice--warning">
                                {warning}
                            </div>
                        ) : null}

                        <div className="roadmap-form-shell">
                            {isAuthenticated ? (
                                <OnboardingForm onSubmit={handleSubmit} isLoading={isLoading} />
                            ) : (
                                <div className="roadmap-empty-state">
                                    <Brain className="mx-auto h-10 w-10 text-slate-300" />
                                    <div className="roadmap-empty-state__title">
                                        Đăng nhập để bắt đầu
                                    </div>
                                    <p className="roadmap-empty-state__body">
                                        Form tạo roadmap AI sẽ mở ngay sau khi bạn đăng nhập.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
