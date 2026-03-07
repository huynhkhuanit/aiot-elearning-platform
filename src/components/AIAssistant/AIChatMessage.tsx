"use client";

import type { AIChatMessage as ChatMessageType } from "@/types/ai";
import AIAgentMessage from "./AIAgentMessage";

interface AIChatMessageProps {
    message: ChatMessageType;
    onInsertCode?: (code: string) => void;
}

export default function AIChatMessage({
    message,
    onInsertCode,
}: AIChatMessageProps) {
    return (
        <AIAgentMessage
            message={message}
            onInsertCode={onInsertCode}
            theme="dark"
            accent="blue"
        />
    );
}
