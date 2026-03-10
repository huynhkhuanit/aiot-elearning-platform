import { CVBuilder } from "@/components/tools/cv-builder/CVBuilder";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tạo CV xin việc chuyên nghiệp - CodeSense",
    description:
        "Tạo CV ATS-friendly với trợ lý AI Qwen 2.5 Coder. Tối ưu theo từng ngành nghề.",
};

export default function CVBuilderPage() {
    return <CVBuilder />;
}
