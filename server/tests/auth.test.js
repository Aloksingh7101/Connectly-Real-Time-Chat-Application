const request = require('supertest');
const app = require('../src/app');

const validUser = {
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
};

describe('Auth', () => {
  test('registers a new user and returns no password field', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe('testuser');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  test('rejects registration with a duplicate username', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'different@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('rejects registration with a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: '123' });

    expect(res.status).toBe(400);
  });

  test('logs in with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('testuser');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'testuser', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('blocks access to a protected route without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('allows access to a protected route with a valid token cookie', async () => {
    const agent = request.agent(app); // persists cookies across requests, like a browser
    await agent.post('/api/auth/register').send(validUser);
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('testuser');
  });
});
