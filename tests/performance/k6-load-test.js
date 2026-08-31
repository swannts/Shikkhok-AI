import http from 'k6/http';
import { check, sleep, group } from 'k6';

// K6 10,000 Concurrent Student Load Testing Suite
export const options = {
  stages: [
    { duration: '30s', target: 500 },    // Warm-up to 500 concurrent users
    { duration: '1m', target: 2500 },    // Ramp-up to 2,500 students
    { duration: '2m', target: 10000 },   // Peak stress load: 10,000 students
    { duration: '1m', target: 10000 },   // Sustained 10k throughput
    { duration: '30s', target: 0 },      // Graceful cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<350', 'p(99)<800'], // 95% of requests under 350ms
    http_req_failed: ['rate<0.01'],                 // Error rate < 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api/v1';
const AI_URL = __ENV.AI_URL || 'http://localhost:8000/api/v1';

export default function () {
  const vuId = __VU;

  group('1. Health & Discovery', () => {
    const res = http.get(`${BASE_URL}/health/live`);
    check(res, {
      'API Health 200': (r) => r.status === 200,
    });
  });

  group('2. Curriculum & Textbook Manifests', () => {
    const res = http.get(`${BASE_URL}/textbooks/manifests/bundle?classLevel=8`);
    check(res, {
      'Textbook Bundle 200': (r) => r.status === 200,
      'Has Textbooks array': (r) => r.body.includes('textbooks'),
    });
  });

  group('3. AI RAG Retrieval Search', () => {
    const payload = JSON.stringify({
      query: 'নিউটনের গতির সূত্রাবলী',
      class_level: 9,
      subject_id: 'physics',
      top_k: 3,
    });

    const headers = { 'Content-Type': 'application/json' };
    const res = http.post(`${AI_URL}/retrieval/search`, payload, { headers });

    check(res, {
      'RAG Search 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1); // 1-3s human delay between actions
}
