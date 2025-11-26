import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate } from "k6/metrics";

// Metric to track error rates
export const errorRate = new Rate("errors");

// Test Configuration
export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Ramp up to 10 users
    { duration: "2m", target: 20 }, // Increase load to 20 users (Heavy CPU)
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    errors: ["rate<0.01"], // Fail if error rate > 1%
    http_req_duration: ["p(95)<2000"], // Relaxed timeout for video
  },
};

const BASE_URL =
  "http://a237a8048d36d4d18a6387a3813452cc-365925734.us-east-1.elb.amazonaws.com:8080";

function randomString(length) {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  while (length--) res += charset[Math.floor(Math.random() * charset.length)];
  return res;
}

export default function () {
  const email = `user_${randomString(5)}@test.com`;
  const password = "password123";
  const name = "Load Test User";

  // 1. REGISTER (High CPU)
  let res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password, name }),
    { headers: { "Content-Type": "application/json" } },
  );

  // 2. LOGIN (High CPU)
  res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, { "Login successful": (r) => r.status === 200 }) ||
    errorRate.add(1);

  const token = res.json("access_token");

  if (!token) {
    // If login fails, wait and retry logic is handled by next iteration
    return;
  }

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // 3. HEAVY SEARCH LOOP (Simulates Browsing)
  group("Browsing Flow", function () {
    const searchTerms = [
      "laptop",
      "phone",
      "cookies",
      "water",
      "monitor",
      "headphone",
    ];

    // Perform multiple searches per user to generate consistent load
    for (let i = 0; i < 5; i++) {
      const randomTerm =
        searchTerms[Math.floor(Math.random() * searchTerms.length)];
      const searchRes = http.get(
        `${BASE_URL}/search?q=${randomTerm}&limit=20`,
        params,
      );
      check(searchRes, { "Search success": (r) => r.status === 200 });
      sleep(1);
    }
  });

  sleep(1);
}

