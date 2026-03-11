export type Point = {
    x: number;
    y: number;
};

export function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export function roundToTenth(value: number) {
    return Math.round(value * 10) / 10;
}

export function clonePoints(points: Point[]) {
    return points.map((point) => ({ ...point }));
}

export function normalizePoint(point: Point): Point {
    return {
        x: roundToTenth(clamp(point.x, 0, 100)),
        y: roundToTenth(clamp(point.y, 0, 100)),
    };
}

export function normalizePoints(points: Point[]) {
    return points.map(normalizePoint);
}

export function snapValue(value: number, step: number) {
    return Math.round(value / step) * step;
}

export function snapPoint(point: Point, step: number) {
    return normalizePoint({
        x: snapValue(point.x, step),
        y: snapValue(point.y, step),
    });
}

export function formatPercent(value: number) {
    const rounded = roundToTenth(value);
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function formatPoint(point: Point) {
    return `${formatPercent(point.x)}% ${formatPercent(point.y)}%`;
}

export function pointsToPolygon(points: Point[]) {
    return `polygon(${points
        .map((point) => `${formatPercent(point.x)}% ${formatPercent(point.y)}%`)
        .join(", ")})`;
}

export function pointsToSvgPath(points: Point[]) {
    if (points.length === 0) {
        return "";
    }

    const commands = points.map((point, index) => {
        const prefix = index === 0 ? "M" : "L";
        return `${prefix} ${formatPercent(point.x)} ${formatPercent(point.y)}`;
    });

    return `${commands.join(" ")} Z`;
}

export function toTailwindClipPathValue(clipPath: string) {
    return clipPath.replace(/ /g, "_").replace(/,/g, ",_");
}

export function sanitizeClassName(value: string) {
    const normalized = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized || "clip-shape";
}

export function pointsEqual(left: Point[], right: Point[]) {
    if (left.length !== right.length) {
        return false;
    }

    return left.every(
        (point, index) =>
            point.x === right[index]?.x && point.y === right[index]?.y,
    );
}

export function insertPointAfter(points: Point[], index: number) {
    if (points.length === 0) {
        return points;
    }

    const current = points[index];
    const next = points[(index + 1) % points.length];
    const midpoint = normalizePoint({
        x: (current.x + next.x) / 2,
        y: (current.y + next.y) / 2,
    });

    return [
        ...points.slice(0, index + 1),
        midpoint,
        ...points.slice(index + 1),
    ];
}

export function removePointAt(points: Point[], index: number) {
    if (points.length <= 3) {
        return points;
    }

    return points.filter((_, pointIndex) => pointIndex !== index);
}

export function scalePoints(points: Point[], scaleX: number, scaleY: number) {
    return normalizePoints(
        points.map((point) => ({
            x: 50 + (point.x - 50) * scaleX,
            y: 50 + (point.y - 50) * scaleY,
        })),
    );
}

export function randomizePoints(points: Point[], intensity: number) {
    return normalizePoints(
        points.map((point) => ({
            x: point.x + (Math.random() * 2 - 1) * intensity,
            y: point.y + (Math.random() * 2 - 1) * intensity,
        })),
    );
}

export function getSymmetryPairs(points: Point[]) {
    const pairs = Array.from({ length: points.length }, () => -1);
    const visited = new Set<number>();

    for (let index = 0; index < points.length; index += 1) {
        if (visited.has(index)) {
            continue;
        }

        let bestIndex = -1;
        let bestScore = Number.POSITIVE_INFINITY;

        for (let candidate = index + 1; candidate < points.length; candidate += 1) {
            if (visited.has(candidate)) {
                continue;
            }

            const score =
                Math.abs(points[index].x + points[candidate].x - 100) +
                Math.abs(points[index].y - points[candidate].y) * 1.4;

            if (score < bestScore) {
                bestScore = score;
                bestIndex = candidate;
            }
        }

        if (bestIndex !== -1 && bestScore <= 40) {
            pairs[index] = bestIndex;
            pairs[bestIndex] = index;
            visited.add(index);
            visited.add(bestIndex);
        }
    }

    return pairs;
}

export function makeSymmetric(points: Point[]) {
    const pairs = getSymmetryPairs(points);
    const next = clonePoints(points);
    const visited = new Set<number>();

    for (let index = 0; index < points.length; index += 1) {
        if (visited.has(index)) {
            continue;
        }

        const pair = pairs[index];

        if (pair === -1) {
            if (Math.abs(points[index].x - 50) <= 10) {
                next[index] = normalizePoint({ x: 50, y: points[index].y });
            }
            continue;
        }

        const leftIndex = points[index].x <= points[pair].x ? index : pair;
        const rightIndex = leftIndex === index ? pair : index;
        const leftAnchor = points[leftIndex];
        const rightAnchor = points[rightIndex];
        const symmetricLeftX = clamp(
            (leftAnchor.x + (100 - rightAnchor.x)) / 2,
            0,
            50,
        );
        const symmetricY = clamp((leftAnchor.y + rightAnchor.y) / 2, 0, 100);

        next[leftIndex] = normalizePoint({ x: symmetricLeftX, y: symmetricY });
        next[rightIndex] = normalizePoint({
            x: 100 - symmetricLeftX,
            y: symmetricY,
        });

        visited.add(index);
        visited.add(pair);
    }

    return next;
}

export function updatePointAt(
    points: Point[],
    index: number,
    nextPoint: Point,
    pairs?: number[],
) {
    const next = clonePoints(points);
    const normalized = normalizePoint(nextPoint);
    next[index] = normalized;

    const pair = pairs?.[index];
    if (
        typeof pair === "number" &&
        pair >= 0 &&
        pair < next.length &&
        pair !== index
    ) {
        next[pair] = normalizePoint({
            x: 100 - normalized.x,
            y: normalized.y,
        });
    }

    return next;
}
