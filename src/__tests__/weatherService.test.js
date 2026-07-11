/**
 * Unit Tests: weatherService.js
 *
 * Tests cover:
 * 1. City coordinate resolution (known cities & unknown city hashing)
 * 2. Risk engine: flood index, waterlogging risk, lightning probability
 * 3. Alert generation thresholds
 * 4. Simulated monsoon weather generation (deterministic)
 * 5. Waterlogging hotspot lookup
 * 6. API fetch with network failure fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { weatherService, CITIES_COORDINATES } from '../services/weatherService';

// ─────────────────────────────────────────────────────────────────────────────
// 1. City resolution
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherService.resolveCity()', () => {
  it('returns correct coordinates for a known city: Mumbai', () => {
    const city = weatherService.resolveCity('Mumbai');
    expect(city.name).toBe('Mumbai');
    expect(city.lat).toBeCloseTo(19.076, 2);
    expect(city.lon).toBeCloseTo(72.877, 2);
    expect(city.state).toBe('Maharashtra');
  });

  it('is case-insensitive for city lookups', () => {
    const lower = weatherService.resolveCity('mumbai');
    const upper = weatherService.resolveCity('MUMBAI');
    const mixed = weatherService.resolveCity('Mumbai');
    expect(lower.name).toBe(upper.name);
    expect(lower.name).toBe(mixed.name);
  });

  it('resolves Delhi coordinates correctly', () => {
    const city = weatherService.resolveCity('delhi');
    expect(city.name).toBe('Delhi');
    expect(city.lat).toBeCloseTo(28.61, 1);
    expect(city.country).toBe('India');
  });

  it('generates deterministic synthetic coordinates for unknown city', () => {
    const city1 = weatherService.resolveCity('Jhumritalaiya');
    const city2 = weatherService.resolveCity('Jhumritalaiya');
    // Same input must produce same coordinates
    expect(city1.lat).toBe(city2.lat);
    expect(city1.lon).toBe(city2.lon);
  });

  it('keeps synthetic coordinates within Indian subcontinent bands', () => {
    const testCities = ['Dhamtari', 'Bargarh', 'Palakkad', 'Mahbubnagar', 'Tezpur'];
    testCities.forEach((name) => {
      const city = weatherService.resolveCity(name);
      expect(city.lat).toBeGreaterThanOrEqual(8);
      expect(city.lat).toBeLessThanOrEqual(33);
      expect(city.lon).toBeGreaterThanOrEqual(68);
      expect(city.lon).toBeLessThanOrEqual(93);
    });
  });

  it('capitalizes first letter of unknown city name', () => {
    const city = weatherService.resolveCity('aurangabad');
    expect(city.name).toBe('Aurangabad');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Risk engine via processWeatherData()
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherService.processWeatherData() – Risk Engine', () => {
  const baseCity = CITIES_COORDINATES.mumbai;

  const makeApiData = ({ rain = 0, precipitation = 0, wind = 20, humidity = 80, temp = 28, precipSum = 0, rainProb = 60 } = {}) => ({
    current: {
      temperature_2m: temp,
      relative_humidity_2m: humidity,
      apparent_temperature: temp - 2,
      precipitation,
      rain,
      weather_code: 61,
      wind_speed_10m: wind
    },
    daily: {
      precipitation_sum: [precipSum],
      precipitation_probability_max: [rainProb]
    }
  });

  it('calculates low flood risk for dry conditions', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 0, precipSum: 5 }));
    expect(data.floodRiskIndex).toBeLessThan(4);
    expect(data.waterloggingRisk).toBe('Low');
  });

  it('calculates medium flood risk for moderate rain', () => {
    // floodRiskIndex = 24/12 + 2*1.5 = 2 + 3 = 5.0 → 'Medium' (3 < 5 <= 6, rain <= 5)
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 2, precipSum: 24 }));
    expect(data.floodRiskIndex).toBeGreaterThan(3);
    expect(data.floodRiskIndex).toBeLessThanOrEqual(6);
    expect(data.waterloggingRisk).toBe('Medium');
  });

  it('calculates high flood risk for heavy rain', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 20, precipSum: 100 }));
    expect(data.floodRiskIndex).toBeGreaterThan(6);
    expect(data.waterloggingRisk).toBe('High');
  });

  it('caps flood risk index at 10', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 50, precipSum: 300 }));
    expect(data.floodRiskIndex).toBeLessThanOrEqual(10);
  });

  it('adds HEAVY_RAIN alert when hourly rain > 10 mm', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 15, precipSum: 60 }));
    expect(data.alerts).toContain('HEAVY_RAIN');
  });

  it('adds HEAVY_RAIN alert when daily sum > 50 mm even with light hourly rain', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 2, precipSum: 55 }));
    expect(data.alerts).toContain('HEAVY_RAIN');
  });

  it('adds HIGH_WIND alert when wind > 35 km/h', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ wind: 40, rain: 0, precipSum: 0 }));
    expect(data.alerts).toContain('HIGH_WIND');
  });

  it('does NOT add HIGH_WIND alert for calm wind', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ wind: 20, rain: 0, precipSum: 0 }));
    expect(data.alerts).not.toContain('HIGH_WIND');
  });

  it('adds LIGHTNING alert for high humidity and heavy rain', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ humidity: 95, temp: 30, rain: 15, precipSum: 80 }));
    expect(data.alerts).toContain('LIGHTNING');
  });

  it('adds WATERLOGGING alert when risk is High', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData({ rain: 20, precipSum: 100 }));
    expect(data.alerts).toContain('WATERLOGGING');
  });

  it('returns all expected fields in weather output', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData());
    const requiredFields = ['city', 'state', 'country', 'temp', 'humidity', 'rain', 'wind',
      'floodRiskIndex', 'waterloggingRisk', 'lightningProbability', 'alerts', 'hotspots', 'timestamp'];
    requiredFields.forEach((field) => {
      expect(data).toHaveProperty(field);
    });
  });

  it('timestamp is a valid ISO string', () => {
    const data = weatherService.processWeatherData(baseCity, makeApiData());
    expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Simulated monsoon weather
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherService.generateSimulatedMonsoonWeather()', () => {
  const city = CITIES_COORDINATES.guwahati;

  it('returns consistent (deterministic) results for same city', () => {
    const r1 = weatherService.generateSimulatedMonsoonWeather(city);
    const r2 = weatherService.generateSimulatedMonsoonWeather(city);
    expect(r1.temp).toBe(r2.temp);
    expect(r1.humidity).toBe(r2.humidity);
    expect(r1.rain).toBe(r2.rain);
    expect(r1.floodRiskIndex).toBe(r2.floodRiskIndex);
  });

  it('temperature is within monsoon realistic range (24–32°C)', () => {
    const r = weatherService.generateSimulatedMonsoonWeather(city);
    expect(r.temp).toBeGreaterThanOrEqual(24);
    expect(r.temp).toBeLessThanOrEqual(32);
  });

  it('humidity is within realistic range (75–98%)', () => {
    const r = weatherService.generateSimulatedMonsoonWeather(city);
    expect(r.humidity).toBeGreaterThanOrEqual(75);
    expect(r.humidity).toBeLessThanOrEqual(98);
  });

  it('marks the result as simulated', () => {
    const r = weatherService.generateSimulatedMonsoonWeather(city);
    expect(r.isSimulated).toBe(true);
  });

  it('flood risk is between 0 and 10', () => {
    const r = weatherService.generateSimulatedMonsoonWeather(city);
    expect(r.floodRiskIndex).toBeGreaterThanOrEqual(0);
    expect(r.floodRiskIndex).toBeLessThanOrEqual(10);
  });

  it('includes hotspots array', () => {
    const r = weatherService.generateSimulatedMonsoonWeather(city);
    expect(Array.isArray(r.hotspots)).toBe(true);
    expect(r.hotspots.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Waterlogging hotspots
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherService.getWaterloggingHotspots()', () => {
  it('returns Mumbai-specific hotspots for Mumbai', () => {
    const spots = weatherService.getWaterloggingHotspots('Mumbai');
    expect(spots).toContain('Hindmata Junction');
  });

  it('returns Delhi-specific hotspots for Delhi', () => {
    const spots = weatherService.getWaterloggingHotspots('Delhi');
    expect(spots.some(s => s.toLowerCase().includes('minto'))).toBe(true);
  });

  it('returns fallback generic hotspots for unknown cities', () => {
    const spots = weatherService.getWaterloggingHotspots('Dhamtari');
    expect(Array.isArray(spots)).toBe(true);
    expect(spots.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. fetchWeather() – API failure fallback
// ─────────────────────────────────────────────────────────────────────────────
describe('weatherService.fetchWeather() – fallback on network error', () => {
  it('returns simulated data when the Open-Meteo API fails', async () => {
    // Simulate network failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network offline'));

    const result = await weatherService.fetchWeather('Mumbai');
    expect(result).toBeDefined();
    expect(result.city).toBe('Mumbai');
    expect(result.isSimulated).toBe(true);

    global.fetch.mockRestore?.();
  });

  it('returns processed API data when the fetch succeeds', async () => {
    const mockApiResponse = {
      current: {
        temperature_2m: 29,
        relative_humidity_2m: 88,
        apparent_temperature: 27,
        precipitation: 5,
        rain: 5,
        weather_code: 63,
        wind_speed_10m: 25
      },
      daily: {
        precipitation_sum: [42],
        precipitation_probability_max: [95]
      }
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const result = await weatherService.fetchWeather('Delhi');
    expect(result.temp).toBe(29);
    expect(result.humidity).toBe(88);
    expect(result.city).toBe('Delhi');
    expect(result.isSimulated).toBeUndefined();

    global.fetch.mockRestore?.();
  });
});
