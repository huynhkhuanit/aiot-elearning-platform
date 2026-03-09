import { NextRequest, NextResponse } from "next/server";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "http://localhost:8000";

const SERVICE_BOOT_HINT =
    "Hãy khởi động Python AI service trong ai-service hoặc chạy scripts/start-all-ai.ps1.";

type AnalyzeRequest = {
    image?: string;
    timestamp?: number;
    sampleRateFps?: number;
};

type ServiceHealthPayload = {
    available: boolean;
    baseUrl: string;
    message: string;
};

function getServiceUnavailableMessage(reason?: "timeout" | "offline") {
    if (reason === "timeout") {
        return `Python face-touch service phản hồi quá chậm tại ${FASTAPI_BASE_URL}. ${SERVICE_BOOT_HINT}`;
    }

    return `Không kết nối được tới Python face-touch service tại ${FASTAPI_BASE_URL}. ${SERVICE_BOOT_HINT}`;
}

async function getServiceHealth(): Promise<ServiceHealthPayload> {
    try {
        const response = await fetch(`${FASTAPI_BASE_URL}/health`, {
            method: "GET",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            return {
                available: false,
                baseUrl: FASTAPI_BASE_URL,
                message: getServiceUnavailableMessage(),
            };
        }

        return {
            available: true,
            baseUrl: FASTAPI_BASE_URL,
            message: `Python face-touch service đang sẵn sàng tại ${FASTAPI_BASE_URL}.`,
        };
    } catch (error) {
        const reason =
            error instanceof Error &&
            (error.name === "TimeoutError" || error.name === "AbortError")
                ? "timeout"
                : "offline";

        return {
            available: false,
            baseUrl: FASTAPI_BASE_URL,
            message: getServiceUnavailableMessage(reason),
        };
    }
}

export async function GET() {
    const health = await getServiceHealth();

    return NextResponse.json(
        {
            success: health.available,
            data: health,
            error: health.available ? undefined : health.message,
        },
        { status: health.available ? 200 : 503 },
    );
}

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
                    ? getServiceUnavailableMessage("timeout")
                    : getServiceUnavailableMessage("offline");

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