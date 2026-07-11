// Global test setup for Vitest + Testing Library
import '@testing-library/jest-dom';

// Mock Web Speech API (not available in jsdom)
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  pause: vi.fn(),
  resume: vi.fn(),
  pending: false,
  speaking: false,
  paused: false
};

global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: '',
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  onstart: null,
  onend: null,
  onerror: null
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Reset all mocks and localStorage before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});
