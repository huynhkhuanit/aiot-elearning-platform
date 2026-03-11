"use client";

import {
    ArrowLeftRight,
    ArrowUpDown,
    Check,
    Code2,
    Copy,
    Minus,
    Plus,
    Redo2,
    RotateCcw,
    Save,
    Shuffle,
    Undo2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ClipPathPreset } from "./clipPathData";
import type { CodeFormat, CopyState } from "./clipPathStudioTypes";
import { formatPoint, type Point } from "./clipPathUtils";

type ClipPathInspectorPanelProps = {
    activePreset: ClipPathPreset;
    classNameInput: string;
    codeFormat: CodeFormat;
    copiedState: CopyState;
    currentPoint: Point;
    customPresetName: string;
    historyIndex: number;
    historyLength: number;
    onAddPoint: () => void;
    onClassNameChange: (value: string) => void;
    onCodeFormatChange: (format: CodeFormat) => void;
    onCopy: (text: string, state: CopyState) => void;
    onCurrentPointChange: (axis: "x" | "y", value: number) => void;
    onCurrentPointCommit: () => void;
    onExpand: () => void;
    onJitter: () => void;
    onMakeSymmetric: () => void;
    onNarrow: () => void;
    onRandomize: () => void;
    onRedo: () => void;
    onRemovePoint: () => void;
    onReset: () => void;
    onSaveCustomPreset: () => void;
    onShrink: () => void;
    onStretchHorizontal: () => void;
    onStretchVertical: () => void;
    onUndo: () => void;
    onUpdateCustomPresetName: (value: string) => void;
    points: Point[];
    safeClassName: string;
    selectedPointIndex: number;
    snippets: Record<CodeFormat, string>;
    svgPath: string;
};

export function ClipPathInspectorPanel({
    activePreset,
    classNameInput,
    codeFormat,
    copiedState,
    currentPoint,
    customPresetName,
    historyIndex,
    historyLength,
    onAddPoint,
    onClassNameChange,
    onCodeFormatChange,
    onCopy,
    onCurrentPointChange,
    onCurrentPointCommit,
    onExpand,
    onJitter,
    onMakeSymmetric,
    onNarrow,
    onRandomize,
    onRedo,
    onRemovePoint,
    onReset,
    onSaveCustomPreset,
    onShrink,
    onStretchHorizontal,
    onStretchVertical,
    onUndo,
    onUpdateCustomPresetName,
    points,
    safeClassName,
    selectedPointIndex,
    snippets,
    svgPath,
}: ClipPathInspectorPanelProps) {
    return (
        <Card className="clip-path-panel clip-path-stagger-in order-2 overflow-hidden rounded-[28px] border-[#d5ebe7] bg-white/95 shadow-[0_24px_70px_rgba(15,118,110,0.10)] xl:order-3" data-stagger="3">
            <CardHeader className="border-b border-[#e5f3f0] pb-5">
                <div className="flex items-start gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0f172a] text-white">
                        <Code2 className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-slate-950">
                            Thuộc tính & xuất mã
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-500">
                            Canh điểm đang chọn, biến đổi shape nhanh và xuất đúng
                            định dạng mã bạn cần ngay trong panel này.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <ScrollArea className="h-[420px] pr-3 md:h-[540px] xl:h-[780px]">
                    <div className="space-y-6">
                        <div className="rounded-[24px] border border-[#e2efec] bg-[#f9fcfb] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        Điểm đang chọn
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Điểm #{selectedPointIndex + 1} -{" "}
                                        {formatPoint(currentPoint)}
                                    </p>
                                </div>
                                <Badge className="rounded-full border border-[#d7ebe7] bg-white px-3 py-1 text-slate-600 hover:bg-white">
                                    {points.length} points
                                </Badge>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label className="text-sm font-semibold text-slate-900">
                                            Tọa độ X
                                        </Label>
                                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                            {currentPoint.x}%
                                        </span>
                                    </div>
                                    <Slider
                                        value={[currentPoint.x]}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onValueChange={(value) =>
                                            onCurrentPointChange("x", value[0] ?? 0)
                                        }
                                        onValueCommit={onCurrentPointCommit}
                                        aria-label="Toa do X"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <Label className="text-sm font-semibold text-slate-900">
                                            Tọa độ Y
                                        </Label>
                                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                                            {currentPoint.y}%
                                        </span>
                                    </div>
                                    <Slider
                                        value={[currentPoint.y]}
                                        min={0}
                                        max={100}
                                        step={1}
                                        onValueChange={(value) =>
                                            onCurrentPointChange("y", value[0] ?? 0)
                                        }
                                        onValueCommit={onCurrentPointCommit}
                                        aria-label="Toa do Y"
                                    />
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onAddPoint}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Plus className="mr-1.5 size-4" />
                                    Thêm điểm
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onRemovePoint}
                                    disabled={points.length <= 3}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Minus className="mr-1.5 size-4" />
                                    Xóa điểm
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#e2efec] bg-white p-4">
                            <p className="text-sm font-semibold text-slate-950">
                                Biến đổi nhanh
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Thử nhanh các hướng biến đổi để tìm ra hình phù hợp
                                trước khi tinh chỉnh chi tiết.
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onShrink}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Thu vào
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onExpand}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Nở ra
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onStretchHorizontal}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Rộng hơn
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onStretchVertical}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <ArrowUpDown className="mr-1.5 size-4" />
                                    Cao hơn
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onRandomize}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Shuffle className="mr-1.5 size-4" />
                                    Ngẫu nhiên
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onJitter}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Shuffle className="mr-1.5 size-4" />
                                    Jitter nhẹ
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onMakeSymmetric}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8] sm:col-span-2"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Cân đối shape
                                </Button>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onNarrow}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <ArrowLeftRight className="mr-1.5 size-4" />
                                    Hẹp ngang
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#e2efec] bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        Lịch sử chỉnh sửa
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Hoàn tác, làm lại hoặc đặt lại về preset gốc
                                        mà không mất luồng thao tác.
                                    </p>
                                </div>
                                <Badge className="rounded-full border border-[#d7ebe7] bg-[#f8fcfb] px-3 py-1 text-slate-600 hover:bg-[#f8fcfb]">
                                    {historyIndex + 1}/{historyLength}
                                </Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onUndo}
                                    disabled={historyIndex === 0}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Undo2 className="mr-1.5 size-4" />
                                    Hoàn tác
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onRedo}
                                    disabled={historyIndex >= historyLength - 1}
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    <Redo2 className="mr-1.5 size-4" />
                                    Làm lại
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onReset}
                                    className="rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200"
                                >
                                    <RotateCcw className="mr-1.5 size-4" />
                                    Đặt lại
                                </Button>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#dfece9] bg-[linear-gradient(180deg,_#f7fdfc_0%,_#fff8f1_100%)] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        Lưu preset tùy chỉnh
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Lưu lại shape hiện tại để tái sử dụng trong
                                        bộ preset cá nhân của bạn.
                                    </p>
                                </div>
                                <Save className="size-5 text-[#c2410c]" />
                            </div>

                            <div className="mt-4 space-y-2">
                                <Label htmlFor="custom-preset-name">Tên preset</Label>
                                <Input
                                    id="custom-preset-name"
                                    value={customPresetName}
                                    onChange={(event) =>
                                        onUpdateCustomPresetName(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ví dụ: Hero chéo mềm"
                                    className="h-11 rounded-2xl border-[#d7ebe7]"
                                />
                            </div>

                            <Button
                                type="button"
                                onClick={onSaveCustomPreset}
                                className="mt-4 w-full rounded-xl bg-[#0d9488] text-white hover:bg-[#0f766e]"
                            >
                                <Save className="mr-1.5 size-4" />
                                {activePreset.category === "custom"
                                    ? "Cập nhật preset tùy chỉnh"
                                    : "Lưu preset tùy chỉnh"}
                            </Button>
                        </div>

                        <div className="rounded-[24px] border border-[#e2efec] bg-white p-4">
                            <p className="text-sm font-semibold text-slate-950">
                                Xuất mã
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Chọn định dạng phù hợp với stack của bạn rồi sao chép
                                trực tiếp.
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="clip-path-class-name">
                                    Tên class CSS
                                </Label>
                                <Input
                                    id="clip-path-class-name"
                                    value={classNameInput}
                                    onChange={(event) =>
                                        onClassNameChange(event.target.value)
                                    }
                                    placeholder="clip-shape"
                                    className="h-11 rounded-2xl border-[#d7ebe7]"
                                />
                                {safeClassName !==
                                classNameInput.trim().toLowerCase() ? (
                                    <p className="text-xs text-slate-500">
                                        Sẽ được chuẩn hóa thành{" "}
                                        <span className="font-semibold text-slate-900">
                                            .{safeClassName}
                                        </span>
                                        .
                                    </p>
                                ) : null}
                            </div>

                            <Tabs
                                value={codeFormat}
                                onValueChange={(value) =>
                                    onCodeFormatChange(value as CodeFormat)
                                }
                                className="mt-5 w-full"
                            >
                                <TabsList
                                    variant="line"
                                    className="grid w-full grid-cols-4 rounded-2xl border border-[#d7ebe7] bg-[#f8fcfb] p-1"
                                >
                                    <TabsTrigger
                                        value="css"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        CSS
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="tailwind"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        Tailwind
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="jsx"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        JSX
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="svg"
                                        className="cursor-pointer rounded-xl data-[state=active]:bg-white"
                                    >
                                        SVG
                                    </TabsTrigger>
                                </TabsList>

                                {(Object.keys(snippets) as CodeFormat[]).map((format) => (
                                    <TabsContent key={format} value={format} className="mt-4">
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                                            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
                                                    {format}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onCopy(
                                                            snippets[format],
                                                            format,
                                                        )
                                                    }
                                                    className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
                                                >
                                                    {copiedState === format
                                                        ? "Da copy"
                                                        : "Copy"}
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                spellCheck={false}
                                                value={snippets[format]}
                                                className="min-h-[220px] w-full resize-none border-0 bg-transparent px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                                            />
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Button
                                    type="button"
                                    onClick={() =>
                                        onCopy(snippets[codeFormat], codeFormat)
                                    }
                                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                                >
                                    {copiedState === codeFormat ? (
                                        <Check className="mr-1.5 size-4" />
                                    ) : (
                                        <Copy className="mr-1.5 size-4" />
                                    )}
                                    Sao chép mã
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        onCopy(
                                            `polygon(${points
                                                .map((point) =>
                                                    `${point.x}% ${point.y}%`,
                                                )
                                                .join(", ")})`,
                                            "polygon",
                                        )
                                    }
                                    className="rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                                >
                                    {copiedState === "polygon" ? (
                                        <Check className="mr-1.5 size-4 text-emerald-600" />
                                    ) : (
                                        <Copy className="mr-1.5 size-4" />
                                    )}
                                    Sao chép polygon
                                </Button>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onCopy(svgPath, "svg-path")}
                                className="mt-3 w-full rounded-xl border-[#cde8e3] bg-white text-slate-900 hover:bg-[#f1fbf8]"
                            >
                                {copiedState === "svg-path" ? (
                                    <Check className="mr-1.5 size-4 text-emerald-600" />
                                ) : (
                                    <Copy className="mr-1.5 size-4" />
                                )}
                                Sao chép SVG path
                            </Button>
                        </div>

                        <div className="rounded-[24px] border border-[#f5dccd] bg-[#fff7f1] p-4">
                            <p className="text-sm font-semibold text-slate-950">
                                Gợi ý khi dùng thật
                            </p>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                <li>
                                    Shape ít điểm sẽ dễ đặt text hơn; shape nhiều điểm
                                    hợp cho media, thumbnail hoặc sticker.
                                </li>
                                <li>
                                    Khi cần crop ảnh, hãy giữ thêm lớp{" "}
                                    <code>overflow-hidden</code> neu ban muon bo goc
                                    ngoài.
                                </li>
                                <li>
                                    CSS và JSX đã kèm <code>WebkitClipPath</code> để
                                    Safari ổn định hơn.
                                </li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
