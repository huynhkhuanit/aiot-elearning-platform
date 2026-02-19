import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Code Playground — CodeSense AIoT",
    description: "IDE-style code editor with live preview and AI assistant",
};

export default function PlaygroundLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-screen overflow-hidden bg-[#1e1e1e]">
            {children}
        </div>
    );
}
