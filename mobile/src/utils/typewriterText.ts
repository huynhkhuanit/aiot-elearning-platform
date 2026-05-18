export function getNextTypewriterText(
    current: string,
    target: string,
    step: number = 3,
): string {
    if (!target) return "";
    if (step <= 0) return current;

    if (!target.startsWith(current)) {
        return target.slice(0, Math.min(step, target.length));
    }

    if (current.length >= target.length) return target;

    return target.slice(0, Math.min(current.length + step, target.length));
}

