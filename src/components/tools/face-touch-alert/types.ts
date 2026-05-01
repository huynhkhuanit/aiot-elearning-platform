import type { Dispatch, RefObject, SetStateAction } from "react";

export type DetectorState =
    | "idle"
    | "loading"
    | "safe"
    | "near_face"
    | "touching_face"
    | "error";

export type FaceRegion =
    | "forehead"
    | "left_cheek"
    | "right_cheek"
    | "nose"
    | "mouth"
    | "chin"
    | "eye_zone";

export type OverlayBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type OverlayPoint = {
    x: number;
    y: number;
};

export type FrameOverlay = {
    faceBox?: OverlayBox | null;
    handBoxes: OverlayBox[];
    facePoints: OverlayPoint[];
    handPoints: OverlayPoint[];
};

export type DetectionResponse = {
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
        inFrontScore?: number;
        depthScore?: number;
    };
};

export type ServiceState = "unknown" | "checking" | "ready" | "offline";

export type ServiceHealthResponse =
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

export interface UseFaceTouchDetectionReturn {
    videoRef: RefObject<HTMLVideoElement | null>;
    overlayRef: RefObject<HTMLCanvasElement | null>;
    captureCanvasRef: RefObject<HTMLCanvasElement | null>;
    cameraActive: boolean;
    audioEnabled: boolean;
    detectorState: DetectorState;
    serviceState: ServiceState;
    detection: DetectionResponse;
    displayScore: number;
    alertCount: number;
    sampleRate: number[];
    cameraError: string | null;
    serviceStatus: string;
    startCamera: () => void;
    stopCamera: () => void;
    toggleCamera: () => void;
    setAudioEnabled: Dispatch<SetStateAction<boolean>>;
    setSampleRate: (value: number[]) => void;
    checkServiceHealth: () => void;
    resetCounters: () => void;
}

export const defaultDetection: DetectionResponse = {
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
        inFrontScore: 0,
        depthScore: 0,
    },
};

export function clampScore(score: number) {
    return Math.max(0, Math.min(1, score));
}

export function formatPercent(score: number) {
    return `${Math.round(clampScore(score) * 100)}%`;
}
