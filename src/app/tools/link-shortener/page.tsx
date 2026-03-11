import { LinkShortenerTool } from "@/components/tools/link-shortener/LinkShortenerTool";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Rút gọn liên kết - CodeSense",
    description:
        "Tạo link ngắn gọn, dễ nhớ để chia sẻ roadmap, portfolio, tài liệu hoặc bất kỳ URL nào.",
};

export default function LinkShortenerPage() {
    return <LinkShortenerTool />;
}
