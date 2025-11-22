import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Metric to track error rates
export const errorRate = new Rate('errors');

// Test Configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Spike to 50 users (Should trigger HPA)
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    errors: ['rate<0.01'], // Fail if error rate > 1%
    http_req_duration: ['p(95)<500'], // 95% of requests should be faster than 500ms
  },
};

const BASE_URL = 'http://a7e2b445c41ad4dde9c639ec8b4c6a7e-4665936.us-east-1.elb.amazonaws.com:8080'; // 🔴 CHANGE THIS TO YOUR LB URL

// Helper to generate random string for unique users
function randomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let res = '';
  while (length--) res += charset[Math.floor(Math.random() * charset.length)];
  return res;
}

export default function () {
  // 1. SETUP: Register & Login a unique user for this VU (Virtual User)
  // We do this once per iteration to simulate a full session
  const email = `user_${randomString(5)}@test.com`;
  const password = 'password123';
  const name = 'Load Test User';

  // Register
  let res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: email,
    password: password,
    name: name
  }), { headers: { 'Content-Type': 'application/json' } });

  // If registration fails (e.g. user exists), try login immediately
  
  // Login
  res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: email,
    password: password
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, { 'Login successful': (r) => r.status === 200 }) || errorRate.add(1);
  
  const token = res.json('access_token');
  const userId = res.json('user.user_id'); // Adjust if your backend structure differs

  if (!token) {
    console.error('Failed to get token');
    return;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  // 2. USER JOURNEY
  group('Shopping Flow', function () {
    
    const searchTerms = ['laptop', 'phone', 'cookies', 'water', 'monitor', 'headphone'];
    let results = [];
    let attempts = 0;
    const maxAttempts = 3; // Try 3 different words before giving up

    // 🔁 RETRY LOOP: Keep searching until we find items or run out of tries
    while (results.length === 0 && attempts < maxAttempts) {
        attempts++;
        // Pick a random term
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
        
        const searchRes = http.get(`${BASE_URL}/search?q=${randomTerm}&limit=5`, params);
        
        // Only verify it didn't crash (200 OK)
        check(searchRes, { 'Search success': (r) => r.status === 200 });

        // Check if we got any items
        const body = searchRes.json();
        if (body && body.results && body.results.length > 0) {
            results = body.results;
            // console.log(`Found items for "${randomTerm}" on attempt ${attempts}`);
        } else {
            // console.log(`No items found for "${randomTerm}", retrying...`);
            sleep(0.5); // Wait a tiny bit before trying again
        }
    }
    
    // Only proceed if we actually found something after all retries
    if (results.length > 0) {
      // Pick a random item from the successful results
      const item = results[Math.floor(Math.random() * results.length)];
      const realId = item.item_id;
      const realPrice = item.price;

      // B. Add to Cart
      const addRes = http.post(`${BASE_URL}/cart/${userId}/add`, JSON.stringify({
        item_id: realId, 
        quantity: 1,
        price: realPrice 
      }), params);
      
      check(addRes, { 'Add to Cart status 200': (r) => r.status === 200 }) || errorRate.add(1);

      sleep(1);

      // C. Place Order
      const orderRes = http.post(`${BASE_URL}/orders/${userId}/place`, {}, params);
      check(orderRes, { 'Place Order status 200': (r) => r.status === 200 }) || errorRate.add(1);
    } else {
        // Optional: Log failure if 3 attempts all failed (Database might be empty)
        // console.error("Failed to find any products after 3 attempts");
        errorRate.add(1); 
    }
  });

  sleep(1);
}