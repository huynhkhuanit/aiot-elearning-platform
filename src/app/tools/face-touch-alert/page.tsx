import type { Metadata } from "next";

import { FaceTouchAlertTool } from "@/components/tools/face-touch-alert/FaceTouchAlertTool";

export const metadata: Metadata = {
    title: "Cảnh báo sờ tay lên mặt | CodeSense AI",
    description:
        "Tool AI Vision phát hiện hành vi đưa tay gần hoặc chạm lên mặt theo thời gian thực bằng webcam và Python CV service.",
};

export default function FaceTouchAlertPage() {
    return <FaceTouchAlertTool />;
}