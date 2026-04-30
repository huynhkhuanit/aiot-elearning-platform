"use client";

import {
    type ClipboardEvent,
    type CSSProperties,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

type Point = {
    x: number;
    y: number;
};

type ShapePreset = {
    name: string;
    color: string;
    points: Point[];
};

type DemoBackground = {
    label: string;
    src: string;
};

const HANDLE_COLORS = [
    "#ff6347",
    "#3cb371",
    "#ffa500",
    "#1e90ff",
    "#da70d6",
    "#d3d3d3",
    "#00ced1",
    "#db7093",
    "#f0e68c",
    "#32cd32",
    "#ff7f50",
    "#6a5acd",
    "#cd5c5c",
    "#808080",
    "#dda0dd",
    "#6b8e23",
    "#90ee90",
    "#ffa07a",
    "#ffd700",
    "#cd853f",
    "#4169e1",
    "#dc143c",
    "#00bcd4",
    "#8a2be2",
];

const SHAPE_PRESETS: ShapePreset[] = [
    {
        name: "Triangle",
        color: "#ff6347",
        points: [
            { x: 50, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 100 },
        ],
    },
    {
        name: "Trapezoid",
        color: "#3cb371",
        points: [
            { x: 20, y: 0 },
            { x: 80, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        name: "Parallelogram",
        color: "#ffa500",
        points: [
            { x: 25, y: 0 },
            { x: 100, y: 0 },
            { x: 75, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        name: "Rhombus",
        color: "#1e90ff",
        points: [
            { x: 50, y: 0 },
            { x: 100, y: 50 },
            { x: 50, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        name: "Pentagon",
        color: "#da70d6",
        points: [
            { x: 50, y: 0 },
            { x: 100, y: 38 },
            { x: 82, y: 100 },
            { x: 18, y: 100 },
            { x: 0, y: 38 },
        ],
    },
    {
        name: "Hexagon",
        color: "#d3d3d3",
        points: [
            { x: 25, y: 0 },
            { x: 75, y: 0 },
            { x: 100, y: 50 },
            { x: 75, y: 100 },
            { x: 25, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        name: "Heptagon",
        color: "#00ced1",
        points: [
            { x: 50, y: 0 },
            { x: 90, y: 20 },
            { x: 100, y: 60 },
            { x: 75, y: 100 },
            { x: 25, y: 100 },
            { x: 0, y: 60 },
            { x: 10, y: 20 },
        ],
    },
    {
        name: "Octagon",
        color: "#db7093",
        points: [
            { x: 30, y: 0 },
            { x: 70, y: 0 },
            { x: 100, y: 30 },
            { x: 100, y: 70 },
            { x: 70, y: 100 },
            { x: 30, y: 100 },
            { x: 0, y: 70 },
            { x: 0, y: 30 },
        ],
    },
    {
        name: "Nonagon",
        color: "#f0e68c",
        points: [
            { x: 50, y: 0 },
            { x: 83, y: 12 },
            { x: 100, y: 43 },
            { x: 94, y: 78 },
            { x: 68, y: 100 },
            { x: 32, y: 100 },
            { x: 6, y: 78 },
            { x: 0, y: 43 },
            { x: 17, y: 12 },
        ],
    },
    {
        name: "Decagon",
        color: "#32cd32",
        points: [
            { x: 50, y: 0 },
            { x: 80, y: 10 },
            { x: 100, y: 35 },
            { x: 100, y: 70 },
            { x: 80, y: 90 },
            { x: 50, y: 100 },
            { x: 20, y: 90 },
            { x: 0, y: 70 },
            { x: 0, y: 35 },
            { x: 20, y: 10 },
        ],
    },
    {
        name: "Bevel",
        color: "#ff7f50",
        points: [
            { x: 20, y: 0 },
            { x: 80, y: 0 },
            { x: 100, y: 20 },
            { x: 100, y: 80 },
            { x: 80, y: 100 },
            { x: 20, y: 100 },
            { x: 0, y: 80 },
            { x: 0, y: 20 },
        ],
    },
    {
        name: "Rabbet",
        color: "#6a5acd",
        points: [
            { x: 0, y: 15 },
            { x: 15, y: 15 },
            { x: 15, y: 0 },
            { x: 85, y: 0 },
            { x: 85, y: 15 },
            { x: 100, y: 15 },
            { x: 100, y: 85 },
            { x: 85, y: 85 },
            { x: 85, y: 100 },
            { x: 15, y: 100 },
            { x: 15, y: 85 },
            { x: 0, y: 85 },
        ],
    },
    {
        name: "Left arrow",
        color: "#cd5c5c",
        points: [
            { x: 40, y: 0 },
            { x: 40, y: 20 },
            { x: 100, y: 20 },
            { x: 100, y: 80 },
            { x: 40, y: 80 },
            { x: 40, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        name: "Right arrow",
        color: "#808080",
        points: [
            { x: 0, y: 20 },
            { x: 60, y: 20 },
            { x: 60, y: 0 },
            { x: 100, y: 50 },
            { x: 60, y: 100 },
            { x: 60, y: 80 },
            { x: 0, y: 80 },
        ],
    },
    {
        name: "Left Point",
        color: "#dda0dd",
        points: [
            { x: 25, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 25, y: 100 },
            { x: 0, y: 50 },
        ],
    },
    {
        name: "Right Point",
        color: "#6b8e23",
        points: [
            { x: 0, y: 0 },
            { x: 75, y: 0 },
            { x: 100, y: 50 },
            { x: 75, y: 100 },
            { x: 0, y: 100 },
        ],
    },
    {
        name: "Left Chevron",
        color: "#90ee90",
        points: [
            { x: 100, y: 0 },
            { x: 75, y: 50 },
            { x: 100, y: 100 },
            { x: 25, y: 100 },
            { x: 0, y: 50 },
            { x: 25, y: 0 },
        ],
    },
    {
        name: "Right Chevron",
        color: "#ffa07a",
        points: [
            { x: 75, y: 0 },
            { x: 100, y: 50 },
            { x: 75, y: 100 },
            { x: 0, y: 100 },
            { x: 25, y: 50 },
            { x: 0, y: 0 },
        ],
    },
    {
        name: "Star",
        color: "#ffd700",
        points: [
            { x: 50, y: 0 },
            { x: 61, y: 35 },
            { x: 98, y: 35 },
            { x: 68, y: 57 },
            { x: 79, y: 91 },
            { x: 50, y: 70 },
            { x: 21, y: 91 },
            { x: 32, y: 57 },
            { x: 2, y: 35 },
            { x: 39, y: 35 },
        ],
    },
    {
        name: "Cross",
        color: "#cd853f",
        points: [
            { x: 10, y: 25 },
            { x: 35, y: 25 },
            { x: 35, y: 0 },
            { x: 65, y: 0 },
            { x: 65, y: 25 },
            { x: 90, y: 25 },
            { x: 90, y: 50 },
            { x: 65, y: 50 },
            { x: 65, y: 100 },
            { x: 35, y: 100 },
            { x: 35, y: 50 },
            { x: 10, y: 50 },
        ],
    },
    {
        name: "Message",
        color: "#4169e1",
        points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 75 },
            { x: 75, y: 75 },
            { x: 75, y: 100 },
            { x: 50, y: 75 },
            { x: 0, y: 75 },
        ],
    },
    {
        name: "Close",
        color: "#dc143c",
        points: [
            { x: 20, y: 0 },
            { x: 0, y: 20 },
            { x: 30, y: 50 },
            { x: 0, y: 80 },
            { x: 20, y: 100 },
            { x: 50, y: 70 },
            { x: 80, y: 100 },
            { x: 100, y: 80 },
            { x: 70, y: 50 },
            { x: 100, y: 20 },
            { x: 80, y: 0 },
            { x: 50, y: 30 },
        ],
    },
    {
        name: "Frame",
        color: "#00bcd4",
        points: [
            { x: 0, y: 0 },
            { x: 0, y: 100 },
            { x: 25, y: 100 },
            { x: 25, y: 25 },
            { x: 75, y: 25 },
            { x: 75, y: 75 },
            { x: 25, y: 75 },
            { x: 25, y: 100 },
            { x: 100, y: 100 },
            { x: 100, y: 0 },
        ],
    },
    {
        name: "Custom Polygon",
        color: "#8a2be2",
        points: [
            { x: 10, y: 75 },
            { x: 10, y: 25 },
            { x: 35, y: 0 },
            { x: 100, y: 10 },
            { x: 90, y: 30 },
            { x: 50, y: 30 },
            { x: 40, y: 40 },
            { x: 40, y: 60 },
            { x: 50, y: 70 },
            { x: 90, y: 70 },
            { x: 100, y: 90 },
            { x: 35, y: 100 },
        ],
    },
];

const DEMO_BACKGROUNDS: DemoBackground[] = [
    {
        label: "Pittsburgh bridge",
        src: "/tools/clip-path/pittsburgh.jpg",
    },
    {
        label: "Firenze hills",
        src: "/tools/clip-path/fierenze.jpg",
    },
    {
        label: "Sparkler",
        src: "/tools/clip-path/sparkler.jpg",
    },
    {
        label: "Miami beach",
        src: "/tools/clip-path/miami.jpg",
    },
];

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function clonePoints(points: Point[]) {
    return points.map((point) => ({ ...point }));
}

function formatPercent(value: number) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

function formatPoint(point: Point) {
    return `${formatPercent(point.x)}% ${formatPercent(point.y)}%`;
}

function pointsToPolygon(points: Point[]) {
    return `polygon(${points.map(formatPoint).join(", ")})`;
}

function getHandleColor(index: number) {
    return HANDLE_COLORS[index % HANDLE_COLORS.length];
}

function normalizeShapeClassName(name: string) {
    return name.replace(/\s+/g, "-").toLowerCase();
}

function toCssImageUrl(url: string) {
    return `url(${JSON.stringify(url)})`;
}

function getUsableImageUrl(value: string) {
    const trimmedValue = value.trim();
    if (
        /^(https?:\/\/|data:image\/|blob:|\/)/i.test(trimmedValue)
    ) {
        return trimmedValue;
    }

    return "";
}

function insertPointAfter(points: Point[], index: number, point: Point) {
    if (points.length === 0) {
        return [point];
    }

    return [...points.slice(0, index + 1), point, ...points.slice(index + 1)];
}

export function ClipPathMakerTool() {
    const [activeShapeName, setActiveShapeName] = useState(SHAPE_PRESETS[0].name);
    const [points, setPoints] = useState<Point[]>(() =>
        clonePoints(SHAPE_PRESETS[0].points),
    );
    const [selectedPointIndex, setSelectedPointIndex] = useState(0);
    const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
    const [demoWidth, setDemoWidth] = useState(280);
    const [demoHeight, setDemoHeight] = useState(280);
    const [backgroundUrl, setBackgroundUrl] = useState(DEMO_BACKGROUNDS[0].src);
    const [customBackgroundUrl, setCustomBackgroundUrl] = useState("");
    const [showOutsideClip, setShowOutsideClip] = useState(false);
    const [copied, setCopied] = useState(false);

    const clipboardRef = useRef<HTMLDivElement | null>(null);
    const pointsRef = useRef(points);
    const draggingPointIndexRef = useRef(draggingPointIndex);

    const activeShape =
        SHAPE_PRESETS.find((shape) => shape.name === activeShapeName) ??
        SHAPE_PRESETS[0];
    const clipPath = useMemo(() => pointsToPolygon(points), [points]);
    const cssCode = `clip-path: ${clipPath};`;
    const selectedPoint = points[selectedPointIndex] ?? points[0];

    useEffect(() => {
        pointsRef.current = points;
    }, [points]);

    useEffect(() => {
        draggingPointIndexRef.current = draggingPointIndex;
    }, [draggingPointIndex]);

    useEffect(() => {
        if (!copied) {
            return;
        }

        const timeoutId = window.setTimeout(() => setCopied(false), 1200);
        return () => window.clearTimeout(timeoutId);
    }, [copied]);

    useEffect(() => {
        if (draggingPointIndex === null) {
            return;
        }

        function handlePointerMove(event: PointerEvent) {
            const bounds = clipboardRef.current?.getBoundingClientRect();
            const index = draggingPointIndexRef.current;
            if (!bounds || index === null) {
                return;
            }

            const nextPoint = {
                x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
                y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
            };

            setPoints((current) =>
                current.map((point, pointIndex) =>
                    pointIndex === index ? nextPoint : point,
                ),
            );
        }

        function handlePointerUp() {
            setDraggingPointIndex(null);
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);
        };
    }, [draggingPointIndex]);

    function applyShape(shape: ShapePreset) {
        setActiveShapeName(shape.name);
        setPoints(clonePoints(shape.points));
        setSelectedPointIndex(0);
    }

    function updateDemoSize(axis: "width" | "height", value: string) {
        const parsedValue = Number(value);
        const safeValue = Number.isFinite(parsedValue)
            ? clamp(Math.round(parsedValue), 100, 640)
            : 280;

        if (axis === "width") {
            setDemoWidth(safeValue);
            return;
        }

        setDemoHeight(safeValue);
    }

    function beginDrag(index: number, event: React.PointerEvent<HTMLButtonElement>) {
        event.preventDefault();
        setSelectedPointIndex(index);
        setDraggingPointIndex(index);
    }

    function addPointAt(event: React.MouseEvent<HTMLDivElement>) {
        if (event.detail < 2) {
            return;
        }

        const bounds = clipboardRef.current?.getBoundingClientRect();
        if (!bounds) {
            return;
        }

        const point = {
            x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
            y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100),
        };
        const nextIndex = Math.min(selectedPointIndex + 1, pointsRef.current.length);
        setPoints((current) => insertPointAfter(current, selectedPointIndex, point));
        setActiveShapeName("Custom Polygon");
        setSelectedPointIndex(nextIndex);
    }

    function removeSelectedPoint() {
        if (points.length <= 3) {
            return;
        }

        setPoints((current) =>
            current.filter((_, pointIndex) => pointIndex !== selectedPointIndex),
        );
        setActiveShapeName("Custom Polygon");
        setSelectedPointIndex((current) => Math.max(0, current - 1));
    }

    function applyCustomBackground(value = customBackgroundUrl) {
        const trimmedUrl = getUsableImageUrl(value);
        if (trimmedUrl.length > 0) {
            setBackgroundUrl(trimmedUrl);
        }
    }

    function updateCustomBackgroundUrl(value: string) {
        setCustomBackgroundUrl(value);
        applyCustomBackground(value);
    }

    function pasteCustomBackgroundUrl(event: ClipboardEvent<HTMLInputElement>) {
        const pastedUrl = event.clipboardData.getData("text");
        if (getUsableImageUrl(pastedUrl)) {
            setCustomBackgroundUrl(pastedUrl.trim());
            setBackgroundUrl(pastedUrl.trim());
        }
    }

    async function copyCssCode() {
        try {
            await navigator.clipboard.writeText(cssCode);
        } catch {
            const textarea = document.createElement("textarea");
            textarea.value = cssCode;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }

        setCopied(true);
    }

    return (
        <section className="clippy-tool min-h-[100dvh] bg-[#d3d0c9] text-[#100a09]">
            <style>
                {`
                    @import url("https://fonts.googleapis.com/css?family=Alegreya+Sans:300,300i,400,400i");

                    .clippy-tool {
                        font: 100%/1.5 "Alegreya Sans", sans-serif;
                    }

                    body:has(.clippy-tool) nextjs-portal {
                        display: none !important;
                    }

                    .clippy-tool * {
                        box-sizing: border-box;
                        line-height: 1;
                    }

                    .clippy-shell {
                        min-height: 100dvh;
                    }

                    .clippy-main {
                        display: flex;
                        min-height: 100dvh;
                        flex-direction: column;
                    }

                    .clippy-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 1rem;
                        background: rgba(251, 252, 247, 0.75);
                        box-shadow: inset 0 -1px rgba(211, 208, 201, 0.25);
                        padding: 0.75rem 1rem;
                    }

                    .clippy-brand {
                        display: flex;
                        min-width: 0;
                        flex-direction: column;
                        gap: 0.2rem;
                    }

                    .clippy-brand-kicker {
                        color: #6f6761;
                        font-family: Arial, sans-serif;
                        font-size: 0.68rem;
                        font-weight: 700;
                        letter-spacing: 0.12em;
                        line-height: 1.2 !important;
                        text-transform: uppercase;
                    }

                    .clippy-title {
                        display: inline-block;
                        color: inherit;
                        font-size: 1rem;
                        line-height: 1.5 !important;
                        text-decoration: none;
                    }

                    .clippy-title:hover {
                        text-decoration: underline;
                    }

                    .clippy-header-actions {
                        display: flex;
                        flex-shrink: 0;
                        align-items: center;
                        gap: 0.5rem;
                    }

                    .clippy-brand-pill {
                        display: inline-flex;
                        align-items: center;
                        border: 1px solid rgba(16, 10, 9, 0.14);
                        border-radius: 999px;
                        background: #fbfcf7;
                        color: #100a09;
                        padding: 0.25rem 0.65rem;
                        font-family: Arial, sans-serif;
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 0.04em;
                        line-height: 1.2 !important;
                        text-transform: uppercase;
                    }

                    .clippy-post {
                        border-radius: 999px;
                        background: #000;
                        color: #fff;
                        padding: 0.25rem 0.75rem;
                        font-family: Arial, sans-serif;
                        font-size: 12px;
                        font-weight: 700;
                    }

                    .clippy-identity-strip {
                        display: grid;
                        gap: 0.35rem;
                        background: rgba(251, 252, 247, 0.56);
                        box-shadow: inset 0 -1px rgba(16, 10, 9, 0.08);
                        padding: 0.75rem 1rem;
                    }

                    .clippy-identity-label {
                        color: #100a09;
                        font-family: Arial, sans-serif;
                        font-size: 0.72rem;
                        font-weight: 700;
                        letter-spacing: 0.08em;
                        line-height: 1.2 !important;
                        text-transform: uppercase;
                    }

                    .clippy-identity-copy {
                        max-width: 48rem;
                        color: #5e5652;
                        font-size: 0.95rem;
                        line-height: 1.35 !important;
                    }

                    .clippy-demo-container {
                        display: flex;
                        flex: 1;
                        align-items: center;
                        justify-content: center;
                        background: #fbfcf7;
                        box-shadow: 0 1px 2px rgba(16, 10, 9, 0.15);
                        padding: 0.5rem;
                        user-select: none;
                    }

                    .clippy-demo {
                        position: relative;
                        padding-bottom: 1rem;
                    }

                    .clippy-box {
                        position: relative;
                        box-shadow:
                            inset 0 0 0 10px #fbfcf7,
                            inset 0 0 0 11px #d3d0c9;
                        touch-action: none;
                    }

                    .clippy-shadowboard,
                    .clippy-clipboard {
                        position: absolute;
                        inset: 10px;
                        background-color: #d3d0c9;
                        background-position: center center;
                        background-size: cover;
                    }

                    .clippy-shadowboard {
                        pointer-events: none;
                        opacity: 0;
                        transition: opacity 0.375s ease;
                    }

                    .clippy-shadowboard[data-visible="true"] {
                        opacity: 0.25;
                    }

                    .clippy-handles {
                        position: absolute;
                        inset: 0;
                    }

                    .clippy-handle {
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 0;
                        background: transparent;
                        box-shadow: inset 0 0 0 10px currentColor;
                        cursor: grab;
                        opacity: 0.8;
                        padding: 0;
                        transition:
                            opacity 0.25s ease,
                            box-shadow 0.2s ease,
                            transform 0.2s ease;
                    }

                    .clippy-demo:hover .clippy-handle,
                    .clippy-handle[data-selected="true"] {
                        opacity: 1;
                    }

                    .clippy-handle[data-selected="true"] {
                        box-shadow: inset 0 0 0 10px currentColor;
                    }

                    .clippy-handle:after {
                        position: absolute;
                        inset: -8px;
                        content: "";
                    }

                    .clippy-delete-point {
                        position: absolute;
                        left: 22px;
                        top: 0;
                        width: 25px;
                        height: 20px;
                        border: 0;
                        border-radius: 3px;
                        background: #d3d0c9;
                        cursor: pointer;
                        clip-path: polygon(25% 0%, 100% 1%, 100% 100%, 25% 100%, 0% 50%);
                        opacity: 0;
                        transform: scale3d(0, 0, 0);
                        transform-origin: left center;
                        transition:
                            transform 0.25s cubic-bezier(0.15, 1, 0.3, 1.1),
                            opacity 0.25s ease;
                    }

                    .clippy-handle-wrap:hover .clippy-delete-point {
                        opacity: 1;
                        transform: scale3d(0.9, 0.9, 0.9);
                    }

                    .clippy-delete-point:after {
                        position: absolute;
                        inset: 4px 4px 4px 9px;
                        display: block;
                        content: "";
                        background: #100a09;
                        clip-path: polygon(20% 10%, 10% 20%, 40% 50%, 10% 80%, 20% 90%, 50% 60%, 80% 90%, 90% 80%, 60% 50%, 90% 20%, 80% 10%, 50% 40%);
                    }

                    .clippy-custom-notice {
                        position: absolute;
                        inset: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(16, 10, 9, 0.55);
                        font-size: 0.95rem;
                        pointer-events: none;
                        text-align: center;
                        opacity: 0;
                    }

                    .clippy-demo:hover .clippy-custom-notice {
                        opacity: 1;
                    }

                    .clippy-shapes {
                        position: relative;
                        max-width: 100%;
                        overflow-x: hidden;
                        background: #d3d0c9;
                        white-space: nowrap;
                    }

                    .clippy-shapes:after {
                        position: absolute;
                        top: 0;
                        right: 0;
                        bottom: 0;
                        display: block;
                        width: 1.5rem;
                        content: "";
                        pointer-events: none;
                        background: linear-gradient(90deg, rgba(211, 208, 201, 0), #d3d0c9);
                    }

                    .clippy-shape-list {
                        width: 100%;
                        padding: 0.25rem;
                        white-space: nowrap;
                    }

                    .clippy-gallery-cell {
                        display: inline-block;
                        width: 4.125rem;
                        margin: 0.25rem;
                        border: 0;
                        border-radius: 2px;
                        background: #fff;
                        box-shadow: 0 1px 2px rgba(16, 10, 9, 0.15);
                        color: var(--shape-color);
                        cursor: pointer;
                        padding: 0.625rem 0.25rem;
                        text-align: center;
                        transition:
                            background 0.25s ease,
                            transform 0.5s ease,
                            opacity 0.2s ease;
                        user-select: none;
                    }

                    .clippy-gallery-cell:hover {
                        opacity: 0.86;
                    }

                    .clippy-gallery-cell[data-active="true"] {
                        background: #100a09;
                    }

                    .clippy-shape-mark {
                        display: block;
                        width: 24px;
                        height: 24px;
                        margin: 0 auto 0.45rem;
                        background: currentColor;
                    }

                    .clippy-shape-name {
                        display: block;
                        overflow: hidden;
                        color: #5e5652;
                        font-size: 0.75rem;
                        text-overflow: ellipsis;
                    }

                    .clippy-gallery-cell[data-active="true"] .clippy-shape-name {
                        color: #fff;
                    }

                    .clippy-code {
                        display: flex;
                        overflow: hidden;
                        font-family: monospace;
                        font-size: 1.1em;
                    }

                    .clippy-code-content {
                        flex: 1;
                        overflow: auto;
                        border: 0;
                        border-radius: 0;
                        background: #100a09;
                        box-shadow: 0 1px 2px rgba(16, 10, 9, 0.15);
                        color: #9a8297;
                        cursor: pointer;
                        padding: 0.75rem;
                        text-align: left;
                    }

                    .clippy-code-line {
                        display: block;
                        padding: 0.25rem;
                        line-height: 1.3;
                        white-space: normal;
                    }

                    .clippy-code-point {
                        display: inline-block;
                        position: relative;
                        line-height: 1.3;
                        vertical-align: baseline;
                    }

                    .clippy-code-point[data-copied="true"]:after {
                        position: absolute;
                        top: calc(50% - 40px);
                        left: calc(50% - 40px);
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: currentColor;
                        content: "";
                        opacity: 0;
                        animation: clippy-emph 1.25s ease;
                    }

                    @keyframes clippy-emph {
                        20% {
                            opacity: 0.5;
                            transform: scale(0.2);
                        }

                        to {
                            opacity: 0;
                            transform: scale(1.2);
                        }
                    }

                    .clippy-side {
                        background: #d3d0c9;
                    }

                    .clippy-options {
                        background: #d3d0c9;
                    }

                    .clippy-panel {
                        display: block;
                        margin: 0.5rem 0.25rem;
                        border-radius: 2px;
                        background: #fff;
                        box-shadow: 0 1px 2px rgba(16, 10, 9, 0.15);
                        padding: 1rem 1rem 1rem 0.5rem;
                    }

                    .clippy-panel:first-of-type {
                        margin-top: 0.25rem;
                    }

                    .clippy-sense-panel {
                        border-left: 3px solid #100a09;
                        padding-left: 0.85rem;
                    }

                    .clippy-sense-panel p {
                        line-height: 1.35 !important;
                    }

                    .clippy-sense-list {
                        display: grid;
                        gap: 0.4rem;
                        margin: 0.8rem 0 0;
                        padding: 0;
                        list-style: none;
                    }

                    .clippy-sense-list li {
                        display: flex;
                        align-items: baseline;
                        gap: 0.45rem;
                        color: #5e5652;
                        font-size: 0.92rem;
                        line-height: 1.3 !important;
                    }

                    .clippy-sense-list li:before {
                        width: 0.45rem;
                        height: 0.45rem;
                        flex: 0 0 auto;
                        border-radius: 50%;
                        background: #100a09;
                        content: "";
                        opacity: 0.72;
                    }

                    .clippy-flex {
                        display: flex;
                        align-items: center;
                    }

                    .clippy-panel-title {
                        display: inline-block;
                        min-width: 1em;
                        flex: 4rem auto;
                        color: #100a09;
                        font-size: 1.2rem !important;
                        font-weight: 300 !important;
                        line-height: 1 !important;
                        padding: 0 1.25rem 0 0.5rem;
                        pointer-events: none;
                        text-align: left;
                        user-select: none;
                    }

                    .clippy-panel-title.block {
                        display: block;
                    }

                    .clippy-muted-title {
                        flex: 0 0 auto;
                        color: #bcb8ad;
                        font-size: 1.2rem !important;
                        font-weight: 500 !important;
                        padding: 0 0.35rem;
                        pointer-events: none;
                    }

                    .clippy-input,
                    .clippy-toggle-label {
                        display: inline-block;
                        position: relative;
                        flex: 1;
                        min-width: 2rem;
                        border: 0;
                        border-radius: 2rem;
                        background: #fff;
                        box-shadow:
                            inset 0 0.125rem #d3d0c9,
                            inset -0.125rem 0 #d3d0c9,
                            inset 0 -0.125rem #d3d0c9;
                        color: #100a09;
                        cursor: pointer;
                        font: inherit;
                        line-height: 1 !important;
                        padding: 0.5rem 0.25rem;
                        text-align: center;
                        transition: background 0.25s ease;
                    }

                    .clippy-input:first-of-type {
                        box-shadow:
                            inset 0 0.125rem #d3d0c9,
                            inset 0.125rem 0 #d3d0c9,
                            inset -0.125rem 0 #d3d0c9,
                            inset 0 -0.125rem #d3d0c9;
                    }

                    .clippy-input:hover,
                    .clippy-toggle-label:hover {
                        background: #d3d0c9;
                    }

                    .clippy-input:focus {
                        z-index: 100;
                        outline: 0;
                        background: #100a09;
                        box-shadow:
                            inset 0 0 0 0.125rem #100a09,
                            0 0 0 0.125rem #100a09;
                        color: #d3d0c9;
                    }

                    .clippy-url {
                        width: calc(100% - 0.375rem);
                        margin-left: 0.375rem;
                        padding: 0.55rem 1rem;
                        text-align: left;
                    }

                    .clippy-backgrounds {
                        overflow: hidden;
                        padding: 0.5rem 0 0.75rem 0.375rem;
                        position: relative;
                    }

                    .clippy-backgrounds button {
                        float: left;
                        width: calc(25% - 0.25rem);
                        margin: 0.125rem;
                        border: 0;
                        background: transparent;
                        padding: 0;
                    }

                    .clippy-background-thumb {
                        display: block;
                        width: 100%;
                        height: auto;
                        border: 0;
                        border-radius: 0.25rem;
                        outline: 0.25rem solid #fff;
                        cursor: pointer;
                        transition: opacity 0.5s ease;
                    }

                    .clippy-background-thumb:hover {
                        opacity: 0.9;
                    }

                    .clippy-toggle-row {
                        margin-top: 1rem;
                    }

                    .clippy-toggle-label:before {
                        content: "Off";
                    }

                    .clippy-toggle-checkbox:checked + .clippy-toggle-label {
                        z-index: 100;
                        background: #100a09;
                        box-shadow:
                            inset 0 0 0 0.125rem #100a09,
                            0 0 0 0.125rem #100a09;
                        color: #d3d0c9;
                    }

                    .clippy-toggle-checkbox:checked + .clippy-toggle-label:before {
                        content: "On";
                    }

                    .clippy-panel p {
                        margin: 0.75rem 0 0;
                        font-size: 1rem;
                        line-height: 1.4;
                    }

                    .clippy-panel code {
                        font-family: monospace;
                        font-size: 1.1em;
                    }

                    .clippy-panel a {
                        color: #0b7fda;
                        text-decoration: underline;
                    }

                    .clippy-cite-spacer {
                        height: 1.75rem;
                    }

                    @media (max-width: 799px) {
                        .clippy-main {
                            min-height: auto;
                        }

                        .clippy-demo-container {
                            min-height: 324px;
                        }

                        .clippy-shapes-mobile {
                            display: block;
                            overflow-x: auto;
                        }

                        .clippy-shapes-desktop {
                            display: none;
                        }

                        .clippy-code-content {
                            min-height: 69px;
                            border-radius: 0;
                        }

                        .clippy-side {
                            display: block;
                            padding: 0.25rem;
                        }
                    }

                    @media (min-width: 800px) {
                        .clippy-shell {
                            display: grid;
                            grid-template-columns: minmax(0, 1fr) 23.625rem;
                            height: 100dvh;
                            overflow: hidden;
                        }

                        .clippy-main {
                            min-height: 0;
                            padding: 0.25rem 0.25rem 0.25rem 0.75rem;
                            touch-action: none;
                        }

                        .clippy-header {
                            margin-top: 0.5rem;
                            border-radius: 2px 2px 0 0;
                            font-size: larger;
                        }

                        .clippy-title {
                            font-size: 1.2rem;
                        }

                        .clippy-demo-container {
                            min-height: 0;
                            border-radius: 0 0 2px 2px;
                        }

                        .clippy-shapes-mobile {
                            display: none;
                        }

                        .clippy-side {
                            min-height: 100dvh;
                            overflow: hidden auto;
                            padding: 0.5rem 0.25rem 0;
                        }

                        .clippy-shapes-desktop {
                            display: block;
                            z-index: 2;
                            white-space: normal;
                            height: auto;
                            max-height: 12.75rem;
                            overflow: hidden;
                            transition:
                                max-height 0.4s cubic-bezier(0.15, 1, 0.3, 1.1),
                                overflow 0s linear 0.4s;
                        }

                        .clippy-shapes-desktop:hover,
                        .clippy-shapes-desktop:focus-within {
                            max-height: min(31.5rem, calc(100dvh - 10rem));
                            overflow-x: hidden;
                            overflow-y: auto;
                            transition:
                                max-height 0.4s cubic-bezier(0.15, 1, 0.3, 1.1),
                                overflow 0s;
                        }

                        .clippy-shapes-desktop:focus {
                            outline: 0;
                        }

                        .clippy-shapes-desktop:after {
                            display: none;
                        }

                        .clippy-shapes-desktop .clippy-shape-list {
                            display: flex;
                            flex-wrap: wrap;
                            overflow-x: hidden;
                            padding: 0;
                            perspective: 400px;
                            white-space: normal;
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell {
                            flex: 4.625rem;
                            transform-origin: top center;
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell:nth-child(n + 9) {
                            transform: translateZ(0) rotateX(-18deg);
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell:nth-child(n + 13) {
                            transform: translateZ(-1.85rem) rotateX(-36deg);
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell:nth-child(n + 17) {
                            transform: translateZ(-6.0125rem) rotateX(-54deg);
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell:nth-child(n + 21) {
                            transform: translateZ(-9.25rem) rotateX(-72deg);
                        }

                        .clippy-shapes-desktop .clippy-gallery-cell:nth-child(n + 25) {
                            transform: translateZ(-11.5625rem) rotateX(-85deg);
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell,
                        .clippy-shapes-desktop:focus .clippy-gallery-cell,
                        .clippy-shapes-desktop:focus-within .clippy-gallery-cell {
                            transform: translateZ(0) rotateX(0);
                            transition:
                                background 0.25s ease,
                                transform 0.375s cubic-bezier(0.15, 1, 0.3, 1.1),
                                opacity 0.2s ease;
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell:nth-child(n + 9),
                        .clippy-shapes-desktop:focus .clippy-gallery-cell:nth-child(n + 9),
                        .clippy-shapes-desktop:focus-within
                            .clippy-gallery-cell:nth-child(n + 9) {
                            transition-delay: 0.025s;
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell:nth-child(n + 13),
                        .clippy-shapes-desktop:focus .clippy-gallery-cell:nth-child(n + 13),
                        .clippy-shapes-desktop:focus-within
                            .clippy-gallery-cell:nth-child(n + 13) {
                            transition-delay: 0.05s;
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell:nth-child(n + 17),
                        .clippy-shapes-desktop:focus .clippy-gallery-cell:nth-child(n + 17),
                        .clippy-shapes-desktop:focus-within
                            .clippy-gallery-cell:nth-child(n + 17) {
                            transition-delay: 0.075s;
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell:nth-child(n + 21),
                        .clippy-shapes-desktop:focus .clippy-gallery-cell:nth-child(n + 21),
                        .clippy-shapes-desktop:focus-within
                            .clippy-gallery-cell:nth-child(n + 21) {
                            transition-delay: 0.1s;
                        }

                        .clippy-shapes-desktop:hover .clippy-gallery-cell:nth-child(n + 25),
                        .clippy-shapes-desktop:focus .clippy-gallery-cell:nth-child(n + 25),
                        .clippy-shapes-desktop:focus-within
                            .clippy-gallery-cell:nth-child(n + 25) {
                            transition-delay: 0.125s;
                        }

                        .clippy-code {
                            margin: 0.5rem 0 0.25rem;
                            border-radius: 2px;
                        }

                        .clippy-code-content {
                            max-height: 160px;
                            border-radius: 2px;
                        }

                        .clippy-options {
                            position: relative;
                            z-index: 1;
                            background: #d3d0c9;
                            transform: none;
                            transition: transform 0.25s 0.125s cubic-bezier(0.15, 1, 0.3, 1.1);
                        }

                        .clippy-options:before {
                            display: block;
                            position: absolute;
                            inset: auto 0 100% 0;
                            height: 4rem;
                            pointer-events: none;
                            background: linear-gradient(
                                rgba(211, 208, 201, 0),
                                #d3d0c9 90%
                            );
                            content: "";
                            transform-origin: center bottom;
                            transition: inherit;
                            transition-timing-function: ease;
                        }

                        .clippy-shapes-desktop:hover + .clippy-options:before,
                        .clippy-shapes-desktop:focus + .clippy-options:before,
                        .clippy-shapes-desktop:focus-within + .clippy-options:before,
                        .clippy-options:hover:before,
                        .clippy-options:focus-within:before {
                            transform: scale3d(1, 0, 1);
                        }
                    }
                `}
            </style>

            <div className="clippy-shell">
                <div className="clippy-main">
                    <header className="clippy-header">
                        <div className="clippy-brand">
                            <span className="clippy-brand-kicker">CodeSense AI Lab</span>
                            <a className="clippy-title" href="#clip-path-maker-workspace">
                                Clip Path Marker
                            </a>
                        </div>
                        <div className="clippy-header-actions">
                            <span className="clippy-brand-pill">CodeSense AI</span>
                            <a
                                className="clippy-post"
                                href={`https://twitter.com/share?text=${encodeURIComponent(
                                    "CodeSense AI Clip Path Marker",
                                )}`}
                                rel="noreferrer"
                                target="_blank"
                            >
                                X Post
                            </a>
                        </div>
                    </header>

                    <section
                        className="clippy-identity-strip"
                        aria-label="CodeSense AI tool context"
                    >
                        <span className="clippy-identity-label">
                            AI-assisted polygon workflow
                        </span>
                        <p className="clippy-identity-copy">
                            Tune CSS polygons for CodeSense AI lessons, generated UI
                            snippets, and visual experiments without leaving the maker.
                        </p>
                    </section>

                    <div
                        id="clip-path-maker-workspace"
                        className="clippy-demo-container"
                    >
                        <section className="clippy-demo" aria-label="Clip-path demo">
                            <div
                                className="clippy-box"
                                onDoubleClick={addPointAt}
                                style={{
                                    width: demoWidth + 20,
                                    height: demoHeight + 20,
                                }}
                            >
                                <div
                                    className="clippy-shadowboard"
                                    data-visible={showOutsideClip}
                                    style={{ backgroundImage: toCssImageUrl(backgroundUrl) }}
                                />
                                <div
                                    ref={clipboardRef}
                                    className="clippy-clipboard"
                                    style={{
                                        backgroundImage: toCssImageUrl(backgroundUrl),
                                        WebkitClipPath: clipPath,
                                        clipPath,
                                    }}
                                />
                                <div className="clippy-handles">
                                    {points.map((point, index) => {
                                        const color = getHandleColor(index);
                                        const isSelected = selectedPointIndex === index;

                                        return (
                                            <div
                                                key={`${index}-${point.x}-${point.y}`}
                                                className="clippy-handle-wrap"
                                                data-selected={isSelected}
                                                style={{
                                                    position: "absolute",
                                                    left:
                                                        10 +
                                                        (point.x / 100) * demoWidth -
                                                        10,
                                                    top:
                                                        10 +
                                                        (point.y / 100) * demoHeight -
                                                        10,
                                                }}
                                            >
                                                <button
                                                    aria-label={`Drag point ${index + 1}`}
                                                    className="clippy-handle"
                                                    data-selected={isSelected}
                                                    onPointerDown={(event) =>
                                                        beginDrag(index, event)
                                                    }
                                                    style={{ color }}
                                                    type="button"
                                                />
                                                <button
                                                    aria-label={`Delete point ${index + 1}`}
                                                    className="clippy-delete-point"
                                                    disabled={points.length <= 3}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setSelectedPointIndex(index);
                                                        removeSelectedPoint();
                                                    }}
                                                    type="button"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="clippy-custom-notice">
                                    <div>
                                        Double click to add points
                                        <br />
                                        to custom polygon.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <ShapeGallery
                        activeShapeName={activeShapeName}
                        className="clippy-shapes-mobile"
                        onApplyShape={applyShape}
                    />

                    <section className="clippy-code" tabIndex={-1}>
                        <button
                            aria-label={copied ? "Copied clip-path code" : "Copy clip-path code"}
                            className="clippy-code-content"
                            onClick={copyCssCode}
                            title={copied ? "Copied" : "Copy clip-path code"}
                            type="button"
                        >
                            <code className="clippy-code-line">
                                clip-path:{" "}
                                <span className="clippy-code-function">polygon(</span>
                                {points.map((point, index) => (
                                    <span key={`${index}-${point.x}-${point.y}`}>
                                        <span
                                            className="clippy-code-point"
                                            data-copied={copied}
                                            style={{ color: getHandleColor(index) }}
                                        >
                                            {formatPoint(point)}
                                        </span>
                                        {index < points.length - 1 ? ", " : ""}
                                    </span>
                                ))}
                                <span className="clippy-code-function">);</span>
                            </code>
                        </button>
                    </section>
                </div>

                <aside className="clippy-side">
                    <ShapeGallery
                        activeShapeName={activeShapeName}
                        className="clippy-shapes-desktop"
                        galleryTabIndex={0}
                        onApplyShape={applyShape}
                    />

                    <section className="clippy-options">
                        <div className="clippy-panel clippy-sense-panel">
                            <h2 className="clippy-panel-title block">
                                CodeSense AI workflow
                            </h2>
                            <p>
                                A compact marker for turning visual clip-path edits into
                                reusable CSS that fits CodeSense AI exercises.
                            </p>
                            <ul className="clippy-sense-list">
                                <li>Keep presets fast for lesson demos.</li>
                                <li>Copy production-ready polygon CSS in one click.</li>
                                <li>Use custom backgrounds to test generated UI ideas.</li>
                            </ul>
                        </div>

                        <div className="clippy-panel clippy-flex">
                            <h2 className="clippy-panel-title">Demo Size</h2>
                            <input
                                aria-label="Demo width"
                                className="clippy-input"
                                max={640}
                                min={100}
                                onChange={(event) =>
                                    updateDemoSize("width", event.target.value)
                                }
                                type="number"
                                value={demoWidth}
                            />
                            <h2 className="clippy-muted-title">x</h2>
                            <input
                                aria-label="Demo height"
                                className="clippy-input"
                                max={640}
                                min={100}
                                onChange={(event) =>
                                    updateDemoSize("height", event.target.value)
                                }
                                type="number"
                                value={demoHeight}
                            />
                        </div>

                        <div className="clippy-panel">
                            <h2 className="clippy-panel-title">Demo Background</h2>
                            <div className="clippy-backgrounds">
                                {DEMO_BACKGROUNDS.map((background) => (
                                    <button
                                        key={background.src}
                                        aria-label={`Use ${background.label}`}
                                        onClick={() => setBackgroundUrl(background.src)}
                                        type="button"
                                    >
                                        <img
                                            alt=""
                                            className="clippy-background-thumb"
                                            src={background.src}
                                        />
                                    </button>
                                ))}
                            </div>
                            <input
                                className="clippy-input clippy-url"
                                onBlur={() => applyCustomBackground()}
                                onChange={(event) =>
                                    updateCustomBackgroundUrl(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        applyCustomBackground();
                                    }
                                }}
                                onPaste={pasteCustomBackgroundUrl}
                                placeholder="Custom URL..."
                                type="url"
                                value={customBackgroundUrl}
                            />

                            <div className="clippy-flex clippy-toggle-row">
                                <h2 className="clippy-panel-title">
                                    Show outside clip-path
                                </h2>
                                <input
                                    checked={showOutsideClip}
                                    className="clippy-toggle-checkbox sr-only"
                                    id="clippy-shadowboard-toggle"
                                    onChange={(event) =>
                                        setShowOutsideClip(event.target.checked)
                                    }
                                    type="checkbox"
                                />
                                <label
                                    className="clippy-toggle-label"
                                    htmlFor="clippy-shadowboard-toggle"
                                />
                            </div>
                        </div>

                        <div className="clippy-panel">
                            <h2 className="clippy-panel-title block">
                                About Clip Paths
                            </h2>
                            <p>
                                The <code>clip-path</code> property allows you to make
                                complex shapes in CSS by clipping an element to a basic
                                shape (circle, ellipse, polygon, or inset), or to an SVG
                                source.
                            </p>
                            <p>
                                CSS Animations and transitions are possible with two or
                                more clip-path shapes with the same number of points.
                            </p>
                        </div>

                        <div className="clippy-panel">
                            <h2 className="clippy-panel-title block">
                                Browser Support
                            </h2>
                            <p>
                                Check out the current browser support for the{" "}
                                <code>clip-path</code> property on{" "}
                                <a
                                    href="https://caniuse.com/#search=clip-path"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Can I Use
                                </a>
                                .
                            </p>
                        </div>

                        <div className="clippy-panel">
                            <h2 className="clippy-panel-title block">
                                Brought to you by Bennett Feely
                            </h2>
                            <div className="clippy-cite-spacer" />
                            <p>
                                Find this project on{" "}
                                <a
                                    href="https://github.com/bennettfeely/Clippy"
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    Github
                                </a>
                                .
                            </p>
                            <p>
                                Want a list of the name of every polygon? Check out my
                                new site, Copy Paste List.
                            </p>
                        </div>
                    </section>
                </aside>
            </div>

            <p className="sr-only" aria-live="polite">
                {selectedPoint
                    ? `${activeShape.name}, selected point ${selectedPointIndex + 1}: ${formatPoint(selectedPoint)}`
                    : activeShape.name}
            </p>
        </section>
    );
}

function ShapeGallery({
    activeShapeName,
    className,
    galleryTabIndex = -1,
    onApplyShape,
}: {
    activeShapeName: string;
    className: string;
    galleryTabIndex?: number;
    onApplyShape: (shape: ShapePreset) => void;
}) {
    return (
        <section className={`clippy-shapes ${className}`} tabIndex={galleryTabIndex}>
            <div className="clippy-shape-list">
                {SHAPE_PRESETS.map((shape) => (
                    <button
                        key={shape.name}
                        className="clippy-gallery-cell"
                        data-active={shape.name === activeShapeName}
                        onClick={() => onApplyShape(shape)}
                        style={
                            {
                                "--shape-color": shape.color,
                            } as CSSProperties
                        }
                        type="button"
                    >
                        <span
                            className={`clippy-shape-mark clippy-shape-${normalizeShapeClassName(shape.name)}`}
                            style={{
                                WebkitClipPath: pointsToPolygon(shape.points),
                                clipPath: pointsToPolygon(shape.points),
                            }}
                        />
                        <span className="clippy-shape-name">{shape.name}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
