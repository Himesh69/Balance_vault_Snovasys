import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Auth API Integration Tests (PRD Section 6.1)', () => {
  it('GET /health returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /auth/login fails with 400 when body is invalid', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation Error');
  });

  it('POST /auth/login fails with 401 on wrong credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@balancevault.com', password: 'WrongPassword999!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('POST /auth/login succeeds with seeded admin credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@balancevault.com', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@balancevault.com');
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('POST /auth/register creates a new user and returns 201', async () => {
    const testEmail = `user_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/auth/register')
      .send({
        email: testEmail,
        password: 'Password@123',
        fullName: 'Integration Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.onboarding.status).toBe('DRAFT');

    // Duplicate registration should return 409
    const dupRes = await request(app)
      .post('/auth/register')
      .send({
        email: testEmail,
        password: 'Password@123',
        fullName: 'Integration Test User',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error).toBe('User with this email already exists');
  });

  it('GET /auth/me returns 401 when unauthenticated and 200 with valid token', async () => {
    const unauth = await request(app).get('/auth/me');
    expect(unauth.status).toBe(401);

    // Login as admin first
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@balancevault.com', password: 'Admin@123456' });

    const token = loginRes.body.data.token;
    const authRes = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.data.email).toBe('admin@balancevault.com');
  });
});
