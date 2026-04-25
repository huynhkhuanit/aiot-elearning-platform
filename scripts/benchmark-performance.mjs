/**
 * Performance Benchmark Script - AIoT Learning Platform
 * Đo lường thời gian phản hồi API endpoints
 * Chạy: node scripts/benchmark-performance.mjs
 */
const BASE = "http://localhost:3000";
let authCookie = "";
let csrfCookie = "";
let csrfToken = "";

const TS = Date.now();
const TEST_EMAIL = `perftest_${TS}@test.com`;
const TEST_PASS = "PerfTest123";
const TEST_USER = `perftest_${TS}`;

async function req(method, path, body, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const cookieHeader = [authCookie, csrfCookie].filter(Boolean).join("; ");
  if (cookieHeader) headers["Cookie"] = cookieHeader;
  if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  const init = { method, headers, redirect: "manual" };
  if (body && method !== "GET") {
    init.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url, init);
    const elapsed = performance.now() - start;
    const ct = res.headers.get("content-type") || "";
    let data = null;
    let bodySize = 0;
    if (ct.includes("json")) {
      const text = await res.text();
      bodySize = new TextEncoder().encode(text).length;
      data = JSON.parse(text);
    } else if (ct.includes("text/event-stream")) {
      data = { stream: true };
    } else {
      const text = await res.text();
      bodySize = new TextEncoder().encode(text).length;
      data = text;
    }
    const cookies = res.headers.getSetCookie?.() || [];
    for (const c of cookies) {
      if (c.startsWith("auth_token=")) authCookie = c.split(";")[0];
      if (c.startsWith("csrf_token=")) {
        csrfCookie = c.split(";")[0];
        csrfToken = decodeURIComponent(csrfCookie.split("=")[1] || "");
      }
    }
    return { status: res.status, data, ok: res.ok, elapsed, bodySize };
  } catch (e) {
    const elapsed = performance.now() - start;
    return { status: 0, data: { error: e.message }, ok: false, elapsed, bodySize: 0 };
  }
}

async function measure(label, method, path, body, runs = 3) {
  const times = [];
  let lastStatus = 0;
  let lastSize = 0;
  for (let i = 0; i < runs; i++) {
    const r = await req(method, path, body);
    times.push(r.elapsed);
    lastStatus = r.status;
    lastSize = r.bodySize;
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  return { label, method, path, status: lastStatus, runs, avg, min, max, bodySize: lastSize };
}

async function main() {
  console.log("=".repeat(60));
  console.log("  PERFORMANCE BENCHMARK - AIoT Learning Platform");
  console.log("  Thời gian:", new Date().toLocaleString("vi-VN"));
  console.log("=".repeat(60));

  const results = [];

  // 1. Register + Login
  console.log("\n▶ Setup: Register & Login...");
  await req("POST", "/api/auth/register", {
    email: TEST_EMAIL, password: TEST_PASS, username: TEST_USER, full_name: "Perf Test"
  });
  await req("POST", "/api/auth/login", { email: TEST_EMAIL, password: TEST_PASS });
  await req("GET", "/api/auth/csrf");

  // 2. Auth APIs
  console.log("\n▶ Đo Auth APIs...");
  results.push(await measure("POST /api/auth/login", "POST", "/api/auth/login", { email: TEST_EMAIL, password: TEST_PASS }));
  results.push(await measure("GET /api/auth/me", "GET", "/api/auth/me"));
  results.push(await measure("GET /api/auth/csrf", "GET", "/api/auth/csrf"));

  // 3. Course APIs
  console.log("\n▶ Đo Course APIs...");
  results.push(await measure("GET /api/courses", "GET", "/api/courses"));
  results.push(await measure("GET /api/courses?level=BEGINNER", "GET", "/api/courses?level=BEGINNER"));
  results.push(await measure("GET /api/courses?search=javascript", "GET", "/api/courses?search=javascript"));
  results.push(await measure("GET /api/courses?page=1&limit=2", "GET", "/api/courses?page=1&limit=2"));
  results.push(await measure("GET /api/courses/:slug", "GET", "/api/courses/lap-trinh-javascript-nang-cao"));

  // 4. Progress
  console.log("\n▶ Đo Progress APIs...");
  results.push(await measure("GET /api/courses/:slug/progress", "GET", "/api/courses/html-css-co-ban-den-nang-cao/progress"));

  // 5. Learning Personalization
  console.log("\n▶ Đo Learning APIs...");
  results.push(await measure("PUT /api/learning/goals/me", "PUT", "/api/learning/goals/me", {
    targetRole: "Frontend Developer", skillLevel: "beginner", focusAreas: ["React"], currentSkills: ["HTML"], hoursPerWeek: 8, timelineMonths: 4, preferredLanguage: "vi"
  }));
  results.push(await measure("GET /api/learning/goals/me", "GET", "/api/learning/goals/me"));
  results.push(await measure("GET /api/learning/recommendations", "GET", "/api/learning/recommendations?limit=5"));
  results.push(await measure("GET /api/learning/insights", "GET", "/api/learning/insights"));

  // 6. AI APIs (1 run to avoid rate limiting)
  console.log("\n▶ Đo AI APIs (1 run)...");
  results.push(await measure("POST /api/ai/chat", "POST", "/api/ai/chat", { messages: [{ role: "user", content: "Hello" }] }, 1));
  results.push(await measure("GET /api/ai/health", "GET", "/api/ai/health", null, 1));
  results.push(await measure("POST /api/ai/tutor", "POST", "/api/ai/tutor", {
    messages: [{ role: "user", content: "Giải thích biến" }],
    learningContext: { courseTitle: "Python", courseSlug: "python", currentLessonTitle: "Biến", currentLessonId: "1", lessonType: "video", lessonContent: "", videoUrl: "", progress: 10, completedLessons: 1, totalLessons: 10, currentSection: "Ch1", recentCompletedTopics: [], courseOutline: "" }
  }, 1));

  // 7. Upload validation
  console.log("\n▶ Đo Upload validation...");
  results.push(await measure("POST /api/upload/avatar (validation)", "POST", "/api/upload/avatar", {}));

  // 8. Admin
  console.log("\n▶ Đo Admin APIs...");
  results.push(await measure("GET /api/admin/stats", "GET", "/api/admin/stats"));

  // 9. Page load - SSR
  console.log("\n▶ Đo Page Load (SSR)...");
  results.push(await measure("GET / (Homepage)", "GET", "/", null, 3));
  results.push(await measure("GET /courses (Course list)", "GET", "/courses", null, 3));
  results.push(await measure("GET /articles (Blog)", "GET", "/articles", null, 3));

  // Print results
  console.log("\n" + "=".repeat(110));
  console.log("ENDPOINT".padEnd(45) + "STATUS".padEnd(8) + "AVG(ms)".padEnd(12) + "MIN(ms)".padEnd(12) + "MAX(ms)".padEnd(12) + "BODY(bytes)");
  console.log("-".repeat(110));
  for (const r of results) {
    const label = r.label.padEnd(45);
    const status = String(r.status).padEnd(8);
    const avg = r.avg.toFixed(1).padEnd(12);
    const min = r.min.toFixed(1).padEnd(12);
    const max = r.max.toFixed(1).padEnd(12);
    const size = String(r.bodySize);
    console.log(`${label}${status}${avg}${min}${max}${size}`);
  }
  console.log("=".repeat(110));

  // Save JSON
  const fs = await import("fs");
  const outputPath = "coverage/performance-benchmark.json";
  fs.mkdirSync("coverage", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      timestamp: new Date().toISOString(),
      totalEndpoints: results.length,
      environment: "localhost:3000 (Next.js 15 + Turbopack)",
    },
    results
  }, null, 2));
  console.log(`\nPerformance JSON: ${outputPath}`);
}

main();
