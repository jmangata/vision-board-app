// Tests unitaires de la logique de streak (jours de connexion consécutifs).
import { describe, it, expect } from 'vitest';
import { computeStreakUpdate } from '../src/controllers/authController.js';

describe('computeStreakUpdate', () => {
  it('première connexion : streak initialisé à 1', () => {
    const result = computeStreakUpdate(null, 0);
    expect(result.streakDays).toBe(1);
    expect(result.lastLoginAt).toBeInstanceOf(Date);
  });

  it('connexion le même jour : aucune mise à jour', () => {
    const result = computeStreakUpdate(new Date(), 5);
    expect(result.streakDays).toBeUndefined();
    expect(result.lastLoginAt).toBeUndefined();
  });

  it('connexion le lendemain : streak incrémenté', () => {
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = computeStreakUpdate(hier, 3);
    expect(result.streakDays).toBe(4);
    expect(result.lastLoginAt).toBeInstanceOf(Date);
  });

  it('connexion après plusieurs jours : streak réinitialisé à 1', () => {
    const ilYa5Jours = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const result = computeStreakUpdate(ilYa5Jours, 10);
    expect(result.streakDays).toBe(1);
  });
});
