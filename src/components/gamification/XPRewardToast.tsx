"use client";

import { useEffect, useState } from "react";

interface XPRewardToastProps {
    xp: number;
    show: boolean;
    onDone: () => void;
}

export default function XPRewardToast({
    xp,
    show,
    onDone,
}: XPRewardToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show && xp > 0) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onDone, 300);
            }, 1800);
            return () => clearTimeout(timer);
        }
    }, [show, xp, onDone]);

    if (!show && !visible) return null;

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
                visible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 -translate-y-2 scale-95"
            }`}
        >
            <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-semibold text-sm shadow-lg backdrop-blur-sm"
                style={{
                    background: "linear-gradient(135deg, #6366f1, #9333ea)",
                }}
            >
                <span>⭐</span>
                <span>+{xp} XP</span>
            </div>
        </div>
    );
}
