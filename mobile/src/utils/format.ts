export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}p`;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, "0") : "00"}p`;
}

export function formatStudyTime(minutes: number): string {
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}p` : `${hours} giờ`;
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
        BEGINNER: "Cơ bản",
        INTERMEDIATE: "Trung cấp",
        ADVANCED: "Nâng cao",
    };
    return labels[level] || level;
}

export function getLevelColor(level: string): string {
    const levelColors: Record<string, string> = {
        BEGINNER: "#22c55e",
        INTERMEDIATE: "#f59e0b",
        ADVANCED: "#ef4444",
    };
    return levelColors[level] || "#6366f1";
}
