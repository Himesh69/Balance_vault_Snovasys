import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('End-to-End Banking Workflow Integration Tests (PRD Section 6)', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let onboardingId: string;
  let accountId: string;

  it('1. Admin logs in successfully', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@balancevault.com', password: 'Admin@123456' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    adminToken = res.body.data.token;
    expect(adminToken).toBeDefined();
  });

  it('2. New user registers and gets a draft onboarding', async () => {
    const email = `flow_user_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/auth/register')
      .send({
        email,
        password: 'Password@123',
        fullName: 'E2E Flow User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    userToken = res.body.data.token;
    userId = res.body.data.user.id;
    onboardingId = res.body.data.user.onboarding.id;
    expect(userToken).toBeDefined();
  });

  it('3. User fetches their onboarding draft', async () => {
    const res = await request(app)
      .get('/onboarding')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('4. User updates their onboarding draft', async () => {
    const res = await request(app)
      .put('/onboarding')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        legalName: 'E2E Flow User Legal',
        dateOfBirth: '1995-05-15',
        phoneNumber: '+1234567890',
        streetAddress: '123 Wall Street',
        city: 'New York',
        country: 'USA',
        idType: 'PASSPORT',
        idNumber: 'P12345678',
        occupation: 'Software Engineer',
        sourceOfFunds: 'SALARY',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.legalName).toBe('E2E Flow User Legal');
  });

  it('5. User submits onboarding application', async () => {
    const res = await request(app)
      .post('/onboarding/submit')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('6. Admin reviews and approves onboarding, auto-creating user account', async () => {
    const res = await request(app)
      .post(`/admin/onboarding/${onboardingId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reviewNotes: 'Approved after verification' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.onboarding.status).toBe('APPROVED');
    expect(res.body.data.account).toBeDefined();
    accountId = res.body.data.account.id;
    expect(res.body.data.account.status).toBe('ACTIVE');
  });

  it('7. User lists their accounts and sees the new active account', async () => {
    const res = await request(app)
      .get('/accounts')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].id).toBe(accountId);
    expect(res.body.data[0].cachedBalance).toBe(0);
  });

  it('8. User deposits funds (Credit account: $500.00 = 50000 cents)', async () => {
    const res = await request(app)
      .post(`/accounts/${accountId}/credit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 50000,
        description: 'Initial payroll deposit',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reference).toBeDefined();
    expect(res.body.data.entries.length).toBe(2);
  });

  it('9. User account balance is now 50000 cents', async () => {
    const res = await request(app)
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cachedBalance).toBe(50000);
  });

  it('10. User withdraws funds (Debit account: $150.00 = 15000 cents)', async () => {
    const res = await request(app)
      .post(`/accounts/${accountId}/debit`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 15000,
        description: 'ATM withdrawal',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('11. User account balance is now 35000 cents ($350.00)', async () => {
    const res = await request(app)
      .get(`/accounts/${accountId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cachedBalance).toBe(35000);
  });

  it('12. User gets ledger audit trail with 2 transactions', async () => {
    const res = await request(app)
      .get(`/accounts/${accountId}/ledger`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('13. Admin views immutable audit logs', async () => {
    const res = await request(app)
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.logs.length).toBeGreaterThan(0);
  });
});
