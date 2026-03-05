"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Star,
    ThumbsUp,
    ChevronDown,
    MessageSquare,
    Loader2,
    Trash2,
    Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarWithProBadge from "@/components/AvatarWithProBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface ReviewUser {
    id: string;
    name: string;
    username: string;
    avatar: string;
}

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    helpfulCount: number;
    createdAt: string;
    updatedAt: string;
    isLiked: boolean;
    user: ReviewUser;
}

interface UserReview {
    id: string;
    rating: number;
    comment: string | null;
    helpful_count: number;
    created_at: string;
    updated_at: string;
}

interface ReviewData {
    reviews: Review[];
    userReview: UserReview | null;
    distribution: Record<number, number>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface CourseReviewsProps {
    courseSlug: string;
    courseRating: number;
    ratingCount: number;
    isEnrolled: boolean;
    readOnly?: boolean;
}

const SORT_OPTIONS = [
    { value: "newest", label: "Mới nhất" },
    { value: "highest", label: "Đánh giá cao" },
    { value: "lowest", label: "Đánh giá thấp" },
    { value: "helpful", label: "Hữu ích nhất" },
];

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;
    return `${Math.floor(diff / 31536000)} năm trước`;
}

// ═══════════════════════════════════════════
// Star Rating Picker (Interactive)
// ═══════════════════════════════════════════
function StarPicker({
    value,
    onChange,
    size = 28,
    readonly = false,
}: {
    value: number;
    onChange?: (v: number) => void;
    size?: number;
    readonly?: boolean;
}) {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className={`transition-all duration-150 ${!readonly ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
                >
                    <Star
                        style={{ width: size, height: size }}
                        className={`transition-colors duration-150 ${
                            star <= (hover || value)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-600"
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
// Rating Breakdown (5-bar chart)
// ═══════════════════════════════════════════
function RatingBreakdown({
    distribution,
    avgRating,
    totalReviews,
    onFilterClick,
    activeFilter,
}: {
    distribution: Record<number, number>;
    avgRating: number;
    totalReviews: number;
    onFilterClick: (star: number | null) => void;
    activeFilter: number | null;
}) {
    const maxCount = Math.max(...Object.values(distribution), 1);

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8">
            {/* Overall Rating */}
            <div className="text-center mb-6">
                <div className="text-6xl font-extrabold text-white mb-2">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <StarPicker value={Math.round(avgRating)} readonly size={22} />
                <p className="text-gray-400 text-sm mt-2">
                    {totalReviews > 0
                        ? `${totalReviews.toLocaleString()} đánh giá`
                        : "Chưa có đánh giá"}
                </p>
            </div>

            {/* Distribution Bars */}
            <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                    const count = distribution[star] || 0;
                    const pct = totalReviews > 0 ? (count / maxCount) * 100 : 0;
                    const isActive = activeFilter === star;

                    return (
                        <button
                            key={star}
                            onClick={() =>
                                onFilterClick(isActive ? null : star)
                            }
                            className={`w-full flex items-center gap-3 group transition-all py-1 px-2 rounded-lg ${isActive ? "bg-indigo-500/10" : "hover:bg-white/5"}`}
                        >
                            <span className="text-sm font-semibold text-gray-300 w-8 text-right flex items-center justify-end gap-1">
                                {star}
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            </span>
                            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{
                                        duration: 0.6,
                                        ease: "easeOut",
                                    }}
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                />
                            </div>
                            <span className="text-xs text-gray-400 w-10 text-right font-medium">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// Review Card
// ═══════════════════════════════════════════
function ReviewCard({
    review,
    onLike,
    liking,
    isOwnReview,
    onEdit,
    onDelete,
}: {
    review: Review;
    onLike: (reviewId: string) => void;
    liking: string | null;
    isOwnReview: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-white/15 transition-colors"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <AvatarWithProBadge
                        avatarUrl={review.user.avatar}
                        fullName={review.user.name || "User"}
                        isPro={false}
                        size="sm"
                    />
                    <div>
                        <p className="text-white font-semibold text-sm">
                            {review.user.name || "Người dùng"}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {timeAgo(review.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StarPicker value={review.rating} readonly size={16} />
                    {isOwnReview && (
                        <div className="flex items-center gap-1 ml-2">
                            <button
                                onClick={onEdit}
                                className="p-1.5 text-gray-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-white/5"
                                title="Chỉnh sửa"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                                title="Xóa"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comment */}
            {review.comment && (
                <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    {review.comment}
                </p>
            )}

            {/* Helpful Button */}
            <div className="flex items-center">
                <button
                    onClick={() => onLike(review.id)}
                    disabled={liking === review.id || isOwnReview}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border ${
                        review.isLiked
                            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                            : "bg-white/5 border-white/10 text-gray-400 hover:text-indigo-400 hover:border-indigo-500/20"
                    } ${isOwnReview ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {liking === review.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <ThumbsUp
                            className={`w-3.5 h-3.5 ${review.isLiked ? "fill-indigo-400" : ""}`}
                        />
                    )}
                    <span>
                        Hữu ích
                        {review.helpfulCount > 0
                            ? ` (${review.helpfulCount})`
                            : ""}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════
// Review Form
// ═══════════════════════════════════════════
function ReviewForm({
    existingReview,
    onSubmit,
    submitting,
    onCancel,
}: {
    existingReview?: UserReview | null;
    onSubmit: (rating: number, comment: string) => void;
    submitting: boolean;
    onCancel?: () => void;
}) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || "");

    useEffect(() => {
        if (existingReview) {
            setRating(existingReview.rating);
            setComment(existingReview.comment || "");
        }
    }, [existingReview]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        onSubmit(rating, comment);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                {existingReview ? "Cập nhật đánh giá" : "Viết đánh giá của bạn"}
            </h3>

            {/* Star Picker */}
            <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                    Đánh giá của bạn *
                </label>
                <StarPicker value={rating} onChange={setRating} size={32} />
                {rating > 0 && (
                    <p className="text-xs text-indigo-400 mt-1">
                        {rating === 5
                            ? "Tuyệt vời!"
                            : rating === 4
                              ? "Rất tốt"
                              : rating === 3
                                ? "Tốt"
                                : rating === 2
                                  ? "Tạm được"
                                  : "Không hài lòng"}
                    </p>
                )}
            </div>

            {/* Comment */}
            <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">
                    Nhận xét (không bắt buộc)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về khóa học..."
                    rows={4}
                    maxLength={2000}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 resize-none transition-all"
                />
                <p className="text-xs text-gray-500 text-right mt-1">
                    {comment.length}/2000
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={rating === 0 || submitting}
                    className="relative overflow-hidden font-bold py-3 px-6 rounded-xl text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                        background: "linear-gradient(135deg, #6366f1, #9333ea)",
                    }}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang gửi...
                        </>
                    ) : existingReview ? (
                        "Cập nhật đánh giá"
                    ) : (
                        "Gửi đánh giá"
                    )}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                        Hủy
                    </button>
                )}
            </div>
        </form>
    );
}

// ═══════════════════════════════════════════
// Main Component: CourseReviews
// ═══════════════════════════════════════════
export default function CourseReviews({
    courseSlug,
    courseRating,
    ratingCount,
    isEnrolled,
    readOnly = false,
}: CourseReviewsProps) {
    const { isAuthenticated, user } = useAuth();
    const toast = useToast();

    const [data, setData] = useState<ReviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("newest");
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [liking, setLiking] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Derived state
    const avgRating = data ? (data.pagination.total > 0 ? courseRating : 0) : 0;
    const totalReviews = data?.pagination.total || ratingCount || 0;

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
                sort,
            });
            if (filterRating) params.set("rating", filterRating.toString());

            const res = await fetch(
                `/api/courses/${courseSlug}/reviews?${params}`,
                {
                    credentials: "include",
                },
            );
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch {
            console.error("Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    }, [courseSlug, page, sort, filterRating]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Submit review
    const handleSubmitReview = async (rating: number, comment: string) => {
        try {
            setSubmitting(true);
            const res = await fetch(`/api/courses/${courseSlug}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ rating, comment }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success(json.message);
                setShowForm(false);
                setEditMode(false);
                fetchReviews();
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error("Lỗi khi gửi đánh giá");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete review
    const handleDeleteReview = async () => {
        if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
        try {
            const res = await fetch(`/api/courses/${courseSlug}/reviews`, {
                method: "DELETE",
                credentials: "include",
            });
            const json = await res.json();
            if (json.success) {
                toast.success(json.message);
                fetchReviews();
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error("Lỗi khi xóa đánh giá");
        }
    };

    // Toggle like
    const handleLike = async (reviewId: string) => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để thích đánh giá");
            return;
        }
        try {
            setLiking(reviewId);
            const res = await fetch(`/api/courses/${courseSlug}/reviews/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ reviewId }),
            });
            const json = await res.json();
            if (json.success) {
                // Optimistic update
                setData((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        reviews: prev.reviews.map((r) =>
                            r.id === reviewId
                                ? {
                                      ...r,
                                      isLiked: json.data.liked,
                                      helpfulCount: json.data.helpfulCount,
                                  }
                                : r,
                        ),
                    };
                });
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error("Lỗi khi thực hiện");
        } finally {
            setLiking(null);
        }
    };

    // Filter/Sort handlers
    const handleFilterClick = (star: number | null) => {
        setFilterRating(star);
        setPage(1);
    };

    const handleSortChange = (value: string) => {
        setSort(value);
        setPage(1);
        setShowSortDropdown(false);
    };

    const hasUserReview = !!data?.userReview;
    const shouldShowForm =
        !readOnly && isEnrolled && (showForm || editMode) && !hasUserReview;
    const shouldShowEditForm =
        !readOnly && isEnrolled && editMode && hasUserReview;

    return (
        <section className="py-20 bg-[#0a0c10]" id="reviews">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
                        Đánh giá từ{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                            học viên
                        </span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Những chia sẻ chân thực từ các bạn học viên đã tham gia
                        khóa học
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Rating Breakdown */}
                    <div className="lg:col-span-1">
                        <RatingBreakdown
                            distribution={
                                data?.distribution || {
                                    1: 0,
                                    2: 0,
                                    3: 0,
                                    4: 0,
                                    5: 0,
                                }
                            }
                            avgRating={avgRating}
                            totalReviews={totalReviews}
                            onFilterClick={handleFilterClick}
                            activeFilter={filterRating}
                        />

                        {/* Write Review Button (Desktop) */}
                        {!readOnly &&
                            isEnrolled &&
                            !hasUserReview &&
                            !showForm && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setShowForm(true)}
                                    className="w-full mt-4 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all flex items-center justify-center gap-2"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #6366f1, #9333ea)",
                                    }}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Viết đánh giá
                                </motion.button>
                            )}

                        {!readOnly &&
                            isEnrolled &&
                            hasUserReview &&
                            !editMode && (
                                <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-center">
                                    <p className="text-indigo-400 text-sm font-medium">
                                        ✓ Bạn đã đánh giá khóa học này
                                    </p>
                                </div>
                            )}

                        {!isEnrolled && isAuthenticated && (
                            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <p className="text-gray-400 text-sm">
                                    Đăng ký khóa học để viết đánh giá
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Reviews */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Review Form */}
                        <AnimatePresence>
                            {(shouldShowForm || shouldShowEditForm) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <ReviewForm
                                        existingReview={
                                            editMode ? data?.userReview : null
                                        }
                                        onSubmit={handleSubmitReview}
                                        submitting={submitting}
                                        onCancel={() => {
                                            setShowForm(false);
                                            setEditMode(false);
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sort & Filter Controls */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowSortDropdown(!showSortDropdown)
                                    }
                                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 hover:border-white/20 transition-colors"
                                >
                                    <span>
                                        {
                                            SORT_OPTIONS.find(
                                                (o) => o.value === sort,
                                            )?.label
                                        }
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {showSortDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="absolute top-full left-0 mt-1 bg-[#1a1d27] border border-white/10 rounded-lg shadow-xl overflow-hidden z-20 min-w-[160px]"
                                        >
                                            {SORT_OPTIONS.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() =>
                                                        handleSortChange(
                                                            opt.value,
                                                        )
                                                    }
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sort === opt.value ? "bg-indigo-500/20 text-indigo-400" : "text-gray-300 hover:bg-white/5"}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Star filter chips */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {filterRating && (
                                    <button
                                        onClick={() => handleFilterClick(null)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() =>
                                            handleFilterClick(
                                                filterRating === star
                                                    ? null
                                                    : star,
                                            )
                                        }
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                                            filterRating === star
                                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                                        }`}
                                    >
                                        {star}
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reviews List */}
                        {loading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">
                                    Đang tải đánh giá...
                                </p>
                            </div>
                        ) : data && data.reviews.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {data.reviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            onLike={handleLike}
                                            liking={liking}
                                            isOwnReview={
                                                review.user.id ===
                                                (user as any)?.id
                                            }
                                            onEdit={() => setEditMode(true)}
                                            onDelete={handleDeleteReview}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {data.pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <button
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                            disabled={page === 1}
                                            className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Trước
                                        </button>
                                        <span className="text-sm text-gray-400">
                                            Trang {page}/
                                            {data.pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setPage((p) =>
                                                    Math.min(
                                                        data.pagination
                                                            .totalPages,
                                                        p + 1,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                page ===
                                                data.pagination.totalPages
                                            }
                                            className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            Sau
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-gray-300 font-semibold mb-1">
                                    {filterRating
                                        ? "Không có đánh giá nào"
                                        : "Chưa có đánh giá"}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {filterRating
                                        ? `Không có đánh giá ${filterRating} sao. Hãy thử bỏ bộ lọc.`
                                        : "Hãy là người đầu tiên đánh giá khóa học này!"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
