"use client";

import {
    AlertTriangle,
    ArrowRight,
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
import Link from "next/link";
import {
    type CSSProperties,
    useEffect,
    useRef,
    useState,
} from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DetectorState = "idle" | "loading" | "safe" | "near_face" | "touching_face" | "error";
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
    }
> = {
    safe: {
        label: "An toàn",
        tone: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
        ring: "shadow-[0_0_0_1px_rgba(16,185,129,0.22)]",
        progress: "bg-emerald-400",
        description: "Tay đang ở xa mặt hoặc chưa xuất hiện vùng giao cắt đáng kể.",
    },
    near_face: {
        label: "Đưa tay gần mặt",
        tone: "bg-amber-500/15 text-amber-100 border-amber-400/20",
        ring: "shadow-[0_0_0_1px_rgba(251,191,36,0.22)]",
        progress: "bg-amber-400",
        description: "Có dấu hiệu tay tiến gần mặt. Hệ thống đang tăng persistence score.",
    },
    touching_face: {
        label: "Đang chạm mặt",
        tone: "bg-rose-500/15 text-rose-100 border-rose-400/20",
        ring: "shadow-[0_0_0_1px_rgba(244,63,94,0.22)]",
        progress: "bg-rose-400",
        description: "Vùng tay và mặt đã overlap đủ mạnh để phát cảnh báo realtime.",
    },
};

const statusCards: Array<{
    title: string;
    description: string;
    icon: LucideIcon;
}> = [
    {
        title: "Hybrid realtime",
        description: "Webcam và overlay chạy ở frontend, nhận diện hình học được xử lý trong Python service.",
        icon: Cpu,
    },
    {
        title: "Privacy-first",
        description: "Frame được gửi ở độ phân giải thấp và chỉ dùng cho nhận diện trạng thái, phù hợp demo AIoT cục bộ.",
        icon: ShieldAlert,
    },
    {
        title: "Sẵn sàng mở rộng",
        description: "Có thể nối thêm log sự kiện, clip review hoặc lớp AI multimodal để giải thích hành vi.",
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
        const projectedFaceBox = projectOverlayBox(overlay.faceBox, sourceSize, canvasSize);
        context.save();
        context.strokeStyle = state === "touching_face" ? "#fb7185" : state === "near_face" ? "#fbbf24" : "#22c55e";
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
        const projectedPoint = projectOverlayPoint(point, sourceSize, canvasSize);
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
        context.strokeRect(projectedBox.x, projectedBox.y, projectedBox.width, projectedBox.height);
    });
    context.restore();

    context.save();
    context.fillStyle = state === "touching_face" ? "rgba(251, 113, 133, 0.95)" : "rgba(34, 211, 238, 0.95)";
    overlay.handPoints.forEach((point) => {
        const projectedPoint = projectOverlayPoint(point, sourceSize, canvasSize);
        context.beginPath();
        context.arc(projectedPoint.x, projectedPoint.y, 3.2, 0, Math.PI * 2);
        context.fill();
    });
    context.restore();
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

    const [cameraActive, setCameraActive] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [detectorState, setDetectorState] = useState<DetectorState>("idle");
    const [serviceState, setServiceState] = useState<ServiceState>("unknown");
    const [detection, setDetection] = useState<DetectionResponse>(defaultDetection);
    const [displayScore, setDisplayScore] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const [sampleRate, setSampleRate] = useState([15]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [serviceStatus, setServiceStatus] = useState<string>(
        "Camera chưa khởi động. Công cụ sẽ gửi frame về Python service khi bắt đầu.",
    );

    const syncOverlayCanvasSize = () => {
        const overlayCanvas = overlayRef.current;
        if (!overlayCanvas) {
            return;
        }

        const { width, height } = overlayCanvas.getBoundingClientRect();
        const nextWidth = Math.max(1, Math.round(width));
        const nextHeight = Math.max(1, Math.round(height));

        if (overlayCanvas.width !== nextWidth || overlayCanvas.height !== nextHeight) {
            overlayCanvas.width = nextWidth;
            overlayCanvas.height = nextHeight;
        }
    };

    const isServiceConnectivityError = (message: string) => {
        const normalized = message.toLowerCase();
        return (
            normalized.includes("python face-touch service") ||
            normalized.includes("không kết nối được") ||
            normalized.includes("phản hồi quá chậm") ||
            normalized.includes("localhost:8000") ||
            normalized.includes("start-all-ai.ps1")
        );
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

                if (cameraActive) {
                    setServiceStatus("Webcam đã sẵn sàng. Python service đang nhận frame realtime.");
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
            return false;
        } catch {
            const message =
                "Không thể kiểm tra Python face-touch service. Hãy chạy scripts/start-all-ai.ps1 hoặc khởi động FastAPI trong ai-service.";
            setServiceState("offline");
            setServiceStatus(message);
            return false;
        }
    };

    const playAlertTone = () => {
        if (!audioEnabled || typeof window === "undefined") {
            return;
        }

        const AudioContextCtor = window.AudioContext || (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

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
        gainNode.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);

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
        setServiceStatus(
            serviceState === "ready"
                ? "Camera đã dừng. Python service vẫn sẵn sàng cho lần khởi động tiếp theo."
                : "Camera đã dừng. Bạn có thể bật lại sau khi Python service sẵn sàng.",
        );
    }

    async function analyzeCurrentFrame() {
        const video = videoRef.current;
        const captureCanvas = captureCanvasRef.current;

        if (!video || !captureCanvas || video.videoWidth === 0 || video.videoHeight === 0) {
            return;
        }

        if (serviceState !== "ready") {
            const now = Date.now();
            const shouldRetryHealthCheck = now - lastHealthCheckAtRef.current > 4000;

            if (serviceState === "unknown" || shouldRetryHealthCheck) {
                void checkServiceHealth({ silent: serviceState === "offline" });
            }

            return;
        }

        const width = 480;
        const height = Math.round((video.videoHeight / video.videoWidth) * width);
        captureCanvas.width = width;
        captureCanvas.height = height;

        const context = captureCanvas.getContext("2d");
        if (!context) {
            return;
        }

        context.drawImage(video, 0, 0, width, height);
        const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.55);

        pendingRequestRef.current = true;
        setDetectorState((current) => (current === "idle" ? "loading" : current));

        try {
            const response = await fetch("/api/face-touch/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: dataUrl,
                    timestamp: Date.now(),
                    sampleRateFps: sampleRate[0],
                }),
            });

            const payload = (await response.json()) as
                | { success: true; data: DetectionResponse }
                | { success: false; error: string };

            if (!response.ok || !payload.success) {
                throw new Error(payload.success ? "Face touch service error" : payload.error);
            }

            const nextDetection = payload.data;
            const nextScore = clampScore(nextDetection.score);
            smoothedScoreRef.current = smoothedScoreRef.current * 0.45 + nextScore * 0.55;
            setDisplayScore(smoothedScoreRef.current);
            setDetection(nextDetection);
            setDetectorState(nextDetection.state);
            setServiceStatus(nextDetection.note);

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
                }
            } else {
                consecutiveTouchFramesRef.current = 0;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể phân tích frame.";
            if (isServiceConnectivityError(message)) {
                setServiceState("offline");
                setDetectorState((current) => (current === "loading" ? "safe" : current));
                consecutiveTouchFramesRef.current = 0;
            } else {
                setDetectorState("error");
            }
            setServiceStatus(message);
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

        drawOverlay(overlayContext, detection.overlay, size, detection.frameSize, detection.state);
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

        const tick = (now: number) => {
            const fps = sampleRate[0];
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
        };
    }, [cameraActive, sampleRate]);

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

        setCameraError(null);
        setDetectorState("loading");
        setServiceStatus("Đang khởi tạo webcam...");

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
            void checkServiceHealth();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Không lấy được quyền truy cập webcam.";
            setCameraError(message);
            setDetectorState("error");
            setServiceStatus(message);
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
        const statusDescription =
                cameraError
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

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(180deg,_#07111f_0%,_#0b1220_46%,_#eaf5ff_46%,_#f7fbff_100%)]">
            <section className="relative overflow-hidden border-b border-white/10 px-4 pb-18 pt-24 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:items-center">
                    <div className="space-y-7 text-white">
                        <Badge className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-100 hover:bg-cyan-400/10">
                            <Sparkles className="mr-2 size-3.5" />
                            AIoT Realtime Tool
                        </Badge>

                        <div className="space-y-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-200/80">
                                Face Touch Alert
                            </p>
                            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Cảnh báo sờ tay lên mặt với luồng webcam realtime và Python CV service.
                            </h1>
                            <p className="max-w-2xl text-lg leading-8 text-slate-300">
                                Trang tool này được tối ưu để demo đồ án AIoT: giao diện trực quan, giải thích pipeline rõ ràng, và sẵn sàng kết nối module Python trong thư mục ai-service để phát hiện hành vi tay chạm mặt.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {statusCards.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm"
                                >
                                    <item.icon className="mb-3 size-5 text-cyan-300" />
                                    <p className="text-sm font-semibold text-white">{item.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-300">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                size="lg"
                                className="h-11 rounded-xl bg-cyan-400 px-5 font-semibold text-slate-950 hover:bg-cyan-300"
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
                                        Dừng camera
                                    </>
                                ) : (
                                    <>
                                        <Camera className="mr-2 size-4" />
                                        Khởi động demo
                                    </>
                                )}
                            </Button>

                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-11 rounded-xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
                            >
                                <Link href="/tools">
                                    Quay lại kho công cụ
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 rounded-[32px] bg-cyan-400/15 blur-3xl" />
                        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_30px_100px_rgba(8,15,35,0.45)] backdrop-blur-xl">
                            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Camera workspace
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Preview trực tiếp với overlay face và hand landmarks.
                                    </p>
                                </div>
                                <Badge className={cn("rounded-full border px-3 py-1", statusTone)}>
                                    {statusLabel}
                                </Badge>
                            </div>

                            <div className={cn("relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950", liveStateConfig.ring)}>
                                <video
                                    ref={videoRef}
                                    muted
                                    playsInline
                                    className="aspect-[4/3] w-full object-contain"
                                />
                                <canvas
                                    ref={overlayRef}
                                    className="pointer-events-none absolute inset-0 h-full w-full"
                                />
                                <canvas ref={captureCanvasRef} className="hidden" />

                                {!cameraActive ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 px-8 text-center">
                                        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-5 text-cyan-200">
                                            <ScanFace className="size-8" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-white">
                                                Sẵn sàng cho buổi demo realtime
                                            </p>
                                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-300">
                                                Tool sẽ hiển thị khung mặt, vùng tay và state badge ngay khi webcam được cấp quyền.
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs text-slate-300 backdrop-blur-md">
                                    <span className="flex items-center gap-2">
                                        <Waves className="size-3.5 text-cyan-300" />
                                        FPS gửi frame: {sampleRate[0]}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Gauge className="size-3.5 text-cyan-300" />
                                        Latency {detection.latencyMs}ms
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Contact score
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-white">
                                        {formatPercent(displayScore)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Regions
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-white">
                                        {detection.regions.length}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Alerts
                                    </p>
                                    <p className="mt-2 text-3xl font-black text-white">
                                        {alertCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto -mt-10 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <Card className="rounded-[28px] border-slate-200/70 bg-white/92 py-0 shadow-[0_24px_80px_rgba(12,24,48,0.08)] backdrop-blur-xl">
                        <CardHeader className="border-b border-slate-100 px-7 py-6">
                            <CardTitle className="text-2xl font-black text-slate-950">
                                Detection console
                            </CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                                Điều chỉnh tần số gửi frame, theo dõi score, debug tín hiệu overlap và quan sát trạng thái smoothing theo thời gian thực.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 px-7 py-6">
                            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                                <div className="rounded-3xl bg-slate-950 p-5 text-white">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Trạng thái hiện tại
                                            </p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                {statusDescription}
                                            </p>
                                        </div>
                                        <Badge className={cn("rounded-full border px-3 py-1", statusTone)}>
                                            {statusLabel}
                                        </Badge>
                                    </div>

                                    <div style={progressStyle} className="space-y-3">
                                        <Progress
                                            value={displayScore * 100}
                                            className="h-3 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[var(--progress-indicator)]"
                                        />
                                        <div className="flex items-center justify-between text-sm text-slate-300">
                                            <span>Raw score {formatPercent(detection.score)}</span>
                                            <span>Smoothed {formatPercent(displayScore)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                Face detected
                                            </p>
                                            <p className="mt-2 text-xl font-bold text-white">
                                                {detection.faceDetected ? "Có" : "Chưa"}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                                Số tay phát hiện
                                            </p>
                                            <p className="mt-2 text-xl font-bold text-white">
                                                {detection.hands}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            Nhịp suy luận
                                        </p>
                                        <p className="mt-1 text-sm leading-6 text-slate-600">
                                            Giảm FPS khi demo trên CPU yếu. 12–18 FPS cho kết quả mượt nhất.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <Slider
                                            value={sampleRate}
                                            min={5}
                                            max={24}
                                            step={1}
                                            onValueChange={setSampleRate}
                                        />
                                        <div className="flex items-center justify-between text-sm text-slate-600">
                                            <span>5 FPS</span>
                                            <span className="font-semibold text-slate-900">
                                                {sampleRate[0]} FPS
                                            </span>
                                            <span>24 FPS</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Button
                                            variant={audioEnabled ? "default" : "outline"}
                                            className={cn(
                                                "w-full rounded-xl",
                                                audioEnabled
                                                    ? "bg-slate-950 text-white hover:bg-slate-800"
                                                    : "bg-white",
                                            )}
                                            onClick={() => setAudioEnabled((value) => !value)}
                                        >
                                            {audioEnabled ? (
                                                <Volume2 className="mr-2 size-4" />
                                            ) : (
                                                <MicOff className="mr-2 size-4" />
                                            )}
                                            {audioEnabled ? "Âm thanh cảnh báo bật" : "Âm thanh cảnh báo tắt"}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl bg-white"
                                            onClick={() => {
                                                setAlertCount(0);
                                                setDetection(defaultDetection);
                                                setDisplayScore(0);
                                                setServiceStatus("Đã reset bộ đếm cảnh báo và score.");
                                                consecutiveTouchFramesRef.current = 0;
                                                cooldownUntilRef.current = 0;
                                            }}
                                        >
                                            <RefreshCcw className="mr-2 size-4" />
                                            Reset trạng thái
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <MetricCard
                                    icon={Radar}
                                    label="Overlap"
                                    value={formatPercent(detection.debug.overlapScore)}
                                    description="Tỷ lệ giao cắt giữa hull tay và vùng mặt nhạy cảm."
                                />
                                <MetricCard
                                    icon={Gauge}
                                    label="Proximity"
                                    value={formatPercent(detection.debug.proximityScore)}
                                    description="Độ gần của fingertip đến các vùng như mũi, miệng và má."
                                />
                                <MetricCard
                                    icon={Hand}
                                    label="Fingertip focus"
                                    value={formatPercent(detection.debug.fingertipScore)}
                                    description="Điểm ưu tiên khi đầu ngón tay đi vào vùng dễ chạm mặt."
                                />
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-semibold text-slate-900">
                                    Service notes
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {serviceStatus}
                                </p>
                                {serviceState === "offline" ? (
                                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
                                            <div className="space-y-2">
                                                <p className="font-semibold">
                                                    Webcam không phải nguyên nhân chính. Python service ở cổng 8000 đang tắt hoặc chưa phản hồi.
                                                </p>
                                                <p>
                                                    Khởi động service bằng scripts/start-all-ai.ps1 hoặc chạy FastAPI trong thư mục ai-service, sau đó bấm nút kiểm tra lại.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                {cameraError ? (
                                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {cameraError}
                                    </div>
                                ) : null}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl bg-white"
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
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {detection.regions.length > 0 ? (
                                        detection.regions.map((region) => (
                                            <Badge
                                                key={region}
                                                variant="secondary"
                                                className="rounded-full bg-slate-900 text-white hover:bg-slate-900"
                                            >
                                                {region}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge
                                            variant="secondary"
                                            className="rounded-full bg-slate-100 text-slate-600 hover:bg-slate-100"
                                        >
                                            Chưa có vùng nhạy cảm bị kích hoạt
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200/70 bg-white/92 py-0 shadow-[0_24px_80px_rgba(12,24,48,0.08)] backdrop-blur-xl">
                        <CardHeader className="border-b border-slate-100 px-7 py-6">
                            <CardTitle className="text-2xl font-black text-slate-950">
                                Research and implementation guide
                            </CardTitle>
                            <CardDescription className="text-sm leading-6 text-slate-600">
                                Tóm tắt tài liệu kỹ thuật thành từng khối để dễ demo, dễ báo cáo và dễ mở rộng sang logging hoặc AI multimodal sau này.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-7 py-6">
                            <Tabs defaultValue="pipeline" className="gap-5">
                                <TabsList className="w-full justify-start rounded-2xl bg-slate-100 p-1.5">
                                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                                    <TabsTrigger value="states">States</TabsTrigger>
                                    <TabsTrigger value="evaluation">Đánh giá</TabsTrigger>
                                    <TabsTrigger value="python">Python</TabsTrigger>
                                </TabsList>

                                <TabsContent value="pipeline" className="space-y-4">
                                    {pipelineSteps.map((step, index) => (
                                        <div
                                            key={step}
                                            className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm leading-6 text-slate-700">{step}</p>
                                        </div>
                                    ))}
                                </TabsContent>

                                <TabsContent value="states" className="space-y-4">
                                    {Object.values(stateConfig).map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-base font-semibold text-slate-950">
                                                    {item.label}
                                                </p>
                                                <Badge className={cn("rounded-full border px-3 py-1", item.tone)}>
                                                    State
                                                </Badge>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </TabsContent>

                                <TabsContent value="evaluation" className="space-y-4">
                                    {evaluationRows.map((row) => (
                                        <div
                                            key={row.label}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {row.value}
                                            </p>
                                        </div>
                                    ))}

                                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                        <p className="text-sm font-semibold text-amber-900">
                                            Các rủi ro cần theo dõi khi demo
                                        </p>
                                        <ul className="mt-3 space-y-3 text-sm leading-6 text-amber-900/85">
                                            {riskRows.map((row) => (
                                                <li key={row} className="flex gap-3">
                                                    <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-600" />
                                                    <span>{row}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </TabsContent>

                                <TabsContent value="python" className="space-y-4">
                                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
                                        <p className="text-base font-semibold text-white">
                                            Mô-đun Python có thể triển khai ngay trong ai-service
                                        </p>
                                        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                                            <p>
                                                Router mới nhận frame base64, giải mã bằng OpenCV, suy luận bằng MediaPipe và trả về `state`, `score`, `regions`, `overlay` để frontend vẽ trực tiếp trên canvas.
                                            </p>
                                            <p>
                                                Kiến trúc này giữ được tính trình diễn của đồ án: frontend đẹp và nhẹ, backend dễ benchmark, dễ log và có thể thêm clip review hoặc Qwen3-VL ở phase sau.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-sm font-semibold text-slate-950">
                                            Stitch note
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            Stitch project đã được tạo để giữ context thiết kế. Trong môi trường hiện tại chỉ có khả năng tạo project và chỉnh screen sẵn có, nhưng chưa có endpoint sinh screen đầu tiên từ prompt, nên phần UI đã được hiện thực trực tiếp theo visual direction hiện đại để không chặn tiến độ triển khai.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-2.5 text-cyan-700">
                    <Icon className="size-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-sm text-slate-500">{value}</p>
                </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
        </div>
    );
}