import { NextResponse, type NextRequest } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sectionType, currentContent, role } = body as {
            sectionType: string;
            currentContent?: string;
            role?: string;
        };

        if (!sectionType) {
            return NextResponse.json(
                { error: "sectionType is required" },
                { status: 400 },
            );
        }

        const response = await fetch(`${AI_SERVICE_URL}/cv/suggest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                section_type: sectionType,
                current_content: currentContent ?? "",
                role: role ?? "Fullstack Developer",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error:
                        errorData.detail ??
                        "AI service unavailable. Is Ollama running?",
                },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[CV Suggest API Error]", error);
        return NextResponse.json(
            {
                error: "Failed to get AI suggestion. Make sure the AI service and Ollama are running.",
            },
            { status: 500 },
        );
    }
}
