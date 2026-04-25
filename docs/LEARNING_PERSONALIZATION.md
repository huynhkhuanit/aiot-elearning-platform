# Learning Personalization Implementation

This document records the deployable slice of the 4-6 week optimization roadmap.

## Shipped Scope

- Build hardening: `pnpm typecheck`, `pnpm test:web`, `pnpm test:ai`, and build checks no longer suppress TypeScript or ESLint failures.
- Learning goals: `GET /api/learning/goals/me`, `PUT /api/learning/goals/me`.
- Learning recommendations: `GET /api/learning/recommendations`, `POST /api/learning/recommendations/refresh`.
- Learning insights: `GET /api/learning/insights`.
- AI Tutor memory: `/api/ai/tutor` accepts optional `sessionId` and includes `sessionId` plus `suggestedNextActions` in SSE payloads.
- Student dashboard: `/learning` displays goal setup, weekly insights, and recommendations.
- Schema: `supabase/migrations/202604250001_learning_personalization.sql`.

## Design Notes

The v1 recommendation engine is deterministic. It scores course and roadmap candidates from goal text, focus areas, skill level, enrollment progress, roadmap progress, and gamification signals. This keeps demos stable and explainable while leaving room for ML/KNN or LLM-assisted ranking later.

AI Tutor memory stores compact per-session summaries instead of raw full chat transcripts. The summary captures course, lesson, progress, recent topics, and the latest learner question.

## Verification

```bash
pnpm typecheck
pnpm test:web
pnpm test:ai
pnpm build
```

The API integration script now writes JSON to `coverage/api-test-results.json` by default. Override with:

```bash
API_TEST_RESULTS_PATH=path/to/results.json node scripts/test-api.mjs
```
