import assert from "node:assert/strict";
import test from "node:test";

import {
    normalizeAuthResponse,
    normalizeChaptersResponse,
    normalizeCreateAnswerResponse,
    normalizeQuestionDetailResponse,
} from "./responseNormalizers";

const user = {
    id: "user-1",
    email: "student@example.com",
    username: "student",
    full_name: "Student",
    avatar_url: null,
    bio: null,
    phone: null,
    membership_type: "FREE",
    learning_streak: 0,
    total_study_time: 0,
    is_verified: false,
    created_at: "2026-04-26T00:00:00.000Z",
};

test("normalizeAuthResponse returns a string token for mobile storage", () => {
    const session = normalizeAuthResponse({
        success: true,
        message: "ok",
        data: {
            user,
            token: "jwt-token",
        },
    } as any);

    assert.equal(session.token, "jwt-token");
    assert.equal(session.user.id, "user-1");
});

test("normalizeAuthResponse rejects cookie-only auth responses before SecureStore writes", () => {
    assert.throws(
        () =>
            normalizeAuthResponse({
                success: true,
                message: "ok",
                data: { user },
            } as any),
        /mobile auth token/i,
    );
});

test("normalizeChaptersResponse maps backend camelCase lesson fields to mobile-safe fields", () => {
    const chapters = normalizeChaptersResponse({
        chapters: [
            {
                id: "chapter-1",
                title: "Intro",
                order: 2,
                lessons: [
                    {
                        id: "lesson-1",
                        title: "Video",
                        duration: "4:20",
                        videoUrl: "https://cdn.example.com/video.mp4",
                        youtubeBackupUrl: "https://youtu.be/fallback",
                        isPreview: true,
                        order: 1,
                    },
                ],
            },
        ],
    });

    assert.equal(chapters[0].order_index, 2);
    assert.equal(chapters[0].lessons[0].video_url, "https://cdn.example.com/video.mp4");
    assert.equal(chapters[0].lessons[0].youtube_backup_url, "https://youtu.be/fallback");
    assert.equal(chapters[0].lessons[0].is_preview, true);
});

test("normalizeQuestionDetailResponse reads answers nested under question", () => {
    const answer = {
        id: "answer-1",
        content: "Use a token",
        likesCount: 0,
        isAccepted: false,
        createdAt: "2026-04-26T00:00:00.000Z",
        user: {
            id: "user-2",
            fullName: "Helper",
            avatarUrl: null,
        },
    };

    const detail = normalizeQuestionDetailResponse({
        question: {
            id: "question-1",
            title: "Why login fails?",
            content: "SecureStore rejects undefined",
            answers: [answer],
        },
    } as any);

    assert.equal(detail.question.id, "question-1");
    assert.deepEqual(detail.answers, [answer]);
});

test("normalizeCreateAnswerResponse unwraps backend data.answer", () => {
    const answer = {
        id: "answer-1",
        content: "Done",
        likesCount: 0,
        isAccepted: false,
        createdAt: "2026-04-26T00:00:00.000Z",
        user: {
            id: "user-2",
            fullName: "Helper",
            avatarUrl: null,
        },
    };

    assert.deepEqual(normalizeCreateAnswerResponse({ answer } as any), answer);
});
