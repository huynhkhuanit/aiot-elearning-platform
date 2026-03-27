"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface LessonQAButtonProps {
    onClick: () => void;
    unreadCount?: number;
}

export default function LessonQAButton({
    onClick,
    unreadCount = 0,
}: LessonQAButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClick}
                        className="fixed left-6 bottom-6 z-50 size-10 rounded-full shadow-md"
                        aria-label="Mở hỏi đáp"
                    >
                        <div className="relative">
                            <MessageSquare className="size-4" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] rounded-full size-4 flex items-center justify-center font-bold animate-pulse">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </div>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Hỏi & Đáp</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
