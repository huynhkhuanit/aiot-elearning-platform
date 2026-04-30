import type { Metadata } from "next";

import { ClipPathMakerTool } from "@/components/tools/clip-path/ClipPathMakerTool";

export const metadata: Metadata = {
    title: "CSS clip-path maker | CodeSense AI",
    description:
        "Tạo clip-path trực quan với preset polygon, marker kéo thả, demo background và CSS output giống trải nghiệm Clippy.",
};

export default function ClipPathMakerPage() {
    return <ClipPathMakerTool />;
}
