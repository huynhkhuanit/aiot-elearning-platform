import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowRight,
    Braces,
    CheckCircle2,
    Code2,
    Cpu,
    FileText,
    Grid3X3,
    Info,
    Link2,
    Scissors,
    ShieldAlert,
    Sparkles,
    type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toolCatalog, type ToolCatalogItem } from "@/lib/tool-catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Công cụ học tập và phát triển | CodeSense AIoT",
    description:
        "Khám phá bộ công cụ hỗ trợ tạo CV, rút gọn liên kết, sinh snippet, dựng CSS Grid, clip-path và demo AIoT.",
};

const iconMap: Record<ToolCatalogItem["icon"], LucideIcon> = {
    resume: FileText,
    "short-link": Link2,
    "clip-path": Scissors,
    snippet: Braces,
    grid: Grid3X3,
    "face-alert": ShieldAlert,
};

const accentStyles: Record<
    ToolCatalogItem["accent"],
    {
        bar: string;
        card: string;
        iconWrap: string;
        icon: string;
        check: string;
        category: string;
        subtle: string;
    }
> = {
    sky: {
        bar: "from-sky-400 via-sky-500 to-indigo-500",
        card: "bg-gradient-to-br from-sky-50 via-white to-slate-50",
        iconWrap: "border-sky-100 bg-sky-100/80",
        icon: "text-sky-700",
        check: "text-sky-600",
        category: "bg-sky-100 text-sky-700 hover:bg-sky-100",
        subtle: "bg-sky-950/[0.03]",
    },
    violet: {
        bar: "from-violet-400 via-violet-500 to-fuchsia-500",
        card: "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/70",
        iconWrap: "border-violet-100 bg-violet-100/80",
        icon: "text-violet-700",
        check: "text-violet-600",
        category: "bg-violet-100 text-violet-700 hover:bg-violet-100",
        subtle: "bg-violet-950/[0.03]",
    },
    amber: {
        bar: "from-amber-400 via-orange-400 to-rose-400",
        card: "bg-gradient-to-br from-amber-50 via-white to-orange-50/60",
        iconWrap: "border-amber-100 bg-amber-100/80",
        icon: "text-amber-700",
        check: "text-amber-600",
        category: "bg-amber-100 text-amber-700 hover:bg-amber-100",
        subtle: "bg-amber-950/[0.03]",
    },
    emerald: {
        bar: "from-emerald-400 via-emerald-500 to-teal-500",
        card: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/70",
        iconWrap: "border-emerald-100 bg-emerald-100/80",
        icon: "text-emerald-700",
        check: "text-emerald-600",
        category: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
        subtle: "bg-emerald-950/[0.03]",
    },
    rose: {
        bar: "from-rose-400 via-pink-500 to-amber-400",
        card: "bg-gradient-to-br from-rose-50 via-white to-orange-50/60",
        iconWrap: "border-rose-100 bg-rose-100/80",
        icon: "text-rose-700",
        check: "text-rose-600",
        category: "bg-rose-100 text-rose-700 hover:bg-rose-100",
        subtle: "bg-rose-950/[0.03]",
    },
    cyan: {
        bar: "from-cyan-400 via-sky-500 to-indigo-500",
        card: "bg-gradient-to-br from-cyan-50 via-white to-sky-50/70",
        iconWrap: "border-cyan-100 bg-cyan-100/80",
        icon: "text-cyan-700",
        check: "text-cyan-600",
        category: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
        subtle: "bg-cyan-950/[0.03]",
    },
};

const toolGroups = [
    {
        icon: Sparkles,
        title: "Khởi đầu từ nhu cầu thực tế",
        description:
            "Ưu tiên các công cụ giúp sinh viên chuẩn bị hồ sơ, chia sẻ tài liệu và làm đồ án nhanh hơn.",
        items: ["Tạo CV xin việc", "Rút gọn liên kết"],
    },
    {
        icon: Code2,
        title: "Tăng tốc công việc frontend",
        description:
            "Nhóm công cụ phục vụ dựng giao diện, sinh mã lặp lại và thử ý tưởng UI trực quan hơn.",
        items: [
            "Clip-path maker",
            "Snippet generator",
            "CSS Grid generator",
        ],
    },
    {
        icon: Cpu,
        title: "Mở rộng sang demo AIoT",
        description:
            "Không dừng ở utility frontend, page này còn mở đường cho các bài toán nhận diện hành vi và computer vision.",
        items: ["Cảnh báo sờ tay lên mặt"],
    },
];

const metrics = [
    {
        value: `${toolCatalog.length}`,
        label: "công cụ trên một page",
        description:
            "Từ nhu cầu xin việc, chia sẻ tài liệu cho tới frontend utility và AIoT demo.",
    },
    {
        value: "4",
        label: "nhóm nhu cầu chính",
        description:
            "Sự nghiệp, tiện ích, frontend/developer và computer vision được gom rõ theo mục tiêu sử dụng.",
    },
    {
        value: "UI",
        label: "thân thiện, dễ quét",
        description:
            "Bố cục dạng catalog với card, anchor rõ ràng và tooltip giải thích ngữ cảnh dùng ngay trên từng tool.",
    },
];

export default function ToolsPage() {
    const categories = Array.from(
        new Set(toolCatalog.map((tool) => tool.category))
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <section className="relative overflow-hidden bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#9333ea] pt-32 pb-28 text-white">
                <div className="absolute inset-0 bg-[url('/assets/img/grid-pattern.svg')] opacity-10" />
                <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

                <div className="relative z-10 mx-auto max-w-7xl px-6">
                    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="max-w-3xl">
                            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white shadow-none hover:bg-white/10">
                                Kho công cụ dành cho người học, developer và AIoT
                            </Badge>

                            <h1 className="mt-6 text-4xl font-[900] leading-tight tracking-tight text-white md:text-6xl">
                                Một điểm đến cho các công cụ học tập và làm sản phẩm
                            </h1>

                            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100 md:text-xl">
                                Page này tập hợp toàn bộ nhóm công cụ đang được định
                                hình cho hệ thống, với giao diện dễ quét, nội dung rõ
                                ngữ cảnh và sẵn sàng mở rộng thành utility thực tế.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-full bg-white px-6 text-[#5b61f6] shadow-lg hover:bg-slate-100"
                                >
                                    <Link href="#tool-catalog">
                                        Khám phá công cụ
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 rounded-full border-white/25 bg-white/10 px-6 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
                                >
                                    <Link href="/contact">Góp ý tính năng ưu tiên</Link>
                                </Button>
                            </div>
                        </div>

                        <Card className="overflow-hidden rounded-[32px] border border-white/20 bg-white/10 py-0 text-white shadow-2xl backdrop-blur-xl">
                            <CardHeader className="px-6 pt-6 pb-4">
                                <CardTitle className="text-2xl font-bold">
                                    Đi nhanh tới đúng công cụ
                                </CardTitle>
                                <CardDescription className="text-sm leading-6 text-blue-100">
                                    Ba nhóm use case nổi bật được đặt ngay trong hero
                                    để người dùng mới định hướng nhanh.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 px-6 pb-6">
                                {toolCatalog.slice(0, 3).map((tool) => {
                                    const Icon = iconMap[tool.icon];

                                    return (
                                        <Link
                                            key={tool.id}
                                            href={tool.href}
                                            className="group flex items-start gap-4 rounded-3xl border border-white/15 bg-black/10 p-4 transition-all duration-200 hover:border-white/25 hover:bg-black/15"
                                        >
                                            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                                                <Icon className="size-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate font-semibold text-white">
                                                        {tool.name}
                                                    </p>
                                                    <Badge className="rounded-full border-0 bg-white/10 text-[11px] text-blue-100 hover:bg-white/10">
                                                        {tool.focus}
                                                    </Badge>
                                                </div>
                                                <p className="mt-2 text-sm leading-6 text-blue-100">
                                                    {tool.summary}
                                                </p>
                                            </div>

                                            <ArrowRight className="mt-1 size-4 shrink-0 text-blue-100 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </Link>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-6">
                <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl md:grid-cols-3 md:p-6">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100"
                        >
                            <p className="text-3xl font-[900] text-slate-900">
                                {metric.value}
                            </p>
                            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {metric.label}
                            </p>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                {metric.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <section
                id="tool-catalog"
                className="scroll-mt-28 mx-auto max-w-7xl px-6 py-16 md:py-20"
            >
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <Badge
                            variant="outline"
                            className="rounded-full border-[#6366f1]/20 bg-[#6366f1]/5 px-4 py-1.5 text-sm font-medium text-[#6366f1]"
                        >
                            Danh mục công cụ
                        </Badge>
                        <h2 className="mt-4 text-3xl font-[900] text-slate-900 md:text-4xl">
                            Catalog được sắp theo mục tiêu sử dụng thay vì chỉ liệt kê
                            tên
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                            Mỗi card đều có mô tả ngắn, ngữ cảnh áp dụng, highlight
                            chính và tooltip giải thích nhanh để người dùng biết khi
                            nào nên dùng công cụ đó.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <Badge
                                key={category}
                                variant="secondary"
                                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-900"
                            >
                                {category}
                            </Badge>
                        ))}
                    </div>
                </div>

                <TooltipProvider>
                    <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {toolCatalog.map((tool) => {
                            const Icon = iconMap[tool.icon];
                            const accent = accentStyles[tool.accent];

                            return (
                                <Card
                                    key={tool.id}
                                    id={tool.id}
                                    className={cn(
                                        "scroll-mt-28 overflow-hidden rounded-[32px] border-0 py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
                                        accent.card
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "h-1 w-full bg-gradient-to-r",
                                            accent.bar
                                        )}
                                    />

                                    <CardHeader className="space-y-4 px-6 pt-6 pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div
                                                className={cn(
                                                    "flex size-12 items-center justify-center rounded-2xl border",
                                                    accent.iconWrap
                                                )}
                                            >
                                                <Icon
                                                    className={cn(
                                                        "size-6",
                                                        accent.icon
                                                    )}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    className={cn(
                                                        "rounded-full border-0 px-3 py-1 text-xs font-semibold",
                                                        accent.category
                                                    )}
                                                >
                                                    {tool.category}
                                                </Badge>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            aria-label={`Gợi ý dùng ${tool.name}`}
                                                            className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition-colors hover:text-slate-900"
                                                        >
                                                            <Info className="size-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-72 rounded-2xl px-4 py-3 text-sm leading-6 shadow-2xl">
                                                        <p className="font-semibold">
                                                            {tool.name}
                                                        </p>
                                                        <p className="mt-1 text-background/80">
                                                            {tool.tooltip}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600"
                                            >
                                                {tool.focus}
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-xs text-slate-600"
                                            >
                                                {tool.audience}
                                            </Badge>
                                        </div>

                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">
                                                {tool.name}
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                                                {tool.summary}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6 px-6 pb-6">
                                        <p className="text-sm leading-6 text-slate-700">
                                            {tool.description}
                                        </p>

                                        <div className="space-y-3">
                                            {tool.highlights.map((highlight) => (
                                                <div
                                                    key={highlight}
                                                    className="flex items-start gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-slate-100"
                                                >
                                                    <CheckCircle2
                                                        className={cn(
                                                            "mt-0.5 size-4 shrink-0",
                                                            accent.check
                                                        )}
                                                    />
                                                    <span className="text-sm leading-6 text-slate-700">
                                                        {highlight}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div
                                            className={cn(
                                                "rounded-2xl p-4 ring-1 ring-white/60",
                                                accent.subtle
                                            )}
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                Kết quả kỳ vọng
                                            </p>
                                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                                {tool.outcome}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
                                            <span className="text-sm font-medium text-slate-500">
                                                Neo trực tiếp tới mục này
                                            </span>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                className="h-10 rounded-full px-4 text-[#6366f1] hover:bg-[#6366f1]/10 hover:text-[#5558e6]"
                                            >
                                                <Link href={tool.href}>
                                                    Liên kết mục
                                                    <ArrowRight className="size-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TooltipProvider>
            </section>

            <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-24">
                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <Card className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <CardHeader className="px-6 pt-6 pb-4">
                            <CardTitle className="text-2xl font-bold text-slate-900">
                                Cách page này tổ chức các công cụ
                            </CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                                Không chỉ gom link, page còn được chia thành các cụm
                                use case để người dùng mới chọn nhanh đúng nhóm công
                                cụ mình cần.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 px-6 pb-6">
                            {toolGroups.map((group) => (
                                <div
                                    key={group.title}
                                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6366f1] shadow-sm ring-1 ring-slate-100">
                                            <group.icon className="size-5" />
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-slate-900">
                                                {group.title}
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {group.description}
                                            </p>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {group.items.map((item) => (
                                                    <Badge
                                                        key={item}
                                                        variant="outline"
                                                        className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                                                    >
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden rounded-[32px] border-0 bg-slate-950 py-0 text-white shadow-2xl">
                        <CardHeader className="px-6 pt-6 pb-4">
                            <Badge className="w-fit rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/10">
                                Thiết kế bám phong cách hệ thống hiện tại
                            </Badge>
                            <CardTitle className="mt-4 text-2xl font-bold text-white">
                                Hướng giao diện cho các tool tiếp theo
                            </CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-300">
                                Tone màu gradient tím-xanh, card trắng bo lớn,
                                tooltip gọn và CTA rõ ràng được giữ đồng nhất với
                                các page như About và Contact.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 px-6 pb-6">
                            <div className="space-y-3">
                                {[
                                    "Hero có gradient, grid pattern và khối preview để tạo điểm nhấn ngay khi vào page.",
                                    "Card công cụ ưu tiên độ đọc nhanh: icon, category badge, focus badge, mô tả ngắn và kết quả kỳ vọng.",
                                    "Tooltip được dùng như lớp giải thích phụ để page vẫn gọn nhưng không thiếu ngữ cảnh.",
                                ].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                                        <p className="text-sm leading-6 text-slate-200">
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                                    Gợi ý triển khai tiếp
                                </p>
                                <p className="mt-3 text-sm leading-6 text-slate-200">
                                    Nếu muốn đi xa hơn, từng card ở trên có thể được
                                    nâng cấp thành route riêng hoặc tab tool tương tác
                                    trực tiếp ngay trong page này.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    asChild
                                    size="lg"
                                    className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100"
                                >
                                    <Link href="#tool-catalog">
                                        Xem toàn bộ công cụ
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>

                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="h-12 rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
                                >
                                    <Link href="/contact">Đề xuất công cụ mới</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
