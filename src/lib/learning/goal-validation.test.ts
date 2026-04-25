import test from "node:test";
import assert from "node:assert/strict";
import { parseLearningGoalInput } from "./goal-validation";

test("parseLearningGoalInput normalizes a valid learning goal", () => {
    const parsed = parseLearningGoalInput({
        targetRole: " Frontend Developer ",
        skillLevel: "BEGINNER",
        focusAreas: ["React", " ", "TypeScript", "React"],
        hoursPerWeek: "12",
        timelineMonths: "6",
        currentSkills: ["HTML", "", "CSS"],
        preferredLanguage: "vi",
    });

    assert.deepEqual(parsed, {
        targetRole: "Frontend Developer",
        skillLevel: "beginner",
        focusAreas: ["React", "TypeScript"],
        hoursPerWeek: 12,
        timelineMonths: 6,
        currentSkills: ["HTML", "CSS"],
        preferredLanguage: "vi",
    });
});

test("parseLearningGoalInput rejects missing target role and unsafe ranges", () => {
    assert.throws(
        () =>
            parseLearningGoalInput({
                targetRole: "",
                skillLevel: "beginner",
                focusAreas: [],
                hoursPerWeek: 0,
                timelineMonths: 40,
            }),
        /targetRole/,
    );
});
