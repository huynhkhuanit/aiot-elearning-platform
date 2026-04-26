"use client";

import {
    AlertTriangle,
    Camera,
    CameraOff,
    CheckCircle2,
    Cpu,
    Gauge,
    Hand,
    LoaderCircle,
    MicOff,
    Radar,
    RefreshCcw,
    ScanFace,
    ShieldAlert,
    Sparkles,
    Volume2,
    Waves,
    type LucideIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DetectorState =
    | "idle"
    | "loading"
    | "safe"
    | "near_face"
    | "touching_face"
    | "error";
type FaceRegion =
    | "forehead"
    | "left_cheek"
    | "right_cheek"
    | "nose"
    | "mouth"
    | "chin"
    | "eye_zone";

type OverlayBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type OverlayPoint = {
    x: number;
    y: number;
};

type FrameOverlay = {
    faceBox?: OverlayBox | null;
    handBoxes: OverlayBox[];
    facePoints: OverlayPoint[];
    handPoints: OverlayPoint[];
};

type DetectionResponse = {
    state: Exclude<DetectorState, "idle" | "loading" | "error">;
    score: number;
    alert: boolean;
    regions: FaceRegion[];
    hands: number;
    faceDetected: boolean;
    latencyMs: number;
    note: string;
    frameSize: {
        width: number;
        height: number;
    };
    overlay: FrameOverlay;
    debug: {
        overlapScore: number;
        proximityScore: number;
        fingertipScore: number;
    };
};

type ServiceState = "unknown" | "checking" | "ready" | "offline";

type ServiceHealthResponse =
    | {
          success: true;
          data: {
              available: true;
              baseUrl: string;
              message: string;
          };
      }
    | {
          success: false;
          data?: {
              available: false;
              baseUrl: string;
              message: string;
          };
          error: string;
      };

const pipelineSteps = [
    "Frontend lấy webcam bằng getUserMedia và nén frame ở nhịp thấp để giảm độ trễ.",
    "Python AI service phát hiện khuôn mặt và bàn tay bằng MediaPipe/OpenCV.",
    "Service tính contact score từ overlap, proximity và fingertip focus.",
    "Frontend làm mượt trạng thái, quản lý cooldown và phát cảnh báo theo thời gian thực.",
];

const evaluationRows = [
    {
        label: "Precision",
        value: "Đo số cảnh báo đúng trên tổng số cảnh báo.",
    },
    {
        label: "Recall",
        value: "Đo số lần chạm mặt thật sự được phát hiện.",
    },
    {
        label: "Latency",
        value: "Theo dõi độ trễ từ lúc tay tiến vào vùng mặt đến khi hiện cảnh báo.",
    },
    {
        label: "False Positive",
        value: "Giảm báo sai khi tay chỉ đi ngang hoặc người dùng chỉnh tóc.",
    },
];

const riskRows = [
    "Ánh sáng yếu hoặc nền quá tối làm giảm độ ổn định của landmarks.",
    "Tay che gần hết mặt có thể làm detector mất một phần points nếu FPS thấp.",
    "CPU yếu khiến latency tăng; cần giảm độ phân giải hoặc FPS suy luận.",
    "Trạng thái dễ nhấp nháy nếu không giữ debounce và recovery window hợp lý.",
];

const stateConfig: Record<
    Exclude<DetectorState, "idle" | "loading" | "error">,
    {
        label: string;
        tone: string;
        ring: string;
        progress: string;
        description: string;
        dotColor: string;
    }
> = {
    safe: {
        label: "An toàn",
        tone: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
        ring: "shadow-[0_0_0_1px_rgba(16,185,129,0.22)]",
        progress: "bg-emerald-400",
        description:
            "Tay đang ở xa mặt hoặc chưa xuất hiện vùng giao cắt đáng kể.",
        dotColor: "bg-emerald-500",
    },
    near_face: {
        label: "Đưa tay gần mặt",
        tone: "bg-amber-500/15 text-amber-100 border-amber-400/20",
        ring: "shadow-[0_0_0_1px_rgba(251,191,36,0.22)]",
        progress: "bg-amber-400",
        description:
            "Có dấu hiệu tay tiến gần mặt. Hệ thống đang tăng persistence score.",
        dotColor: "bg-amber-500",
    },
    touching_face: {
        label: "Đang chạm mặt",
        tone: "bg-rose-500/15 text-rose-100 border-rose-400/20",
        ring: "shadow-[0_0_0_1px_rgba(244,63,94,0.22)]",
        progress: "bg-rose-400",
        description:
            "Vùng tay và mặt đã overlap đủ mạnh để phát cảnh báo realtime.",
        dotColor: "bg-rose-500",
    },
};

const statusCards: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
}> = [
    {
        title: "Hybrid Realtime",
        description: "Xử lý ảnh cục bộ kết hợp máy chủ.",
        icon: Cpu,
    },
    {
        title: "Privacy-first",
        description: "Không lưu trữ hình ảnh người dùng.",
        icon: ShieldAlert,
    },
    {
        title: "Sẵn sàng mở rộng",
        description: "Kiến trúc dễ dàng tích hợp API.",
        icon: Sparkles,
    },
];

const defaultDetection: DetectionResponse = {
    state: "safe",
    score: 0,
    alert: false,
    regions: [],
    hands: 0,
    faceDetected: false,
    latencyMs: 0,
    note: "Khởi động camera để bắt đầu phân tích frame realtime.",
    frameSize: {
        width: 640,
        height: 480,
    },
    overlay: {
        faceBox: null,
        handBoxes: [],
        facePoints: [],
        handPoints: [],
    },
    debug: {
        overlapScore: 0,
        proximityScore: 0,
        fingertipScore: 0,
    },
};

function clampScore(score: number) {
    return Math.max(0, Math.min(1, score));
}

function formatPercent(score: number) {
    return `${Math.round(clampScore(score) * 100)}%`;
}

function projectOverlayPoint(
    point: OverlayPoint,
    sourceSize: { width: number; height: number },
    canvasSize: { width: number; height: number },
) {
    const scale = Math.min(
        canvasSize.width / Math.max(sourceSize.width, 1),
        canvasSize.height / Math.max(sourceSize.height, 1),
    );
    const renderedWidth = sourceSize.width * scale;
    const renderedHeight = sourceSize.height * scale;
    const offsetX = (canvasSize.width - renderedWidth) / 2;
    const offsetY = (canvasSize.height - renderedHeight) / 2;

    return {
        x: point.x * scale + offsetX,
        y: point.y * scale + offsetY,
    };
}

function projectOverlayBox(
    box: OverlayBox,
    sourceSize: { width: number; height: number },
    canvasSize: { width: number; height: number },
) {
    const topLeft = projectOverlayPoint(
        { x: box.x, y: box.y },
        sourceSize,
        canvasSize,
    );
    const bottomRight = projectOverlayPoint(
        { x: box.x + box.width, y: box.y + box.height },
        sourceSize,
        canvasSize,
    );

    return {
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
    };
}

function drawOverlay(
    context: CanvasRenderingContext2D,
    overlay: FrameOverlay,
    canvasSize: { width: number; height: number },
    sourceSize: { width: number; height: number },
    state: DetectionResponse["state"],
) {
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (overlay.faceBox) {
        const projectedFaceBox = projectOverlayBox(
            overlay.faceBox,
            sourceSize,
            canvasSize,
        );
        context.save();
        context.strokeStyle =
            state === "touching_face"
                ? "#fb7185"
                : state === "near_face"
                  ? "#fbbf24"
                  : "#22c55e";
        context.lineWidth = 3;
        context.setLineDash([10, 8]);
        context.strokeRect(
            projectedFaceBox.x,
            projectedFaceBox.y,
            projectedFaceBox.width,
            projectedFaceBox.height,
        );
        context.restore();
    }

    context.save();
    context.fillStyle = "rgba(96, 165, 250, 0.85)";
    overlay.facePoints.forEach((point) => {
        const projectedPoint = projectOverlayPoint(
            point,
            sourceSize,
            canvasSize,
        );
        context.beginPath();
        context.arc(projectedPoint.x, projectedPoint.y, 2.4, 0, Math.PI * 2);
        context.fill();
    });
    context.restore();

    context.save();
    context.strokeStyle = "rgba(6, 182, 212, 0.95)";
    context.lineWidth = 2;
    overlay.handBoxes.forEach((box) => {
        const projectedBox = projectOverlayBox(box, sourceSize, canvasSize);
        context.strokeRect(
            projectedBox.x,
            projectedBox.y,
            projectedBox.width,
            projectedBox.height,
        );
    });
    context.restore();

    context.save();
    context.fillStyle =
        state === "touching_face"
            ? "rgba(251, 113, 133, 0.95)"
            : "rgba(34, 211, 238, 0.95)";
    overlay.handPoints.forEach((point) => {
        const projectedPoint = projectOverlayPoint(
            point,
            sourceSize,
            canvasSize,
        );
        context.beginPath();
        context.arc(projectedPoint.x, projectedPoint.y, 3.2, 0, Math.PI * 2);
        context.fill();
    });
    context.restore();
}

function getCameraAccessErrorMessage(error: unknown) {
    if (typeof window !== "undefined" && !window.isSecureContext) {
        return "Trang hiện không chạy trong secure context. Hãy mở bằng HTTPS hoặc localhost để dùng camera.";
    }

    if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
        return "Trình duyệt hoặc ngữ cảnh hiện tại không hỗ trợ truy cập camera. Kiểm tra HTTPS, localhost và quyền site.";
    }

    if (error instanceof DOMException) {
        switch (error.name) {
            case "NotAllowedError":
            case "PermissionDeniedError":
                return "Trình duyệt đã chặn quyền camera. Kiểm tra quyền camera của site, HTTPS và Permissions-Policy.";
            case "NotFoundError":
            case "DevicesNotFoundError":
                return "Không tìm thấy camera trên thiết bị này.";
            case "NotReadableError":
            case "TrackStartError":
                return "Camera đang bị ứng dụng khác sử dụng hoặc hệ điều hành đang chặn thiết bị.";
            case "OverconstrainedError":
            case "ConstraintNotSatisfiedError":
                return "Thiết bị không đáp ứng được cấu hình camera yêu cầu.";
            default:
                return error.message || "Không thể truy cập webcam.";
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Không thể truy cập webcam.";
}

export function FaceTouchAlertTool() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const overlayRef = useRef<HTMLCanvasElement | null>(null);
    const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastSampleTimeRef = useRef(0);
    const pendingRequestRef = useRef(false);
    const consecutiveTouchFramesRef = useRef(0);
    const cooldownUntilRef = useRef(0);
    const smoothedScoreRef = useRef(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastHealthCheckAtRef = useRef(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const serviceStateRef = useRef<ServiceState>("unknown");
    const sampleRateRef = useRef([15]);

    const [cameraActive, setCameraActive] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [detectorState, setDetectorState] = useState<DetectorState>("idle");
    const [serviceState, setServiceStateRaw] = useState<ServiceState>("unknown");
    const setServiceState = (next: ServiceState) => {
        serviceStateRef.current = next;
        setServiceStateRaw(next);
    };
    const [detection, setDetection] =
        useState<DetectionResponse>(defaultDetection);
    const [displayScore, setDisplayScore] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const [sampleRate, setSampleRateRaw] = useState([15]);
    const setSampleRate = (next: number[]) => {
        sampleRateRef.current = next;
        setSampleRateRaw(next);
    };
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [serviceStatus, setServiceStatus] = useState<string>(
        "Camera chưa khởi động. Công cụ sẽ gửi frame về Python service khi bắt đầu.",
    );
    const [logEntries, setLogEntries] = useState<
        Array<{ type: string; message: string }>
    >([
        { type: "INFO", message: "Initializing webcam feed..." },
        { type: "INFO", message: "Loading MediaPipe models..." },
        { type: "INFO", message: "Service ready. Awaiting frames." },
    ]);

    const syncOverlayCanvasSize = () => {
        const overlayCanvas = overlayRef.current;
        if (!overlayCanvas) {
            return;
        }

        const { width, height } = overlayCanvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(width));
        const nextHeight = Math.max(1, Math.round(height));

        if (
            overlayCanvas.width !== nextWidth ||
            overlayCanvas.height !== nextHeight
        ) {
            overlayCanvas.width = nextWidth;
            overlayCanvas.height = nextHeight;
        }
    };

    const isServiceAvailabilityError = (message: string) => {
        const normalized = message.toLowerCase();
        return (
            normalized.includes("python face-touch service") ||
            normalized.includes("không kết nối được") ||
            normalized.includes("phản hồi quá chậm") ||
            normalized.includes("localhost:8000") ||
            normalized.includes("start-all-ai.ps1") ||
            normalized.includes("mediapipe") ||
            normalized.includes("opencv-python") ||
            normalized.includes("face-touch detection")
        );
    };

    const addLog = (type: string, message: string) => {
        setLogEntries((prev) => [...prev.slice(-19), { type, message }]);
    };

    const checkServiceHealth = async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        lastHealthCheckAtRef.current = Date.now();

        if (!silent) {
            setServiceState("checking");
        }

        try {
            const response = await fetch("/api/face-touch/analyze", {
                method: "GET",
                cache: "no-store",
            });

            const payload = (await response.json()) as ServiceHealthResponse;

            if (response.ok && payload.success) {
                setServiceState("ready");
                addLog("SYS", "Python service connected.");

                if (cameraActive) {
                    setServiceStatus(
                        "Webcam đã sẵn sàng. Python service đang nhận frame realtime.",
                    );
                } else if (!silent) {
                    setServiceStatus(payload.data.message);
                }

                return true;
            }

            const message =
                payload.success === false
                    ? payload.data?.message || payload.error
                    : "Python face-touch service hiện chưa sẵn sàng.";

            setServiceState("offline");
            setServiceStatus(message);
            addLog("WARN", "Service offline.");
            return false;
        } catch {
            const message =
                "Không thể kiểm tra Python face-touch service. Hãy chạy scripts/start-all-ai.ps1 hoặc khởi động FastAPI trong ai-service.";
            setServiceState("offline");
            setServiceStatus(message);
            addLog("ERR", "Cannot reach Python service.");
            return false;
        }
    };

    const playAlertTone = () => {
        if (!audioEnabled || typeof window === "undefined") {
            return;
        }

        const AudioContextCtor =
            window.AudioContext ||
            (
                window as typeof window & {
                    webkitAudioContext?: typeof AudioContext;
                }
            ).webkitAudioContext;

        if (!AudioContextCtor) {
            return;
        }

        const audioContext = audioContextRef.current ?? new AudioContextCtor();
        audioContextRef.current = audioContext;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.0001;
        gainNode.gain.exponentialRampToValueAtTime(
            0.045,
            audioContext.currentTime + 0.02,
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.22,
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.22);
    };

    function stopCamera() {
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
        setDetectorState("idle");
        setDetection(defaultDetection);
        setDisplayScore(0);
        addLog("INFO", "Camera stopped.");
        setServiceStatus(
            serviceState === "ready"
                ? "Camera đã dừng. Python service vẫn sẵn sàng cho lần khởi động tiếp theo."
                : "Camera đã dừng. Bạn có thể bật lại sau khi Python service sẵn sàng.",
        );
    }

    async function analyzeCurrentFrame() {
        const video = videoRef.current;
        const captureCanvas = captureCanvasRef.current;

        if (
            !video ||
            !captureCanvas ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            return;
        }

        const currentServiceState = serviceStateRef.current;
        if (currentServiceState !== "ready") {
            const now = Date.now();
            const shouldRetryHealthCheck =
                now - lastHealthCheckAtRef.current > 4000;

            if (currentServiceState === "unknown" || shouldRetryHealthCheck) {
                void checkServiceHealth({ silent: currentServiceState === "offline" });
            }

            return;
        }

        const width = 480;
        const height = Math.round(
            (video.videoHeight / video.videoWidth) * width,
        );
        if (captureCanvas.width !== width || captureCanvas.height !== height) {
            captureCanvas.width = width;
            captureCanvas.height = height;
        }

        const context = captureCanvas.getContext("2d");
        if (!context) {
            return;
        }

        context.drawImage(video, 0, 0, width, height);
        const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.55);

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        pendingRequestRef.current = true;
        setDetectorState((current) =>
            current === "idle" ? "loading" : current,
        );

        try {
            const response = await fetch("/api/face-touch/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: dataUrl,
                    timestamp: Date.now(),
                    sampleRateFps: sampleRateRef.current[0],
                }),
                signal: controller.signal,
            });

            if (controller.signal.aborted) {
                return;
            }

            const payload = (await response.json()) as
                | { success: true; data: DetectionResponse }
                | { success: false; error?: string; message?: string };

            if (controller.signal.aborted) {
                return;
            }

            if (!response.ok || !payload.success) {
                throw new Error(
                    payload.success
                        ? "Face touch service error"
                        : (payload.error || payload.message || `HTTP ${response.status}: Không thể phân tích frame.`),
                );
            }

            const nextDetection = payload.data;
            const nextScore = clampScore(nextDetection.score);
            smoothedScoreRef.current =
                smoothedScoreRef.current * 0.45 + nextScore * 0.55;
            setDisplayScore(smoothedScoreRef.current);
            setDetection(nextDetection);
            setDetectorState(nextDetection.state);
            setServiceStatus(nextDetection.note);

            addLog(
                "DATA",
                `H:${nextDetection.hands} F:${nextDetection.faceDetected ? 1 : 0} | Score: ${nextScore.toFixed(2)}`,
            );

            const now = Date.now();
            if (nextDetection.state === "touching_face") {
                consecutiveTouchFramesRef.current += 1;
                if (
                    consecutiveTouchFramesRef.current >= 2 &&
                    nextDetection.alert &&
                    now > cooldownUntilRef.current
                ) {
                    cooldownUntilRef.current = now + 1500;
                    setAlertCount((count) => count + 1);
                    playAlertTone();
                    addLog("ALERT", "Face touch detected!");
                }
            } else {
                consecutiveTouchFramesRef.current = 0;
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            const message =
                error instanceof Error
                    ? error.message
                    : "Không thể phân tích frame.";
            if (isServiceAvailabilityError(message)) {
                setServiceState("offline");
                setDetectorState((current) =>
                    current === "loading" ? "safe" : current,
                );
                consecutiveTouchFramesRef.current = 0;
            } else {
                setDetectorState("error");
            }
            setServiceStatus(message);
            addLog("ERR", message);
        } finally {
            pendingRequestRef.current = false;
        }
    }

    useEffect(() => {
        const overlayCanvas = overlayRef.current;
        if (!overlayCanvas) {
            return;
        }

        syncOverlayCanvasSize();

        const overlayContext = overlayCanvas.getContext("2d");
        if (!overlayContext) {
            return;
        }

        const size = {
            width: overlayCanvas.width,
            height: overlayCanvas.height,
        };

        drawOverlay(
            overlayContext,
            detection.overlay,
            size,
            detection.frameSize,
            detection.state,
        );
    }, [detection]);

    useEffect(() => {
        const overlayCanvas = overlayRef.current;
        if (!overlayCanvas || typeof ResizeObserver === "undefined") {
            return;
        }

        const resizeObserver = new ResizeObserver(() => {
            syncOverlayCanvasSize();

            const overlayContext = overlayCanvas.getContext("2d");
            if (!overlayContext) {
                return;
            }

            drawOverlay(
                overlayContext,
                detection.overlay,
                {
                    width: overlayCanvas.width,
                    height: overlayCanvas.height,
                },
                detection.frameSize,
                detection.state,
            );
        });

        resizeObserver.observe(overlayCanvas);

        return () => {
            resizeObserver.disconnect();
        };
    }, [detection]);

    useEffect(() => {
        if (!cameraActive) {
            return;
        }

        let cancelled = false;
        pendingRequestRef.current = false;
        lastSampleTimeRef.current = 0;

        const tick = (now: number) => {
            const fps = sampleRateRef.current[0];
            const frameInterval = 1000 / fps;

            if (
                !cancelled &&
                !pendingRequestRef.current &&
                now - lastSampleTimeRef.current >= frameInterval
            ) {
                lastSampleTimeRef.current = now;
                void analyzeCurrentFrame();
            }

            if (!cancelled) {
                animationFrameRef.current = window.requestAnimationFrame(tick);
            }
        };

        animationFrameRef.current = window.requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            pendingRequestRef.current = false;
        };
    }, [cameraActive]);

    useEffect(() => {
        void checkServiceHealth({ silent: true });

        return () => {
            stopCamera();
            audioContextRef.current?.close().catch(() => undefined);
        };
    }, []);

    async function startCamera() {
        if (cameraActive) {
            return;
        }

        if (typeof window !== "undefined" && !window.isSecureContext) {
            const message =
                "Trang hiện không chạy trong secure context. Hãy mở bằng HTTPS hoặc localhost để dùng camera.";
            setCameraError(message);
            setDetectorState("error");
            setServiceStatus(message);
            addLog("ERR", message);
            return;
        }

        if (
            typeof navigator === "undefined" ||
            !navigator.mediaDevices ||
            typeof navigator.mediaDevices.getUserMedia !== "function"
        ) {
            const message =
                "Trình duyệt hoặc ngữ cảnh hiện tại không hỗ trợ truy cập camera. Kiểm tra HTTPS, localhost và quyền site.";
            setCameraError(message);
            setDetectorState("error");
            setServiceStatus(message);
            addLog("ERR", message);
            return;
        }

        setCameraError(null);
        setDetectorState("loading");
        setServiceStatus("Đang khởi tạo webcam...");
        addLog("INFO", "Initializing webcam...");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            streamRef.current = stream;
            if (!videoRef.current || !overlayRef.current) {
                throw new Error("Không thể khởi tạo vùng hiển thị camera.");
            }

            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            syncOverlayCanvasSize();
            lastSampleTimeRef.current = 0;
            pendingRequestRef.current = false;
            consecutiveTouchFramesRef.current = 0;
            cooldownUntilRef.current = 0;
            smoothedScoreRef.current = 0;
            setCameraActive(true);
            setDetectorState("safe");
            setDetection(defaultDetection);
            setDisplayScore(0);
            addLog("SYS", `Processing at ${sampleRate[0]} FPS.`);
            void checkServiceHealth();
        } catch (error) {
            const message = getCameraAccessErrorMessage(error);
            setCameraError(message);
            setDetectorState("error");
            setServiceStatus(message);
            addLog("ERR", message);
        }
    }

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
            ? "bg-rose-500/15 text-rose-100 border-rose-400/20"
            : serviceState === "offline"
              ? "bg-amber-500/15 text-amber-100 border-amber-400/20"
              : serviceState === "checking"
                ? "bg-cyan-500/15 text-cyan-100 border-cyan-400/20"
                : liveStateConfig.tone;
    const statusDescription = cameraError
        ? "Webcam chưa khởi động được hoặc chưa được cấp quyền truy cập."
        : detectorState === "error"
          ? "Pipeline phân tích frame đang gặp lỗi nội bộ và cần kiểm tra response từ service."
          : serviceState === "offline"
            ? "Webcam vẫn có thể hoạt động, nhưng Python service chưa chạy nên chưa phân tích được frame."
            : serviceState === "checking"
              ? "Đang kiểm tra kết nối tới Python service trước khi gửi frame realtime."
              : liveStateConfig.description;
    const progressStyle = {
        "--progress-indicator": liveStateConfig.progress,
    } as CSSProperties;

    const contactScorePercent = Math.round(clampScore(displayScore) * 100);

    return (
        <div className="min-h-screen bg-[#07111f] font-[family-name:var(--font-space-grotesk),var(--font-sans)]">
            {/* ── Sticky Navbar ── */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#13b6ec]/20 bg-[#07111f]/80 px-6 py-4 backdrop-blur-md md:px-10">
                <div className="flex items-center gap-3">
                    <ScanFace className="size-6 text-[#13b6ec]" />
                    <h2 className="text-lg font-bold uppercase tracking-tight text-slate-100">
                        Face Touch Alert
                    </h2>
                </div>
                <div className="flex items-center gap-4 md:gap-8">
                    <span className="hidden rounded-full bg-[#13b6ec]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#13b6ec] md:inline-flex">
                        AI Vision Realtime Tool
                    </span>
                    <Button
                        className="h-10 rounded-xl bg-[#13b6ec] px-6 text-sm font-bold text-[#07111f] hover:bg-[#13b6ec]/90"
                        onClick={() => {
                            if (cameraActive) {
                                stopCamera();
                                return;
                            }
                            void startCamera();
                        }}
                    >
                        {cameraActive ? (
                            <>
                                <CameraOff className="mr-2 size-4" />
                                Dừng Camera
                            </>
                        ) : (
                            <>
                                <Camera className="mr-2 size-4" />
                                Bật Camera
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* ── Hero Section ── */}
            <section className="w-full bg-[#07111f] px-6 py-12 text-slate-100 md:px-12 lg:px-24">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    {/* Left content */}
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-4">
                            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                                Cảnh báo sờ tay lên mặt với luồng webcam
                                realtime và Python CV service.
                            </h1>
                            <p className="max-w-2xl text-lg font-normal leading-relaxed text-slate-300 md:text-xl">
                                Technical explanation of the graduation thesis
                                project.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {statusCards.map((item) => (
                                <div
                                    key={item.title}
                                    className="flex flex-col gap-3 rounded-xl border border-[#13b6ec]/20 bg-[#13b6ec]/5 p-5 backdrop-blur-sm"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-[#13b6ec]/10 text-[#13b6ec]">
                                        <item.icon className="size-5" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-base font-bold leading-tight">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs font-normal leading-normal text-slate-400">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right webcam preview */}
                    <div className="relative overflow-hidden rounded-2xl border-2 border-[#13b6ec]/30 bg-black/50 p-2 shadow-2xl backdrop-blur-md">
                        <div
                            className={cn(
                                "relative aspect-video overflow-hidden rounded-xl bg-slate-900",
                                liveStateConfig.ring,
                            )}
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
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-800 to-slate-900 px-8 text-center">
                                    <ScanFace className="size-16 text-slate-700" />
                                    <p className="text-sm text-slate-400">
                                        Bấm &ldquo;Bật Camera&rdquo; để bắt đầu
                                    </p>
                                </div>
                            ) : null}

                            {/* Status badge overlay */}
                            <div
                                className={cn(
                                    "absolute right-4 top-4 flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-sm",
                                    statusTone,
                                )}
                            >
                                <div
                                    className={cn(
                                        "size-2 rounded-full animate-pulse",
                                        liveStateConfig.dotColor,
                                    )}
                                />
                                {statusLabel}
                            </div>
                        </div>

                        {/* Mini Metrics */}
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-slate-800/80 p-2 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Hands
                                </p>
                                <p className="text-sm font-bold text-slate-200">
                                    {detection.hands}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-800/80 p-2 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Face
                                </p>
                                <p className="text-sm font-bold text-slate-200">
                                    {detection.faceDetected ? "1" : "0"}
                                </p>
                            </div>
                            <div className="rounded-lg bg-slate-800/80 p-2 text-center">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                    Latency
                                </p>
                                <p className="text-sm font-bold text-[#13b6ec]">
                                    {detection.latencyMs}ms
                                </p>
                            </div>
                        </div>

                        {/* Contact Score Bar */}
                        <div className="mt-2 rounded-lg bg-slate-800/80 p-2">
                            <div className="mb-1 flex justify-between text-xs">
                                <span className="text-slate-400">
                                    Contact Score
                                </span>
                                <span className="font-bold text-slate-200">
                                    {contactScorePercent}%
                                </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-700">
                                <div
                                    className="h-1.5 rounded-full bg-[#13b6ec] transition-all duration-300"
                                    style={{ width: `${contactScorePercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Detection Panel ── */}
            <section className="flex-1 w-full bg-slate-900 px-6 py-8 md:px-12 lg:px-24">
                <div className="mx-auto flex max-w-5xl flex-col gap-8">
                    {/* Tabs */}
                    <Tabs defaultValue="webcam" className="gap-0">
                        <TabsList className="mx-auto flex w-full justify-center rounded-none border-b border-slate-700 bg-transparent p-0">
                            <TabsTrigger
                                value="webcam"
                                className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-4 text-sm font-bold tracking-wide text-slate-400 hover:text-[#13b6ec]/70 hover:bg-slate-800/50 data-[state=active]:border-[#13b6ec] data-[state=active]:bg-transparent data-[state=active]:text-[#13b6ec] data-[state=active]:shadow-none"
                            >
                                Webcam &amp; Trạng thái
                            </TabsTrigger>
                            <TabsTrigger
                                value="pipeline"
                                className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-4 text-sm font-bold tracking-wide text-slate-400 hover:text-[#13b6ec]/70 hover:bg-slate-800/50 data-[state=active]:border-[#13b6ec] data-[state=active]:bg-transparent data-[state=active]:text-[#13b6ec] data-[state=active]:shadow-none"
                            >
                                Pipeline kỹ thuật
                            </TabsTrigger>
                            <TabsTrigger
                                value="evaluation"
                                className="rounded-none border-b-2 border-transparent px-6 pb-3 pt-4 text-sm font-bold tracking-wide text-slate-400 hover:text-[#13b6ec]/70 hover:bg-slate-800/50 data-[state=active]:border-[#13b6ec] data-[state=active]:bg-transparent data-[state=active]:text-[#13b6ec] data-[state=active]:shadow-none"
                            >
                                Đánh giá &amp; Rủi ro
                            </TabsTrigger>
                        </TabsList>

                        {/* ─ Webcam & Trạng thái Tab ─ */}
                        <TabsContent value="webcam" className="mt-6">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                {/* Left 2 cols — Controls + Console */}
                                <div className="flex flex-col gap-6 lg:col-span-2">
                                    {/* Control Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#07111f] p-5 shadow-sm">
                                        <div className="flex items-center gap-6">
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-100">
                                                Camera
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={cameraActive}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                        cameraActive
                                                            ? "bg-[#13b6ec]"
                                                            : "bg-slate-700",
                                                    )}
                                                    onClick={() => {
                                                        if (cameraActive) {
                                                            stopCamera();
                                                        } else {
                                                            void startCamera();
                                                        }
                                                    }}
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform",
                                                            cameraActive
                                                                ? "translate-x-5"
                                                                : "translate-x-0",
                                                        )}
                                                    />
                                                </button>
                                            </label>
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-100">
                                                {audioEnabled
                                                    ? "Âm thanh"
                                                    : "Tắt tiếng"}
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={audioEnabled}
                                                    className={cn(
                                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                                                        audioEnabled
                                                            ? "bg-[#13b6ec]"
                                                            : "bg-slate-700",
                                                    )}
                                                    onClick={() =>
                                                        setAudioEnabled(
                                                            (v) => !v,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className={cn(
                                                            "pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform",
                                                            audioEnabled
                                                                ? "translate-x-5"
                                                                : "translate-x-0",
                                                        )}
                                                    />
                                                </button>
                                            </label>
                                        </div>
                                        <div className="flex flex-1 items-center gap-4 max-w-xs">
                                            <span className="text-xs font-medium text-slate-500">
                                                5 FPS
                                            </span>
                                            <Slider
                                                value={sampleRate}
                                                min={5}
                                                max={24}
                                                step={1}
                                                onValueChange={setSampleRate}
                                                className="flex-1"
                                            />
                                            <span className="text-xs font-medium text-slate-500">
                                                {sampleRate[0]} FPS
                                            </span>
                                        </div>
                                    </div>

                                    {/* System Logs Terminal */}
                                    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-800 bg-black/40 p-5 font-mono text-sm">
                                        <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-2">
                                            <span className="text-xs font-bold uppercase text-slate-500">
                                                System Logs
                                            </span>
                                            <div className="flex gap-1.5">
                                                <div className="size-2.5 rounded-full bg-red-500/80" />
                                                <div className="size-2.5 rounded-full bg-yellow-500/80" />
                                                <div className="size-2.5 rounded-full bg-green-500/80" />
                                            </div>
                                        </div>
                                        <div
                                            className="flex-1 space-y-1 overflow-y-auto text-xs text-slate-400"
                                            style={{ maxHeight: 200 }}
                                        >
                                            {logEntries.map((entry, index) => (
                                                <p key={index}>
                                                    <span
                                                        className={cn(
                                                            entry.type ===
                                                                "INFO" &&
                                                                "text-[#13b6ec]",
                                                            entry.type ===
                                                                "SYS" &&
                                                                "text-green-500",
                                                            entry.type ===
                                                                "DATA" &&
                                                                "text-slate-400",
                                                            entry.type ===
                                                                "WARN" &&
                                                                "text-amber-400",
                                                            entry.type ===
                                                                "ERR" &&
                                                                "text-rose-400",
                                                            entry.type ===
                                                                "ALERT" &&
                                                                "text-rose-500 font-bold",
                                                        )}
                                                    >
                                                        [{entry.type}]
                                                    </span>{" "}
                                                    {entry.message}
                                                </p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Service notes & actions */}
                                    <div className="rounded-xl border border-slate-800 bg-[#07111f] p-5">
                                        <p className="text-sm font-bold text-slate-100">
                                            Service notes
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-400">
                                            {serviceStatus}
                                        </p>
                                        {serviceState === "offline" ? (
                                            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                                <div className="flex items-start gap-3">
                                                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
                                                    <div className="space-y-1">
                                                        <p className="font-semibold">
                                                            Python service ở
                                                            cổng 8000 đang tắt
                                                            hoặc chưa phản hồi.
                                                        </p>
                                                        <p className="text-amber-300/80">
                                                            Khởi động service
                                                            bằng
                                                            scripts/start-all-ai.ps1
                                                            hoặc chạy FastAPI
                                                            trong thư mục
                                                            ai-service.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                        {cameraError ? (
                                            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                                {cameraError}
                                            </div>
                                        ) : null}
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
                                                onClick={() => {
                                                    void checkServiceHealth();
                                                }}
                                            >
                                                {serviceState === "checking" ? (
                                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                                ) : serviceState === "ready" ? (
                                                    <CheckCircle2 className="mr-2 size-4" />
                                                ) : (
                                                    <RefreshCcw className="mr-2 size-4" />
                                                )}
                                                Kiểm tra Python service
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
                                                onClick={() => {
                                                    setAlertCount(0);
                                                    setDetection(
                                                        defaultDetection,
                                                    );
                                                    setDisplayScore(0);
                                                    setServiceStatus(
                                                        "Đã reset bộ đếm cảnh báo và score.",
                                                    );
                                                    consecutiveTouchFramesRef.current = 0;
                                                    cooldownUntilRef.current = 0;
                                                    addLog(
                                                        "SYS",
                                                        "Counters reset.",
                                                    );
                                                }}
                                            >
                                                <RefreshCcw className="mr-2 size-4" />
                                                Reset trạng thái
                                            </Button>
                                        </div>
                                        {/* Active regions */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {detection.regions.length > 0 ? (
                                                detection.regions.map(
                                                    (region) => (
                                                        <Badge
                                                            key={region}
                                                            variant="secondary"
                                                            className="rounded-full bg-slate-800 text-slate-200 hover:bg-slate-800"
                                                        >
                                                            {region}
                                                        </Badge>
                                                    ),
                                                )
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-full bg-slate-800 text-slate-500 hover:bg-slate-800"
                                                >
                                                    Chưa có vùng nhạy cảm bị
                                                    kích hoạt
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right col — Alert counter + Score cards */}
                                <div className="flex flex-col gap-4">
                                    {/* Alert Counter */}
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                                        <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-red-400">
                                            Cảnh báo chạm mặt
                                        </h3>
                                        <div className="text-5xl font-black text-red-500">
                                            {alertCount}
                                        </div>
                                        <p className="mt-2 text-xs text-red-400/70">
                                            Trong phiên hiện tại
                                        </p>
                                    </div>

                                    {/* Score Breakdown Cards */}
                                    <CircleScoreCard
                                        label="Overlap Score"
                                        subtitle="Bounding box overlap"
                                        score={detection.debug.overlapScore}
                                    />
                                    <CircleScoreCard
                                        label="Proximity Score"
                                        subtitle="Hand to face distance"
                                        score={detection.debug.proximityScore}
                                    />
                                    <CircleScoreCard
                                        label="Fingertip Score"
                                        subtitle="Keypoint alignment"
                                        score={detection.debug.fingertipScore}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* ─ Pipeline kỹ thuật Tab ─ */}
                        <TabsContent
                            value="pipeline"
                            className="mt-6 space-y-4"
                        >
                            {pipelineSteps.map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#07111f] p-4"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#13b6ec] text-sm font-bold text-[#07111f]">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-6 text-slate-300">
                                        {step}
                                    </p>
                                </div>
                            ))}

                            {/* States overview */}
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-100">
                                    States
                                </h3>
                                {Object.values(stateConfig).map((item) => (
                                    <div
                                        key={item.label}
                                        className="rounded-xl border border-slate-800 bg-[#07111f] p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-base font-semibold text-slate-100">
                                                {item.label}
                                            </p>
                                            <Badge
                                                className={cn(
                                                    "rounded-full border px-3 py-1",
                                                    item.tone,
                                                )}
                                            >
                                                State
                                            </Badge>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-slate-400">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Python module */}
                            <div className="rounded-xl border border-slate-800 bg-black/40 p-5 text-white">
                                <p className="text-base font-semibold text-white">
                                    Mô-đun Python có thể triển khai ngay trong
                                    ai-service
                                </p>
                                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                                    <p>
                                        Router mới nhận frame base64, giải mã
                                        bằng OpenCV, suy luận bằng MediaPipe và
                                        trả về state, score, regions, overlay để
                                        frontend vẽ trực tiếp trên canvas.
                                    </p>
                                    <p>
                                        Kiến trúc này giữ được tính trình diễn:
                                        frontend đẹp và nhẹ, backend dễ
                                        benchmark, dễ log và có thể thêm clip
                                        review hoặc Qwen3-VL ở phase sau.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ─ Đánh giá & Rủi ro Tab ─ */}
                        <TabsContent
                            value="evaluation"
                            className="mt-6 space-y-4"
                        >
                            {evaluationRows.map((row) => (
                                <div
                                    key={row.label}
                                    className="rounded-xl border border-slate-800 bg-[#07111f] p-4"
                                >
                                    <p className="text-sm font-semibold text-slate-100">
                                        {row.label}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        {row.value}
                                    </p>
                                </div>
                            ))}

                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
                                <p className="text-sm font-semibold text-amber-300">
                                    Các rủi ro cần theo dõi khi demo
                                </p>
                                <ul className="mt-3 space-y-3 text-sm leading-6 text-amber-200/85">
                                    {riskRows.map((row) => (
                                        <li key={row} className="flex gap-3">
                                            <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-400" />
                                            <span>{row}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
        </div>
    );
}

/* ── Circular Score Card ── */
function CircleScoreCard({
    label,
    subtitle,
    score,
}: {
    label: string;
    subtitle: string;
    score: number;
}) {
    const percent = Math.round(clampScore(score) * 100);
    const dashArray = `${percent}, 100`;

    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#07111f] p-4">
            <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-100">
                    {label}
                </span>
                <span className="text-xs text-slate-500">{subtitle}</span>
            </div>
            <div className="relative flex size-12 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <path
                        className="text-slate-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <path
                        className="text-[#13b6ec]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={dashArray}
                        strokeLinecap="round"
                        strokeWidth="3"
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-slate-100">
                    {percent}%
                </span>
            </div>
        </div>
    );
}
