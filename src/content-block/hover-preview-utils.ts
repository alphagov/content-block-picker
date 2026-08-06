import DOMPurify, { UponSanitizeElementHookEvent } from "dompurify";
import config from "../config.ts";
import { ContentBlock } from "../@types";
import env from "../nunjucks-env.ts";
import blockListTemplate from "../templates/hover-preview.njk?raw";

export const sanitizeHtml = (html: string, embedcode: string): string => {
  const deniedTags = new Set<string>();

  const hook = (_node: Node, data: UponSanitizeElementHookEvent) => {
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

  try {
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: config.allowedHtmlTags,
      ALLOWED_ATTR: config.allowedHtmlAttributes,
      KEEP_CONTENT: true,
    }) as string;

    if (deniedTags.size > 0) {
      console.warn(
        `Preview for ${embedcode} contained disallowed HTML tags which were removed: ${Array.from(deniedTags).join(", ")}`,
      );
    }

    return sanitized;
  } finally {
    DOMPurify.removeHook("uponSanitizeElement");
  }
};

export const createHoverPreviewElement = (): HTMLDivElement => {
  const div = document.createElement("div");
  div.className = "content-block-highlight__preview";
  div.hidden = true;
  div.setAttribute("aria-hidden", "true");
  return div;
};

export const makePreviewContent = (
  html: string,
  blockData: ContentBlock,
): string => {
  return env.renderString(blockListTemplate, {
    html: sanitizeHtml(html, blockData.embed_code),
    blockData,
  });
};
