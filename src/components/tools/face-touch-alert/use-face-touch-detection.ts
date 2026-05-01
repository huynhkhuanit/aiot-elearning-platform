"use client";

import { useEffect, useRef, useState } from "react";

import {
    clampScore,
    defaultDetection,
    type DetectionResponse,
    type FrameOverlay,
    type OverlayBox,
    type OverlayPoint,
    type ServiceHealthResponse,
    type ServiceState,
    type UseFaceTouchDetectionReturn,
} from "./types";

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

export function useFaceTouchDetection(): UseFaceTouchDetectionReturn {
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
    const [detectorState, setDetectorState] = useState<
        UseFaceTouchDetectionReturn["detectorState"]
    >("idle");
    const [serviceState, setServiceStateRaw] =
        useState<ServiceState>("unknown");
    const [detection, setDetection] =
        useState<DetectionResponse>(defaultDetection);
    const [displayScore, setDisplayScore] = useState(0);
    const [alertCount, setAlertCount] = useState(0);
    const [sampleRate, setSampleRateRaw] = useState([15]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [serviceStatus, setServiceStatus] = useState<string>(
        "Camera chưa khởi động. Công cụ sẽ gửi frame về Python service khi bắt đầu.",
    );
    const [, setLogEntries] = useState<Array<{ type: string; message: string }>>(
        [
            { type: "INFO", message: "Initializing webcam feed..." },
            { type: "INFO", message: "Loading MediaPipe models..." },
            { type: "INFO", message: "Service ready. Awaiting frames." },
        ],
    );

    const setServiceState = (next: ServiceState) => {
        serviceStateRef.current = next;
        setServiceStateRaw(next);
    };

    const setSampleRate = (next: number[]) => {
        sampleRateRef.current = next;
        setSampleRateRaw(next);
    };

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
                void checkServiceHealth({
                    silent: currentServiceState === "offline",
                });
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
                        : payload.error ||
                              payload.message ||
                              `HTTP ${response.status}: Không thể phân tích frame.`,
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
                `H:${nextDetection.hands} F:${
                    nextDetection.faceDetected ? 1 : 0
                } | Score: ${nextScore.toFixed(2)}`,
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

    const toggleCamera = () => {
        if (cameraActive) {
            stopCamera();
            return;
        }

        void startCamera();
    };

    const resetCounters = () => {
        setAlertCount(0);
        setDetection(defaultDetection);
        setDisplayScore(0);
        setServiceStatus("Đã reset bộ đếm cảnh báo và score.");
        consecutiveTouchFramesRef.current = 0;
        cooldownUntilRef.current = 0;
        smoothedScoreRef.current = 0;
        addLog("SYS", "Counters reset.");
    };

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

    return {
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
        startCamera,
        stopCamera,
        toggleCamera,
        setAudioEnabled,
        setSampleRate,
        checkServiceHealth,
        resetCounters,
    };
}
