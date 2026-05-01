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
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dotColor: "bg-emerald-400",
        progressColor: "#10b981",
        cameraBorder: "border-slate-200",
    },
    near_face: {
        label: "Tay gần mặt",
        tone: "border-amber-200 bg-amber-50 text-amber-700",
        dotColor: "bg-amber-400",
        progressColor: "#f59e0b",
        cameraBorder: "border-amber-200",
    },
    touching_face: {
        label: "Đang chạm mặt",
        tone: "border-rose-200 bg-rose-50 text-rose-700",
        dotColor: "bg-rose-400",
        progressColor: "#e11d48",
        cameraBorder: "border-rose-200",
    },
};

const shellStyle = {
    backgroundColor: "#f7f9fc",
    color: "#0f172a",
} satisfies CSSProperties;

const headerStyle = {
    backgroundColor: "#f7f9fc",
    color: "#0f172a",
} satisfies CSSProperties;

const panelStyle = {
    backgroundColor: "#ffffff",
    color: "#0f172a",
} satisfies CSSProperties;

const cameraStyle = {
    backgroundColor: "#f1f5f9",
    color: "#334155",
} satisfies CSSProperties;

const neutralAlertStyle = {
    backgroundColor: "#ffffff",
    color: "#334155",
} satisfies CSSProperties;

const activeAlertStyle = {
    backgroundColor: "#fff1f2",
    color: "#9f1239",
} satisfies CSSProperties;

const systemPrimaryTextStyle = {
    color: "var(--primary-gradient-from, #6366f1)",
} satisfies CSSProperties;

const systemIconSurfaceStyle = {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "var(--primary-gradient-from, #6366f1)",
} satisfies CSSProperties;

const primaryButtonStyle = {
    background:
        "linear-gradient(135deg, var(--primary-gradient-from, #6366f1), var(--primary-gradient-to, #9333ea))",
    color: "#ffffff",
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
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : serviceState === "offline"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : serviceState === "checking"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
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
                className="sticky top-0 border-b border-slate-200 px-4 py-3 sm:px-6"
                style={headerStyle}
            >
                <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-indigo-200"
                            style={systemIconSurfaceStyle}
                        >
                            <ScanFace className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <div
                                role="heading"
                                aria-level={1}
                                className="truncate text-base font-semibold tracking-tight"
                                style={{ color: "#0f172a" }}
                            >
                                Face Touch Alert
                            </div>
                            <p className="text-xs text-slate-600">
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
                            className="cursor-pointer border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"
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
                                    className="cursor-pointer border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"
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
                                className="w-72 border-slate-200 p-4 shadow-xl"
                                style={panelStyle}
                            >
                                <PopoverHeader>
                                    <PopoverTitle>Cài đặt nhanh</PopoverTitle>
                                    <PopoverDescription className="text-xs text-slate-600">
                                        Điều chỉnh nhịp lấy mẫu và trạng thái phiên.
                                    </PopoverDescription>
                                </PopoverHeader>

                                <div className="mt-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium text-slate-700">
                                                Sample rate
                                            </span>
                                            <span
                                                className="font-semibold"
                                                style={systemPrimaryTextStyle}
                                            >
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
                                            className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50"
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
                                            className="cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-50"
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
                        "overflow-hidden rounded-xl border shadow-sm transition-colors duration-300",
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
                                    className="flex size-14 items-center justify-center rounded-full border border-slate-200 text-slate-500"
                                    style={panelStyle}
                                >
                                    <CameraOff
                                        className="size-7"
                                        aria-hidden="true"
                                    />
                                </div>
                                <p className="max-w-56 text-sm leading-6 text-slate-600">
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
                    className="rounded-xl border border-slate-200 p-4 shadow-sm"
                    style={panelStyle}
                >
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">
                            Contact Score
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                            {formatPercent(displayScore)}
                        </span>
                    </div>
                    <Progress
                        value={contactScorePercent}
                        className="mt-3 h-2 bg-slate-200"
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
                            ? "border-rose-200 text-rose-700"
                            : "border-slate-200 text-slate-700",
                    )}
                    style={alertCount > 0 ? activeAlertStyle : neutralAlertStyle}
                >
                    <BellRing
                        className={cn(
                            "size-4 shrink-0",
                            alertCount > 0 ? "text-rose-600" : "text-slate-500",
                        )}
                        aria-hidden="true"
                    />
                        <span>
                            Cảnh báo chạm mặt:{" "}
                        <strong className="font-semibold text-slate-900">
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
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border-transparent shadow-sm hover:opacity-95",
                    )}
                    style={cameraActive ? undefined : primaryButtonStyle}
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
            className="min-w-0 rounded-lg border border-slate-200 p-3 shadow-sm"
            style={panelStyle}
        >
            <div className="flex items-center gap-2 text-slate-600">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs font-medium">{label}</span>
            </div>
            <p className="mt-2 truncate text-base font-semibold text-slate-900">
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
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-rose-200 bg-rose-50 text-rose-800",
            )}
        >
            <AlertTriangle
                className={cn(
                    "mt-0.5 size-4 shrink-0",
                    tone === "warning" ? "text-amber-600" : "text-rose-600",
                )}
                aria-hidden="true"
            />
            <p>{message}</p>
        </div>
    );
}
