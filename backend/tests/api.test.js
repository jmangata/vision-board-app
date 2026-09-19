// Tests d'intégration de l'API avec Supertest.
// Ces tests exercent les middlewares et les contrôleurs sans démarrer le serveur
// ni toucher la base de données : on vérifie la validation des entrées,
// l'authentification et la sonde de santé.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/health', () => {
  it('répond 200 avec un statut ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/auth/register — validation', () => {
  it('rejette un body vide (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  it('rejette un email invalide (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'pas-un-email',
      password: 'MotDePasse123!',
      firstname: 'Test',
    });
    expect(res.status).toBe(400);
  });

  it('rejette un mot de passe trop faible (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'court',
      firstname: 'Test',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login — validation', () => {
  it('rejette un body vide (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Routes protégées — authentification', () => {
  it('GET /api/goals sans token renvoie 401', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  it('GET /api/dashboard sans token renvoie 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('un token malformé renvoie 401', async () => {
    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', 'Bearer token-invalide');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('rejette un body vide (400)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('rejette un body vide (400)', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
  });

  it('rejette un mot de passe trop faible (400)', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      token: 'abc',
      password: 'court',
    });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/users/me — droit à l\'oubli', () => {
  it('sans token renvoie 401', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.status).toBe(401);
  });
});
