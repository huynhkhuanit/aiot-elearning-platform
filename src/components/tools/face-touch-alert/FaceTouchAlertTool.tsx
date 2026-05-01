"use client";

import {
    AlertTriangle,
    BellRing,
    Camera,
    CameraOff,
    CheckCircle2,
    Gauge,
    Hand,
    LoaderCircle,
    RefreshCcw,
    ScanFace,
    Settings,
    UserRound,
    Volume2,
    VolumeX,
} from "lucide-react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

import { clampScore, formatPercent, type DetectorState } from "./types";
import { useFaceTouchDetection } from "./use-face-touch-detection";

const stateConfig: Record<
    Exclude<DetectorState, "idle" | "loading" | "error">,
    {
        label: string;
        tone: string;
        dotColor: string;
        progressColor: string;
        cameraBorder: string;
    }
> = {
    safe: {
        label: "An toàn",
        tone: "border-emerald-400/20 bg-emerald-500/15 text-emerald-100",
        dotColor: "bg-emerald-400",
        progressColor: "#34d399",
        cameraBorder: "border-slate-800",
    },
    near_face: {
        label: "Tay gần mặt",
        tone: "border-amber-400/20 bg-amber-500/15 text-amber-100",
        dotColor: "bg-amber-400",
        progressColor: "#f59e0b",
        cameraBorder: "border-amber-400/35",
    },
    touching_face: {
        label: "Đang chạm mặt",
        tone: "border-rose-400/25 bg-rose-500/15 text-rose-100",
        dotColor: "bg-rose-400",
        progressColor: "#fb7185",
        cameraBorder: "border-rose-400/40",
    },
};

const shellStyle = {
    backgroundColor: "#0a0f1a",
    color: "#f8fafc",
} satisfies CSSProperties;

const headerStyle = {
    backgroundColor: "#0a0f1a",
    color: "#f8fafc",
} satisfies CSSProperties;

const panelStyle = {
    backgroundColor: "#0f172a",
    color: "#e2e8f0",
} satisfies CSSProperties;

const cameraStyle = {
    backgroundColor: "#111827",
    color: "#cbd5e1",
} satisfies CSSProperties;

const neutralAlertStyle = {
    backgroundColor: "#0f172a",
    color: "#cbd5e1",
} satisfies CSSProperties;

const activeAlertStyle = {
    backgroundColor: "#3f1720",
    color: "#fecdd3",
} satisfies CSSProperties;

export function FaceTouchAlertTool() {
    const {
        videoRef,
        overlayRef,
        captureCanvasRef,
        cameraActive,
        audioEnabled,
        detectorState,
        serviceState,
        detection,
        displayScore,
        alertCount,
        sampleRate,
        cameraError,
        serviceStatus,
        toggleCamera,
        setAudioEnabled,
        setSampleRate,
        checkServiceHealth,
        resetCounters,
    } = useFaceTouchDetection();

    const liveState =
        detectorState === "safe" ||
        detectorState === "near_face" ||
        detectorState === "touching_face"
            ? detectorState
            : "safe";
    const liveStateConfig = stateConfig[liveState];
    const statusLabel =
        detectorState === "error"
            ? "Lỗi xử lý"
            : serviceState === "offline"
              ? "Service offline"
              : serviceState === "checking"
                ? "Đang kiểm tra"
                : detectorState === "loading"
                  ? "Đang tải"
                  : liveStateConfig.label;
    const statusTone =
        detectorState === "error"
            ? "border-rose-400/25 bg-rose-500/15 text-rose-100"
            : serviceState === "offline"
              ? "border-amber-400/20 bg-amber-500/15 text-amber-100"
              : serviceState === "checking"
                ? "border-sky-400/20 bg-sky-500/15 text-sky-100"
                : liveStateConfig.tone;
    const statusDot =
        detectorState === "error"
            ? "bg-rose-400"
            : serviceState === "offline"
              ? "bg-amber-400"
              : serviceState === "checking" || detectorState === "loading"
                ? "bg-sky-400"
                : liveStateConfig.dotColor;
    const contactScorePercent = Math.round(clampScore(displayScore) * 100);
    const progressStyle = {
        "--progress-color": liveStateConfig.progressColor,
    } as CSSProperties;
    const isStarting = detectorState === "loading";

    return (
        <div
            data-face-touch-shell
            className="min-h-[100dvh] font-[family-name:var(--font-space-grotesk),var(--font-sans)]"
            style={shellStyle}
        >
            <header
                className="sticky top-0 border-b border-slate-800 px-4 py-3 sm:px-6"
                style={headerStyle}
            >
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#13b6ec]/25 text-[#13b6ec]"
                            style={{ backgroundColor: "rgba(19, 182, 236, 0.12)" }}
                        >
                            <ScanFace className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <div
                                role="heading"
                                aria-level={1}
                                className="truncate text-base font-semibold tracking-tight"
                                style={{ color: "#f8fafc" }}
                            >
                                Face Touch Alert
                            </div>
                            <p className="text-xs text-slate-400">
                                Camera realtime
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label={
                                audioEnabled
                                    ? "Tắt âm thanh cảnh báo"
                                    : "Bật âm thanh cảnh báo"
                            }
                            className="cursor-pointer border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-slate-50"
                            style={panelStyle}
                            onClick={() => setAudioEnabled((value) => !value)}
                        >
                            {audioEnabled ? (
                                <Volume2 className="size-4" aria-hidden="true" />
                            ) : (
                                <VolumeX className="size-4" aria-hidden="true" />
                            )}
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    aria-label="Mở cài đặt"
                                    className="cursor-pointer border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-slate-50"
                                    style={panelStyle}
                                >
                                    <Settings
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-72 border-slate-700 p-4 shadow-xl"
                                style={panelStyle}
                            >
                                <PopoverHeader>
                                    <PopoverTitle>Cài đặt nhanh</PopoverTitle>
                                    <PopoverDescription className="text-xs text-slate-400">
                                        Điều chỉnh nhịp lấy mẫu và trạng thái phiên.
                                    </PopoverDescription>
                                </PopoverHeader>

                                <div className="mt-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-300">
                                                Sample rate
                                            </span>
                                            <span className="font-semibold text-[#13b6ec]">
                                                {sampleRate[0]} FPS
                                            </span>
                                        </div>
                                        <Slider
                                            value={sampleRate}
                                            min={5}
                                            max={24}
                                            step={1}
                                            onValueChange={setSampleRate}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="cursor-pointer border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-slate-50"
                                            style={panelStyle}
                                            onClick={checkServiceHealth}
                                        >
                                            {serviceState === "checking" ? (
                                                <LoaderCircle
                                                    className="size-4 animate-spin"
                                                    aria-hidden="true"
                                                />
                                            ) : serviceState === "ready" ? (
                                                <CheckCircle2
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <RefreshCcw
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            )}
                                            Service
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="cursor-pointer border-slate-700 text-slate-100 hover:bg-slate-800 hover:text-slate-50"
                                            style={panelStyle}
                                            onClick={resetCounters}
                                        >
                                            <RefreshCcw
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
                <section
                    className={cn(
                        "overflow-hidden rounded-xl border bg-slate-950 transition-colors duration-300",
                        liveStateConfig.cameraBorder,
                    )}
                    style={panelStyle}
                >
                    <div
                        className="relative aspect-[4/3] sm:aspect-video"
                        style={cameraStyle}
                    >
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            className="h-full w-full object-contain"
                        />
                        <canvas
                            ref={overlayRef}
                            className="pointer-events-none absolute inset-0 h-full w-full"
                        />
                        <canvas ref={captureCanvasRef} className="hidden" />

                        {!cameraActive ? (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
                                style={cameraStyle}
                            >
                                <div
                                    className="flex size-14 items-center justify-center rounded-full border border-slate-700 text-slate-400"
                                    style={panelStyle}
                                >
                                    <CameraOff
                                        className="size-7"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="max-w-56 text-sm leading-6 text-slate-300">
                                    Bật camera để bắt đầu theo dõi chạm mặt.
                                </p>
                            </div>
                        ) : null}

                        <div
                            className={cn(
                                "absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                                statusTone,
                            )}
                        >
                            <span
                                className={cn(
                                    "size-2 rounded-full",
                                    statusDot,
                                    (detectorState === "loading" ||
                                        serviceState === "checking") &&
                                        "animate-pulse",
                                )}
                                aria-hidden="true"
                            />
                            {statusLabel}
                        </div>
                    </div>
                </section>

                <section
                    className="rounded-xl border border-slate-800 p-4"
                    style={panelStyle}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-200">
                            Contact Score
                        </span>
                        <span className="text-sm font-semibold text-slate-50">
                            {formatPercent(displayScore)}
                        </span>
                    </div>
                    <Progress
                        value={contactScorePercent}
                        className="mt-3 h-2 bg-slate-800"
                        style={progressStyle}
                    />
                </section>

                <section className="grid grid-cols-3 gap-2 sm:gap-3">
                    <MetricTile
                        icon={Hand}
                        label="Hands"
                        value={detection.hands.toString()}
                    />
                    <MetricTile
                        icon={UserRound}
                        label="Face"
                        value={detection.faceDetected ? "Có" : "Không"}
                    />
                    <MetricTile
                        icon={Gauge}
                        label="Latency"
                        value={`${detection.latencyMs}ms`}
                    />
                </section>

                <section
                    className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                        alertCount > 0
                            ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
                            : "border-slate-800 bg-slate-950/70 text-slate-500",
                    )}
                    style={alertCount > 0 ? activeAlertStyle : neutralAlertStyle}
                >
                    <BellRing
                        className={cn(
                            "size-4 shrink-0",
                            alertCount > 0 ? "text-rose-300" : "text-slate-600",
                        )}
                        aria-hidden="true"
                    />
                        <span>
                            Cảnh báo chạm mặt:{" "}
                        <strong className="font-semibold text-slate-50">
                            {alertCount}
                        </strong>{" "}
                        lần trong phiên này
                    </span>
                </section>

                <Button
                    type="button"
                    size="lg"
                    variant={cameraActive ? "destructive" : "default"}
                    className={cn(
                        "h-12 w-full cursor-pointer rounded-xl text-base font-semibold",
                        cameraActive
                            ? "border-rose-400/20 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
                            : "bg-[#13b6ec] text-slate-950 hover:bg-[#13b6ec]/90",
                    )}
                    onClick={toggleCamera}
                    disabled={isStarting}
                >
                    {isStarting ? (
                        <LoaderCircle
                            className="size-5 animate-spin"
                            aria-hidden="true"
                        />
                    ) : cameraActive ? (
                        <CameraOff className="size-5" aria-hidden="true" />
                    ) : (
                        <Camera className="size-5" aria-hidden="true" />
                    )}
                    {isStarting
                        ? "Đang khởi tạo"
                        : cameraActive
                          ? "Dừng Camera"
                          : "Bật Camera"}
                </Button>

                {serviceState === "offline" ? (
                    <InlineMessage tone="warning" message={serviceStatus} />
                ) : null}

                {cameraError ? (
                    <InlineMessage tone="error" message={cameraError} />
                ) : null}
            </main>
        </div>
    );
}

function MetricTile({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Hand;
    label: string;
    value: string;
}) {
    return (
        <div
            className="min-w-0 rounded-lg border border-slate-800 p-3"
            style={panelStyle}
        >
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs font-medium">{label}</span>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-slate-50">
                {value}
            </p>
        </div>
    );
}

function InlineMessage({
    tone,
    message,
}: {
    tone: "warning" | "error";
    message: string;
}) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6",
                tone === "warning"
                    ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                    : "border-rose-400/20 bg-rose-500/10 text-rose-100",
            )}
        >
            <AlertTriangle
                className={cn(
                    "mt-0.5 size-4 shrink-0",
                    tone === "warning" ? "text-amber-300" : "text-rose-300",
                )}
                aria-hidden="true"
            />
            <p>{message}</p>
        </div>
    );
}
