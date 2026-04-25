import { z } from "zod";
import type { LearningGoalInput, LearningSkillLevel } from "./types";

const skillLevels = ["beginner", "intermediate", "advanced"] as const;

const learningGoalSchema = z.object({
    targetRole: z.string().trim().min(2, "targetRole is required").max(120),
    skillLevel: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(z.enum(skillLevels)),
    focusAreas: z.array(z.string()).default([]),
    hoursPerWeek: z.coerce.number().int().min(1).max(60),
    timelineMonths: z.coerce.number().int().min(1).max(24),
    currentSkills: z.array(z.string()).default([]),
    preferredLanguage: z.enum(["vi", "en"]).default("vi"),
});

function uniqueCleanList(values: string[]): string[] {
    const seen = new Set<string>();
    const cleaned: string[] = [];

    for (const value of values) {
        const item = value.trim();
        const key = item.toLowerCase();
        if (!item || seen.has(key)) continue;
        seen.add(key);
        cleaned.push(item);
    }

    return cleaned.slice(0, 12);
}

export function parseLearningGoalInput(input: unknown): LearningGoalInput {
    const parsed = learningGoalSchema.parse(input);

    return {
        targetRole: parsed.targetRole,
        skillLevel: parsed.skillLevel as LearningSkillLevel,
        focusAreas: uniqueCleanList(parsed.focusAreas),
        hoursPerWeek: parsed.hoursPerWeek,
        timelineMonths: parsed.timelineMonths,
        currentSkills: uniqueCleanList(parsed.currentSkills),
        preferredLanguage: parsed.preferredLanguage,
    };
}
