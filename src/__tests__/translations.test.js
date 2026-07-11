/**
 * Unit Tests: translations.js
 *
 * Tests cover:
 * 1. All 7 languages are exported and present
 * 2. Every language has all required translation keys (no missing keys)
 * 3. No translation value is empty or undefined
 * 4. English is the baseline reference; other languages must match its key set
 */

import { describe, it, expect } from 'vitest';
import { translations, LANGUAGES } from '../../utils/translations';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Language coverage
// ─────────────────────────────────────────────────────────────────────────────
describe('LANGUAGES array', () => {
  const expectedCodes = ['en', 'hi', 'bn', 'mr', 'ta', 'te', 'gu'];

  it('exports 7 languages', () => {
    expect(LANGUAGES).toHaveLength(7);
  });

  it('includes all expected language codes', () => {
    const exportedCodes = LANGUAGES.map((l) => l.code);
    expectedCodes.forEach((code) => {
      expect(exportedCodes).toContain(code);
    });
  });

  it('each language entry has both code and label', () => {
    LANGUAGES.forEach((lang) => {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('label');
      expect(lang.code.length).toBeGreaterThan(0);
      expect(lang.label.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Key completeness – every language must have all English keys
// ─────────────────────────────────────────────────────────────────────────────
describe('translations – key completeness', () => {
  const englishKeys = Object.keys(translations.en);
  const langCodes = ['hi', 'bn', 'mr', 'ta', 'te', 'gu'];

  langCodes.forEach((lang) => {
    it(`${lang} has all keys present in the English baseline`, () => {
      const langKeys = Object.keys(translations[lang]);
      const missingKeys = englishKeys.filter((key) => !langKeys.includes(key));
      expect(missingKeys).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. No empty translation values
// ─────────────────────────────────────────────────────────────────────────────
describe('translations – no empty values', () => {
  Object.keys(translations).forEach((lang) => {
    it(`${lang} has no empty or undefined translation values`, () => {
      Object.entries(translations[lang]).forEach(([key, value]) => {
        expect(value, `Key "${key}" in ${lang} is empty`).toBeTruthy();
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Spot-check critical keys for specific languages
// ─────────────────────────────────────────────────────────────────────────────
describe('translations – spot checks', () => {
  it('English title is "MonsoonSafe AI"', () => {
    expect(translations.en.title).toBe('MonsoonSafe AI');
  });

  it('Hindi title contains Devanagari characters', () => {
    const hasDevanagari = /[\u0900-\u097F]/.test(translations.hi.title);
    expect(hasDevanagari).toBe(true);
  });

  it('Tamil title contains Tamil script', () => {
    const hasTamil = /[\u0B80-\u0BFF]/.test(translations.ta.title);
    expect(hasTamil).toBe(true);
  });

  it('Telugu title contains Telugu script', () => {
    const hasTelugu = /[\u0C00-\u0C7F]/.test(translations.te.title);
    expect(hasTelugu).toBe(true);
  });

  it('Gujarati title contains Gujarati script', () => {
    const hasGujarati = /[\u0A80-\u0AFF]/.test(translations.gu.title);
    expect(hasGujarati).toBe(true);
  });

  it('All languages have "emergency" related keys: ndrf, police, ambulance, fire', () => {
    const criticalKeys = ['ndrf', 'police', 'ambulance', 'fire'];
    Object.keys(translations).forEach((lang) => {
      criticalKeys.forEach((key) => {
        expect(translations[lang][key], `${lang} missing key: ${key}`).toBeTruthy();
      });
    });
  });

  it('navPlanner key exists in all languages and is non-empty', () => {
    Object.keys(translations).forEach((lang) => {
      expect(translations[lang].navPlanner).toBeTruthy();
    });
  });

  it('generatePlan key exists in all languages and is non-empty', () => {
    Object.keys(translations).forEach((lang) => {
      expect(translations[lang].generatePlan).toBeTruthy();
    });
  });
});
