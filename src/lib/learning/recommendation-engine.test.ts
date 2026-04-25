import test from "node:test";
import assert from "node:assert/strict";
import {
    buildLearningRecommendations,
    computeLearningInsights,
} from "./recommendation-engine";
import type { LearningGoal, LearningSignal } from "./types";

const goal: LearningGoal = {
    id: "goal-1",
    userId: "user-1",
    targetRole: "Frontend Developer",
    skillLevel: "beginner",
    focusAreas: ["React", "TypeScript"],
    currentSkills: ["HTML", "CSS"],
    hoursPerWeek: 8,
    timelineMonths: 4,
    preferredLanguage: "vi",
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
};

const signals: LearningSignal = {
    courses: [
        {
            id: "react",
            slug: "react-fundamentals",
            title: "React Fundamentals",
            level: "BEGINNER",
            category: "Frontend",
            shortDescription: "Build UI with React and TypeScript.",
            tags: ["React", "TypeScript", "Frontend"],
            isFree: true,
            totalLessons: 10,
            completedLessons: 3,
            progressPercentage: 30,
            enrolledAt: "2026-04-20T00:00:00.000Z",
        },
        {
            id: "ml",
            slug: "machine-learning",
            title: "Machine Learning",
            level: "ADVANCED",
            category: "AI",
            shortDescription: "Model training and evaluation.",
            tags: ["Python", "ML"],
            isFree: false,
            totalLessons: 8,
            completedLessons: 0,
            progressPercentage: 0,
        },
    ],
    roadmaps: [
        {
            id: "roadmap-1",
            title: "Frontend Career Path",
            description: "React and TypeScript path",
            progressPercentage: 45,
            updatedAt: "2026-04-24T00:00:00.000Z",
        },
    ],
    gamification: {
        xp: 320,
        streak: 4,
        completedLessonsThisWeek: 2,
        studyMinutesThisWeek: 180,
    },
};

test("buildLearningRecommendations ranks goal-matched in-progress courses before unrelated courses", () => {
    const recommendations = buildLearningRecommendations(goal, signals, 5);

    assert.equal(recommendations[0].targetId, "react");
    assert.equal(recommendations[0].targetType, "course");
    assert.equal(recommendations[0].status, "active");
    assert.match(recommendations[0].reason, /React|Frontend|TypeScript/);
    assert.ok(recommendations[0].score > recommendations.at(-1)!.score);
});

test("buildLearningRecommendations includes roadmap follow-up and respects limit", () => {
    const recommendations = buildLearningRecommendations(goal, signals, 2);

    assert.equal(recommendations.length, 2);
    assert.ok(
        recommendations.some((recommendation) =>
            recommendation.source.includes("roadmap"),
        ),
    );
});

test("computeLearningInsights summarizes weekly progress and next action", () => {
    const recommendations = buildLearningRecommendations(goal, signals, 5);
    const insights = computeLearningInsights(goal, signals, recommendations);

    assert.equal(insights.weeklyCompletedLessons, 2);
    assert.equal(insights.streak, 4);
    assert.equal(insights.targetPaceHoursPerWeek, 8);
    assert.equal(insights.nextRecommendation?.targetId, "react");
    assert.ok(insights.weeklyStudyHours >= 3);
});
