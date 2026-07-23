import DOMPurify from "dompurify";
import config from "../config.ts";

export const sanitizeHtml = (html: string, embedcode: string): string => {
  const deniedTags = new Set<string>();

  DOMPurify.addHook("uponSanitizeElement", (_node, data) => {
    if (data.allowedTags[data.tagName] === undefined && data.tagName) {
      if (data.tagName !== "body" && data.tagName !== "html") {
        deniedTags.add(data.tagName);
      }
    }
  });

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: config.allowedHtmlTags,
    ALLOWED_ATTR: config.allowedHtmlAttributes,
    KEEP_CONTENT: true,
  });

  // Remove the hook after sanitization
  DOMPurify.removeAllHooks();

  if (deniedTags.size > 0) {
    console.warn(
      `Preview for ${embedcode} contained disallowed HTML tags which were removed: ${Array.from(deniedTags).join(", ")}`,
    );
  }

  return sanitized;
};

export const createHoverPreviewElement = (): HTMLDivElement => {
  const div = document.createElement("div");
  div.className = "content-block-highlight__preview";
  div.hidden = true;
  div.setAttribute("aria-hidden", "true");
  return div;
};

export const makePreviewContent = (html: string, embedcode: string): string => {
  return sanitizeHtml(html, embedcode);
};
