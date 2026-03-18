import type { ReactNode } from "react";
import { Balsamiq_Sans } from "next/font/google";
import "./roadmap-section.css";

const roadmapFont = Balsamiq_Sans({
    subsets: ["latin"],
    weight: ["400", "700"],
});

export default function RoadmapLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className={`roadmap-section ${roadmapFont.className}`}>
            {children}
        </div>
    );
}
