"use client";

import AIAgentPanel from "./AIAgentPanel";

interface AIChatPanelProps {
    codeContext?: string;
    language?: string;
    onInsertCode?: (code: string) => void;
    className?: string;
    theme?: "light" | "dark";
}

export default function AIChatPanel(props: AIChatPanelProps) {
    return <AIAgentPanel {...props} />;
}
