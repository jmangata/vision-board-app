const BASE_URL = 'http://localhost:5000/api';

const log = (msg, data = null) => {
  console.log(`\n=== ${msg} ===`);
  if (data) console.log(JSON.stringify(data, null, 2));
};

const request = async (url, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    console.error(`[${method}] ${url} -> ${res.status}`, data);
    throw new Error(`Request failed: ${res.status}`);
  }

  return { status: res.status, data };
};

async function run() {
  const email = `test-${Date.now()}@test.com`;
  const password = '123456';
  const firstname = 'Test';

  try {
    log('1. REGISTER', { email });
    const { data: register } = await request('/auth/register', 'POST', { email, password, firstname });
    log('Register OK', register);

    log('2. LOGIN', { email });
    const { data: login } = await request('/auth/login', 'POST', { email, password });
    log('Login OK', login);
    const token = login.token;

    log('3. LIST CATEGORIES');
    const { data: categories } = await request('/categories', 'GET', null, token);
    log('Categories OK', categories);
    const categoryId = categories[0].id;

    log('4. LIST BADGES');
    const { data: badges } = await request('/badges', 'GET', null, token);
    log('Badges OK', badges);

    log('5. CREATE GOAL', { categoryId });
    const { data: goal } = await request('/goals', 'POST', {
      title: 'Apprendre React',
      description: 'Maîtriser React pour le frontend',
      categoryId,
      targetDate: '2026-12-31',
    }, token);
    log('Goal created', goal);
    const goalId = goal.id;

    log('6. LIST GOALS');
    const { data: goals } = await request('/goals', 'GET', null, token);
    log('Goals OK', goals);

    log('7. CREATE STEP', { goalId });
    const { data: step } = await request(`/goals/${goalId}/steps`, 'POST', {
      title: 'Setup Vite',
    }, token);
    log('Step created', step);
    const stepId = step.id;

    log('8. TOGGLE STEP', { stepId });
    const { data: toggled } = await request(`/steps/${stepId}/toggle`, 'PATCH', null, token);
    log('Step toggled', toggled);

    log('9. DASHBOARD');
    const { data: dashboard } = await request('/dashboard', 'GET', null, token);
    log('Dashboard OK', dashboard);

    log('10. CREATE REMINDER', { goalId });
    const { data: reminder } = await request('/reminders', 'POST', {
      goalId,
      frequency: 'daily',
    }, token);
    log('Reminder created', reminder);

    log('✅ ALL TESTS PASSED');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

run();
