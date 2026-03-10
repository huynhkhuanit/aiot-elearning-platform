import { NextResponse, type NextRequest } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = (formData as any).get("file") as File | Blob | null;

        if (!file) {
            return NextResponse.json(
                { error: "No PDF file provided" },
                { status: 400 },
            );
        }

        const filename = "name" in file ? (file as any).name : "";
        if (!filename.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json(
                { error: "Only PDF files are accepted" },
                { status: 400 },
            );
        }

        // Forward to Python AI service
        const forwardForm = new FormData();
        forwardForm.append("file", file as Blob, filename || "document.pdf");

        const response = await fetch(`${AI_SERVICE_URL}/cv/parse-pdf`, {
            method: "POST",
            body: forwardForm,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.detail ?? "Failed to parse PDF" },
                { status: response.status },
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("[CV Parse PDF Error]", error);
        return NextResponse.json(
            {
                error: "Failed to parse PDF. Make sure the AI service is running.",
            },
            { status: 500 },
        );
    }
}
