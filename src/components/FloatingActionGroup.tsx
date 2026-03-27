"use client";

import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FloatingActionGroupProps {
    onQAClick: () => void;
    onReviewClick: () => void;
    unreadCount?: number;
    showReview?: boolean;
    showQA?: boolean;
}

export default function FloatingActionGroup({
    onQAClick,
    onReviewClick,
    unreadCount = 0,
    showReview = true,
    showQA = true,
}: FloatingActionGroupProps) {
    if (!showReview && !showQA) return null;

    return (
        <TooltipProvider>
            <ButtonGroup className="fixed left-6 bottom-6 z-50 rounded-lg bg-primary shadow-lg shadow-primary/20 border-0">
                {showQA && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onQAClick}
                                aria-label="Mở hỏi đáp"
                                className="relative text-primary-foreground hover:bg-white/15 hover:text-primary-foreground border-0"
                            >
                                <MessageSquare className="size-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full size-4 flex items-center justify-center font-bold animate-pulse">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Hỏi & Đáp</TooltipContent>
                    </Tooltip>
                )}

                {showQA && showReview && (
                    <div className="w-px self-stretch bg-primary-foreground/20" />
                )}

                {showReview && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onReviewClick}
                                aria-label="Đánh giá khóa học"
                                className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground border-0"
                            >
                                <Star className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            Đánh giá khóa học
                        </TooltipContent>
                    </Tooltip>
                )}
            </ButtonGroup>
        </TooltipProvider>
    );
}
