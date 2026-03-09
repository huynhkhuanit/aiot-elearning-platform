import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

type AnalyzeRequest = {
    image?: string;
    timestamp?: number;
    sampleRateFps?: number;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as AnalyzeRequest;

        if (!body.image || typeof body.image !== "string") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Image payload is required.",
                },
                { status: 400 },
            );
        }

        let upstreamResponse: Response;
        try {
            upstreamResponse = await fetch(`${FASTAPI_BASE_URL}/api/face-touch/analyze-frame`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: body.image,
                    timestamp: body.timestamp ?? Date.now(),
                    sample_rate_fps: body.sampleRateFps ?? 10,
                }),
                signal: AbortSignal.timeout(20000),
            });
        } catch (error) {
            const message =
                error instanceof Error &&
                (error.name === "TimeoutError" || error.name === "AbortError")
                    ? "Python face-touch service timeout. Hãy giảm FPS hoặc kiểm tra máy chủ AI."
                    : "Không kết nối được tới Python face-touch service tại localhost:8000.";

            return NextResponse.json(
                {
                    success: false,
                    error: message,
                },
                { status: 503 },
            );
        }

        const payload = await upstreamResponse.json().catch(() => null);

        if (!upstreamResponse.ok || !payload) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        payload?.detail ||
                        payload?.error ||
                        "Python face-touch service returned an invalid response.",
                },
                { status: upstreamResponse.ok ? 502 : upstreamResponse.status },
            );
        }

        return NextResponse.json({
            success: true,
            data: payload,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unexpected error while analyzing face-touch frame.",
            },
            { status: 500 },
        );
    }
}