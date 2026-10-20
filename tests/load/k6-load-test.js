import http from "k6/http";
import { check, sleep, group } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 100 },  // Ramp-up to 100 VUs
    { duration: "1m", target: 500 },   // Scale to 500 VUs
    { duration: "2m", target: 1000 },  // Peak at 1,000 concurrent users
    { duration: "30s", target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<350"], // 95% of requests must complete below 350ms
    http_req_failed: ["rate<0.01"],   // Less than 1% errors allowed
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  group("1. Public Landing & Cold-Start Feed", function () {
    const res = http.get(`${BASE_URL}/`);
    check(res, {
      "Landing status is 200": (r) => r.status === 200,
      "Landing renders under 250ms": (r) => r.timings.duration < 250,
    });
    sleep(1);
  });

  group("2. Browse External Hackathons Directory", function () {
    const res = http.get(`${BASE_URL}/hackathons`);
    check(res, {
      "Hackathons directory status is 200": (r) => r.status === 200,
    });
    sleep(1.5);
  });

  group("3. Algorithmic Teammate Matching Feed", function () {
    const res = http.get(`${BASE_URL}/matches?hackathonId=h-sih-2026`);
    check(res, {
      "Matches page status is 200": (r) => r.status === 200,
      "Match query returns fast (< 300ms)": (r) => r.timings.duration < 300,
    });
    sleep(2);
  });

  group("4. System Health Check Endpoint", function () {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      "Health endpoint is 200": (r) => r.status === 200,
      "Service status is healthy": (r) => JSON.parse(r.body).status === "healthy",
    });
    sleep(0.5);
  });
}
