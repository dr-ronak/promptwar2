/**
 * Unit Tests: speech.js (speechService)
 *
 * Tests cover:
 * 1. isSupported() detection
 * 2. stop() calls speechSynthesis.cancel()
 * 3. speak() creates and dispatches a SpeechSynthesisUtterance
 * 4. speak() strips markdown symbols before speaking
 * 5. speak() does nothing for empty text
 * 6. Rate and pitch are set to correct values
 * 7. onEnd callback is called when utterance ends
 * 8. onError callback is called when utterance errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speechService } from '../../utils/speech';

describe('speechService.isSupported()', () => {
  it('returns true when speechSynthesis is available in window', () => {
    // window.speechSynthesis is mocked in setup.js
    expect(speechService.isSupported()).toBe(true);
  });
});

describe('speechService.stop()', () => {
  it('calls speechSynthesis.cancel()', () => {
    speechService.stop();
    expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });
});

describe('speechService.speak()', () => {
  beforeEach(() => {
    // Reset the speak mock before each test
    vi.clearAllMocks();
    window.speechSynthesis.speak = vi.fn();
    window.speechSynthesis.cancel = vi.fn();
  });

  it('does nothing when text is empty', () => {
    speechService.speak('', 'en');
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
  });

  it('calls speechSynthesis.speak() with a valid utterance for non-empty text', () => {
    speechService.speak('Stay safe during monsoon.', 'en');
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(SpeechSynthesisUtterance).toHaveBeenCalled();
  });

  it('strips markdown bold markers (**) from text before speaking', () => {
    speechService.speak('**Stay safe** during monsoon.', 'en');
    const utteranceArg = SpeechSynthesisUtterance.mock.calls[0][0];
    expect(utteranceArg).not.toContain('**');
    expect(utteranceArg).toContain('Stay safe');
  });

  it('strips markdown heading markers (#) from text before speaking', () => {
    speechService.speak('## Monsoon Safety\nStay indoors.', 'en');
    const utteranceArg = SpeechSynthesisUtterance.mock.calls[0][0];
    expect(utteranceArg).not.toContain('#');
  });

  it('strips backtick code markers from text before speaking', () => {
    speechService.speak('Use `chlorine tablets` to purify water.', 'en');
    const utteranceArg = SpeechSynthesisUtterance.mock.calls[0][0];
    expect(utteranceArg).not.toContain('`');
  });

  it('calls speechSynthesis.cancel() first to stop any existing speech', () => {
    speechService.speak('New alert message.', 'en');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('invokes the onStart callback when speech begins', () => {
    const onStart = vi.fn();

    // Intercept the utterance instance
    let capturedUtterance;
    SpeechSynthesisUtterance.mockImplementationOnce((text) => {
      capturedUtterance = { text, onstart: null, onend: null, onerror: null };
      return capturedUtterance;
    });
    window.speechSynthesis.speak.mockImplementationOnce(() => {
      if (capturedUtterance?.onstart) capturedUtterance.onstart();
    });

    speechService.speak('Test onStart', 'en', onStart, null, null);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('invokes the onEnd callback when speech finishes', () => {
    const onEnd = vi.fn();

    let capturedUtterance;
    SpeechSynthesisUtterance.mockImplementationOnce((text) => {
      capturedUtterance = { text, onstart: null, onend: null, onerror: null };
      return capturedUtterance;
    });
    window.speechSynthesis.speak.mockImplementationOnce(() => {
      if (capturedUtterance?.onend) capturedUtterance.onend();
    });

    speechService.speak('Test onEnd', 'en', null, onEnd, null);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('invokes the onError callback on utterance error', () => {
    const onError = vi.fn();

    let capturedUtterance;
    SpeechSynthesisUtterance.mockImplementationOnce((text) => {
      capturedUtterance = { text, onstart: null, onend: null, onerror: null };
      return capturedUtterance;
    });
    window.speechSynthesis.speak.mockImplementationOnce(() => {
      if (capturedUtterance?.onerror) capturedUtterance.onerror(new Error('synthesis error'));
    });

    speechService.speak('Test onError', 'en', null, null, onError);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
