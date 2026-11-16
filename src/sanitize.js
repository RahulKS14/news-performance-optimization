/**
 * Sanitizes input text against XSS before storing in component state:
 * - Strips all HTML tags (<tag ...>, </tag>)
 * - Strips any remaining '<' and '>' characters
 * - Strips backtick '`' characters
 * - Strips 'javascript:' pseudo-protocol (case-insensitive)
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/javascript\s*:/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/`/g, '');
}
