/**
 * Unit Tests: speech.js (speechService)
 *
 * Tests cover:
 * 1. isSupported() detection
 * 2. stop() calls speechSynthesis.cancel()
 * 3. speak() dispatches a SpeechSynthesisUtterance for non-empty text
 * 4. speak() strips markdown symbols before speaking
 * 5. speak() does nothing when text is empty
 * 6. speak() sets utterance.lang to the language's BCP-47 code
 * 7. onStart is wired directly to utterance.onstart
 * 8. onEnd callback is invoked when utterance.onend fires
 * 9. onError callback is invoked when utterance.onerror fires
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speechService } from '../utils/speech';

// ─────────────────────────────────────────────────────────────────────────────
// Utterance capture utility
// We use `function` (not arrow) because SpeechSynthesisUtterance is used
// with `new` in speech.js — arrow functions are not valid constructors.
// ─────────────────────────────────────────────────────────────────────────────
let lastUtterance = null;

function setupUtteranceMock() {
  lastUtterance = null;
  // Must use `function` syntax — vi.fn wraps it and calls it with `new`
  global.SpeechSynthesisUtterance = vi.fn(function (text) {
    this.text = text;
    this.lang = '';
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    lastUtterance = this; // capture for assertions
  });
}

beforeEach(() => {
  setupUtteranceMock();
  window.speechSynthesis.speak = vi.fn();
  window.speechSynthesis.cancel = vi.fn();
  window.speechSynthesis.getVoices = vi.fn(() => []);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('speechService.isSupported()', () => {
  it('returns true when speechSynthesis is available in window', () => {
    expect(speechService.isSupported()).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('speechService.stop()', () => {
  it('calls speechSynthesis.cancel()', () => {
    speechService.stop();
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('speechService.speak()', () => {

  it('does nothing (no speak call) when text is empty string', () => {
    speechService.speak('', 'en');
    // stop() IS called (cancel is called), but speak() must NOT be dispatched
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('calls speechSynthesis.speak() once for non-empty text', () => {
    speechService.speak('Stay safe during monsoon.', 'en');
    expect(SpeechSynthesisUtterance).toHaveBeenCalledTimes(1);
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('calls cancel() before dispatching (stop-first behaviour)', () => {
    speechService.speak('Alert: heavy rain.', 'en');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    // speak should be called after cancel
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('strips markdown bold markers (**) from text before speaking', () => {
    speechService.speak('**Stay safe** during monsoon.', 'en');
    expect(lastUtterance.text).not.toContain('**');
    expect(lastUtterance.text).toContain('Stay safe');
  });

  it('strips markdown heading markers (#) from text before speaking', () => {
    speechService.speak('## Monsoon Safety\nStay indoors.', 'en');
    expect(lastUtterance.text).not.toContain('#');
  });

  it('strips backtick code markers from text before speaking', () => {
    speechService.speak('Use `chlorine tablets` to purify water.', 'en');
    expect(lastUtterance.text).not.toContain('`');
  });

  it('sets utterance.lang to the primary BCP-47 code for English (en-IN)', () => {
    speechService.speak('Hello monsoon.', 'en');
    expect(lastUtterance.lang).toBe('en-IN');
  });

  it('sets utterance.lang to hi-IN for Hindi', () => {
    speechService.speak('मानसून सुरक्षा।', 'hi');
    expect(lastUtterance.lang).toBe('hi-IN');
  });

  it('wires the onStart callback directly to utterance.onstart', () => {
    const onStart = vi.fn();
    speechService.speak('Test onStart', 'en', onStart, null, null);
    // speech.js does: if (onStart) utterance.onstart = onStart;
    expect(lastUtterance.onstart).toBe(onStart);
  });

  it('invokes the onEnd callback when utterance.onend fires', () => {
    const onEnd = vi.fn();
    speechService.speak('Test onEnd', 'en', null, onEnd, null);
    // speech.js wraps onEnd inside utterance.onend — trigger it manually
    lastUtterance.onend();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('invokes the onError callback when utterance.onerror fires', () => {
    const onError = vi.fn();
    speechService.speak('Test onError', 'en', null, null, onError);
    const fakeError = new Error('synthesis-error');
    lastUtterance.onerror(fakeError);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(fakeError);
  });

  it('utterance passed to speechSynthesis.speak is the constructed utterance', () => {
    speechService.speak('Verify utterance reference', 'en');
    const calledWithArg = window.speechSynthesis.speak.mock.calls[0][0];
    expect(calledWithArg).toBe(lastUtterance);
  });
});
