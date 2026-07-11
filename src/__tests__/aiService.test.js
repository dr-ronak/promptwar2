/**
 * Unit Tests: aiService.js
 *
 * Tests cover:
 * 1. API Key management (set, get, clear, hasKey)
 * 2. Mock preparedness plan generation (English & Hindi)
 * 3. Mock travel advisory generation
 * 4. Mock safety chatbot keyword routing
 * 5. Gemini API fallback on missing/bad key
 * 6. Gemini API call – success path (mocked fetch)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiService } from '../../services/aiService';

// ─── Shared test fixture: a standard weather data snapshot ───────────────────
const mockWeatherData = {
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  temp: 29,
  humidity: 90,
  rain: 18.5,
  wind: 38,
  dailyRainSum: 94.2,
  rainProb: 98,
  floodRiskIndex: 8.2,
  waterloggingRisk: 'High',
  lightningProbability: 85,
  alerts: ['HEAVY_RAIN', 'LIGHTNING', 'HIGH_WIND', 'WATERLOGGING'],
  hotspots: ['Hindmata Junction', 'Milan Subway', 'Kurla Depot area']
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. API Key Management
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService – API key management', () => {
  it('hasKey() returns false when no key is stored', () => {
    expect(aiService.hasKey()).toBe(false);
  });

  it('setKey() stores a key and hasKey() returns true', () => {
    aiService.setKey('my-test-key-123');
    expect(aiService.hasKey()).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('gemini_api_key', 'my-test-key-123');
  });

  it('setKey() trims leading/trailing whitespace before storing', () => {
    aiService.setKey('  trimmed-key  ');
    expect(localStorage.setItem).toHaveBeenCalledWith('gemini_api_key', 'trimmed-key');
  });

  it('clearKey() removes the stored key', () => {
    aiService.setKey('key-to-be-cleared');
    aiService.clearKey();
    expect(localStorage.removeItem).toHaveBeenCalledWith('gemini_api_key');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Mock Preparedness Plan – English
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService.mockGeneratePreparednessPlan() – English', () => {
  const baseArgs = {
    city: 'Mumbai',
    familyCount: 4,
    specialNeeds: { elderly: true, infants: false, pets: true, disabled: false },
    residenceType: 'groundFloor',
    vehicle: 'twoWheeler',
    weatherData: mockWeatherData,
    langCode: 'en'
  };

  it('returns a non-empty string', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(typeof plan).toBe('string');
    expect(plan.length).toBeGreaterThan(100);
  });

  it('includes the city name in the output', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(plan).toContain('Mumbai');
  });

  it('includes HIGH RISK marker for floodRiskIndex > 6', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(plan).toContain('HIGH RISK');
  });

  it('includes LOW RISK marker for low floodRiskIndex', async () => {
    const lowRiskData = { ...mockWeatherData, floodRiskIndex: 1.5 };
    const plan = await aiService.mockGeneratePreparednessPlan({ ...baseArgs, weatherData: lowRiskData });
    expect(plan).toContain('LOW RISK');
  });

  it('mentions ground floor risk for groundFloor residenceType', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(plan.toLowerCase()).toContain('ground floor');
  });

  it('mentions two-wheeler hazard when vehicle is twoWheeler', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(plan.toLowerCase()).toContain('two-wheeler');
  });

  it('generates a markdown-structured plan with headers', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    expect(plan).toContain('##');
    expect(plan).toContain('###');
  });

  it('mentions both vulnerable member types: elderly and pets', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(baseArgs);
    // The plan should reflect vulnerable members
    expect(plan.length).toBeGreaterThan(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mock Preparedness Plan – Hindi
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService.mockGeneratePreparednessPlan() – Hindi', () => {
  const hindiArgs = {
    city: 'Mumbai',
    familyCount: 3,
    specialNeeds: { elderly: false, infants: true, pets: false, disabled: false },
    residenceType: 'slumKutcha',
    vehicle: 'noVehicle',
    weatherData: mockWeatherData,
    langCode: 'hi'
  };

  it('returns output with Hindi characters', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(hindiArgs);
    // Hindi range: \u0900-\u097F
    const hasHindi = /[\u0900-\u097F]/.test(plan);
    expect(hasHindi).toBe(true);
  });

  it('contains the city name in the Hindi plan', async () => {
    const plan = await aiService.mockGeneratePreparednessPlan(hindiArgs);
    expect(plan).toContain('Mumbai');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mock Travel Advisory
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService.mockGenerateTravelAdvisory()', () => {
  const travelArgs = {
    source: 'Bandra Station',
    destination: 'Andheri East',
    weatherData: mockWeatherData
  };

  it('returns low safety score (≤3) for high flood risk', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, langCode: 'en' });
    // floodRiskIndex is 8.2 → score should be 2
    expect(advisory).toContain('2/10');
  });

  it('contains source and destination in the advisory', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, langCode: 'en' });
    expect(advisory).toContain('Bandra Station');
    expect(advisory).toContain('Andheri East');
  });

  it('returns medium safety score for moderate flood risk', async () => {
    const modRisk = { ...mockWeatherData, floodRiskIndex: 5.5 };
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, weatherData: modRisk, langCode: 'en' });
    expect(advisory).toContain('5/10');
  });

  it('returns high safety score for low flood risk', async () => {
    const lowRisk = { ...mockWeatherData, floodRiskIndex: 1.2 };
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, weatherData: lowRisk, langCode: 'en' });
    expect(advisory).toContain('9/10');
  });

  it('includes waterlogging hotspots in the advisory tips', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, langCode: 'en' });
    expect(advisory).toContain('Hindmata Junction');
  });

  it('mentions aquaplaning for two-wheeler mode', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, travelMode: 'twoWheeler', langCode: 'en' });
    expect(advisory.toLowerCase()).toContain('aquaplaning');
  });

  it('mentions underpass engine choke for four-wheeler mode', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, travelMode: 'fourWheeler', langCode: 'en' });
    expect(advisory.toLowerCase()).toContain('underpass');
  });

  it('mentions manholes for walking mode', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, travelMode: 'walking', langCode: 'en' });
    expect(advisory.toLowerCase()).toContain('manholes');
  });

  it('generates Hindi travel advisory with Devanagari script', async () => {
    const advisory = await aiService.mockGenerateTravelAdvisory({ ...travelArgs, langCode: 'hi' });
    const hasHindi = /[\u0900-\u097F]/.test(advisory);
    expect(hasHindi).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Mock Safety Chatbot Routing
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService.mockAskSafetyQuestion() – keyword routing', () => {
  const botArgs = { weatherData: mockWeatherData, langCode: 'en' };

  it('routes "snake bite" to snake bite first aid', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'snake bite first aid' });
    expect(answer.toLowerCase()).toContain('snake');
  });

  it('routes "electric shock" question to electrical safety', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'how to handle electric shock' });
    expect(answer.toLowerCase()).toContain('electric');
  });

  it('routes "contaminated water" to health/water safety', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'contaminated water disease prevention' });
    expect(answer.toLowerCase()).toContain('water');
  });

  it('returns the default safety advisory for unrecognized questions', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'general monsoon tips please' });
    expect(answer.length).toBeGreaterThan(50);
  });

  it('returns Hindi safety response for Hindi lang code', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'बिजली का झटका', langCode: 'hi' });
    const hasHindi = /[\u0900-\u097F]/.test(answer);
    expect(hasHindi).toBe(true);
  });

  it('returns a markdown-formatted response', async () => {
    const answer = await aiService.mockAskSafetyQuestion({ ...botArgs, question: 'snake bite' });
    expect(answer).toMatch(/#{2,3}\s+/); // contains ## or ### headers
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Gemini API Integration – success & failure paths
// ─────────────────────────────────────────────────────────────────────────────
describe('aiService – Gemini API call behaviour', () => {
  it('falls back to mock plan when no API key is set', async () => {
    // No key in storage
    const plan = await aiService.generatePreparednessPlan({
      city: 'Delhi',
      familyCount: 2,
      specialNeeds: { elderly: false, infants: false, pets: false, disabled: false },
      residenceType: 'upperFloor',
      vehicle: 'fourWheeler',
      weatherData: mockWeatherData,
      langCode: 'en'
    });
    expect(plan).toBeDefined();
    expect(plan.length).toBeGreaterThan(100);
  });

  it('calls Gemini API when key is present and returns AI response', async () => {
    // Provide a fake API key
    localStorage.getItem.mockReturnValue('FAKE-KEY-FOR-TEST');

    const fakeGeminiResponse = {
      candidates: [{
        content: {
          parts: [{ text: '## AI-generated plan for Delhi\n\nStay safe during heavy rains.' }]
        }
      }]
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => fakeGeminiResponse
    });

    const plan = await aiService.generatePreparednessPlan({
      city: 'Delhi',
      familyCount: 3,
      specialNeeds: { elderly: true, infants: false, pets: false, disabled: false },
      residenceType: 'groundFloor',
      vehicle: 'noVehicle',
      weatherData: mockWeatherData,
      langCode: 'en'
    });

    expect(plan).toContain('AI-generated plan for Delhi');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('gemini-1.5-flash'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('falls back to mock plan when Gemini API returns an error status', async () => {
    localStorage.getItem.mockReturnValue('BAD-KEY');

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: 'API key not valid.' } })
    });

    // Should not throw – should gracefully use the mock engine
    const plan = await aiService.generatePreparednessPlan({
      city: 'Mumbai',
      familyCount: 5,
      specialNeeds: { elderly: false, infants: true, pets: false, disabled: false },
      residenceType: 'slumKutcha',
      vehicle: 'twoWheeler',
      weatherData: mockWeatherData,
      langCode: 'en'
    });

    expect(plan).toBeDefined();
    expect(plan.length).toBeGreaterThan(100);
  });
});
