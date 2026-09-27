/**
 * ============================================================================
 * UNTRUSTED EXTERNAL DATA BOUNDARY: JOB DESCRIPTION SANITIZATION
 * ============================================================================
 * External job descriptions originating from public APIs (Remotive, RemoteOK,
 * Jobicy, Arbeitnow, etc.) are UNTRUSTED EXTERNAL DATA.
 *
 * Risks mitigated here:
 * 1. Stored XSS / DOM Injection: Stripping <script>, <iframe>, <style>, and inline on* handlers.
 * 2. Visual Destruction: Eliminating broken HTML tags and weird nested layout containers.
 * 3. Prompt Injection Shielding: Preparing clean, passive textual content before sending to LLM.
 */

const DANGEROUS_TAGS_REGEX =
  /<(?:script|style|iframe|object|embed|applet|form|button|input|select|textarea|svg)[\s\S]*?>[\s\S]*?<\/(?:script|style|iframe|object|embed|applet|form|button|input|select|textarea|svg)>/gi;

const SELF_CLOSING_DANGEROUS_TAGS =
  /<(?:script|style|iframe|object|embed|applet|input|button|link|meta)[\s\S]*?\/?>/gi;

const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;

const INLINE_HANDLER_REGEX = /\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

const JAVASCRIPT_PROTOCOL_REGEX =
  /(?:href|src)\s*=\s*(['"]?)\s*javascript:[^'"]*\1/gi;

/**
 * Sanitizes external HTML or raw rich text into clean, safe, human-readable text.
 * Converts common block elements (<p>, <br>, <li>, <h1>-<h6>) into clean whitespace
 * and completely strips all executable markup and dangerous attributes.
 */
export function sanitizeJobDescription(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  let text = rawHtml;

  // 1. Remove dangerous executable/embed elements and their inner content
  text = text.replace(DANGEROUS_TAGS_REGEX, "");
  text = text.replace(SELF_CLOSING_DANGEROUS_TAGS, "");

  // 2. Remove HTML comments
  text = text.replace(HTML_COMMENT_REGEX, "");

  // 3. Remove inline JavaScript handlers and javascript: URI references
  text = text.replace(INLINE_HANDLER_REGEX, "");
  text = text.replace(JAVASCRIPT_PROTOCOL_REGEX, "");

  // 4. Normalize structural HTML tags to legible linebreaks
  text = text.replace(/<(?:br|\/p|\/li|\/tr|\/h[1-6]|\/div)>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "• ");

  // 5. Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // 6. Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");

  // 7. Normalize redundant whitespace and linebreaks (max 2 consecutive newlines)
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

  return text;
}
