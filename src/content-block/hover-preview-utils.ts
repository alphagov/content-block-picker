import DOMPurify from "dompurify";
import config from "../config.ts";

export const sanitizeHtml = (html: string, embedcode: string): string => {
  const deniedTags = new Set<string>();

  const hook = (_node, data) => {
    const tagName =
      typeof data.tagName === "string"
        ? data.tagName.toLowerCase()
        : data.tagName;

    if (tagName && data.allowedTags[tagName] === undefined) {
      if (tagName !== "body" && tagName !== "html") {
        deniedTags.add(tagName);
      }
    }
  };

  DOMPurify.addHook("uponSanitizeElement", hook);

  let sanitized: string;
  try {
    sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: config.allowedHtmlTags,
      ALLOWED_ATTR: config.allowedHtmlAttributes,
      KEEP_CONTENT: true,
    }) as string;
  } finally {
    DOMPurify.removeHook("uponSanitizeElement", hook);
  }

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
