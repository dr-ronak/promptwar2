/**
 * sanitize.js — Shared input sanitization utility
 *
 * Prevents XSS and prompt injection by:
 * 1. Stripping HTML tags from user input
 * 2. Escaping characters that could break GenAI prompt structure
 * 3. Enforcing maximum string length
 *
 * Usage:
 *   import { sanitizeInput, sanitizeForPrompt } from '../utils/sanitize';
 *   const clean = sanitizeInput(rawUserInput, 200);
 *   const safePromptVar = sanitizeForPrompt(rawUserInput);
 */

/**
 * Remove HTML tags and trim whitespace from user input.
 * @param {string} str — raw user input
 * @param {number} [maxLength=500] — maximum allowed length
 * @returns {string} sanitized string
 */
export function sanitizeInput(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/&lt;/gi, '<')        // decode common entities
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim()
    .slice(0, maxLength);
}

/**
 * Prepare user input for safe injection into a GenAI prompt.
 * Escapes characters that could be used for prompt injection:
 * - Triple backticks (code blocks that could redefine system instructions)
 * - Markdown headings at start of line (could inject new sections)
 * - "Ignore previous instructions" patterns
 *
 * @param {string} str — user input destined for a prompt template
 * @param {number} [maxLength=300] — maximum allowed length
 * @returns {string} prompt-safe string
 */
export function sanitizeForPrompt(str, maxLength = 300) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')                    // strip HTML
    .replace(/```/g, '')                         // strip code fences
    .replace(/^#{1,6}\s/gm, '')                  // strip markdown headings
    .replace(/ignore\s+(previous|above|all)\s+instructions?/gi, '[filtered]')
    .replace(/system\s*:/gi, '[filtered]')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate that a string looks like a plausible Gemini API key.
 * Does NOT verify the key works — only basic format sanity.
 * @param {string} key
 * @returns {boolean}
 */
export function isValidApiKeyFormat(key) {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  // Gemini API keys are typically 39 characters, alphanumeric + dashes/underscores
  return trimmed.length >= 20 && trimmed.length <= 100 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}
