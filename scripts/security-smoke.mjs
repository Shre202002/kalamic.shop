const baseUrl = (process.env.SECURITY_BASE_URL || 'http://localhost:9002').replace(/\/$/, '');

const checks = [
  { path: '/', expected: [200] },
  { path: '/api/orders/pending', expected: [401] },
  { path: '/api/orders/not-a-real-order', expected: [401, 403, 404] },
  { path: '/api/admin/products', expected: [401, 403, 405] },
  { path: '/api/cron/cleanup-orders', expected: [401] },
];

let failed = false;
for (const check of checks) {
  const response = await fetch(`${baseUrl}${check.path}`, { redirect: 'manual' });
  const headerChecks = check.path === '/' ? [
    ['x-content-type-options', 'nosniff'],
    ['x-frame-options', 'DENY'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
  ] : [];

  if (!check.expected.includes(response.status)) {
    failed = true;
    console.error(`FAIL ${check.path}: expected ${check.expected.join('/')} got ${response.status}`);
  } else {
    console.log(`PASS ${check.path}: ${response.status}`);
  }

  for (const [name, expected] of headerChecks) {
    const actual = response.headers.get(name);
    if (actual !== expected) {
      failed = true;
      console.error(`FAIL ${check.path}: ${name} expected ${expected} got ${actual}`);
    }
  }
}

if (failed) process.exit(1);
console.log('Security smoke checks passed.');
