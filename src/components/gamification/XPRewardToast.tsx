"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

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
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, xp, onDone]);

    if (!show && !visible) return null;

    return (
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
                visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-4"
            }`}
        >
            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-2xl shadow-amber-500/30">
                <Star className="w-5 h-5 fill-white" />
                <span>+{xp} XP</span>
            </div>
        </div>
    );
}
