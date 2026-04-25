import test from "node:test";
import assert from "node:assert/strict";
import {
    buildTutorMemorySummary,
    buildTutorSuggestedNextActions,
} from "./tutor-memory";

test("buildTutorMemorySummary preserves previous memory and captures the latest learner question", () => {
    const summary = buildTutorMemorySummary({
        previousSummary: "Learner is reviewing React props.",
        learningContext: {
            courseTitle: "React Fundamentals",
            currentLessonTitle: "State and Events",
            progress: 35,
            recentCompletedTopics: ["Components", "Props"],
        },
        messages: [
            { role: "user", content: "Em hay bị lỗi khi dùng useState." },
            { role: "assistant", content: "Hãy kiểm tra cách gọi setter." },
        ],
    });

    assert.match(summary, /React Fundamentals/);
    assert.match(summary, /State and Events/);
    assert.match(summary, /useState/);
    assert.match(summary, /React props/);
    assert.ok(summary.length <= 1200);
});

test("buildTutorSuggestedNextActions returns contextual actions for a lesson", () => {
    const actions = buildTutorSuggestedNextActions({
        courseTitle: "React Fundamentals",
        currentLessonTitle: "State and Events",
        progress: 35,
        recentCompletedTopics: ["Components", "Props"],
    });

    assert.ok(actions.length >= 3);
    assert.ok(actions[0].includes("State and Events"));
    assert.ok(actions.some((action) => action.includes("Props")));
});
