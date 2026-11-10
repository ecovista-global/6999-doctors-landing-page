/**
 * HTML Sanitizer & Content Processing Engine
 * Protects against XSS attacks (Rule R9 per SD-048 / ISO 27001 § A.8.28)
 * Strips dangerous executable tags, event listeners, and unauthorized protocols.
 */

const DANGEROUS_TAGS_REGEX = /<\/?(script|iframe|object|embed|form|input|button|style|link|meta|applet|base)\b[^>]*>/gi;
const DANGEROUS_ATTRIBUTES_REGEX = /\s*(on\w+|formaction|action)\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOLS_REGEX = /(href|src)\s*=\s*(['"]?)\s*(?:javascript|vbscript|data:\s*text\/html):/gi;

/**
 * Strips malicious XSS vectors while preserving legitimate clinical rich text formatting,
 * including headings, lists, quotes, medical callouts, tables, and sanitized links.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // 1. Strip all script tags and their inner contents entirely
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Strip all style tags and their contents
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // 3. Strip dangerous tags (iframes, objects, embeds, forms, buttons)
  sanitized = sanitized.replace(DANGEROUS_TAGS_REGEX, '');

  // 4. Strip dangerous inline event attributes (onload, onerror, onclick, etc.)
  sanitized = sanitized.replace(DANGEROUS_ATTRIBUTES_REGEX, '');

  // 5. Strip javascript: and vbscript: protocols from href/src
  sanitized = sanitized.replace(JAVASCRIPT_PROTOCOLS_REGEX, '$1=$2#blocked:');

  // 6. Ensure links open safely with noopener noreferrer
  sanitized = sanitized.replace(/<a\s+(?![^>]*\brel=)([^>]+)>/gi, '<a rel="noopener noreferrer" $1>');

  return sanitized.trim();
}

/**
 * Extracts plain text from an HTML string for word count, search indexing, and excerpts.
 */
export function extractPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates an SEO and URL-safe slug from a post title.
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Calculates estimated reading time based on standard 200 words-per-minute clinical reader pace.
 */
export function calculateReadTime(content: string): string {
  const plainText = extractPlainText(content);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

