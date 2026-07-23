import { describe, test, expect, beforeEach } from "vitest";
import {
  createHoverPreviewElement,
  makePreviewContent,
} from "./hover-preview-utils";

describe("createHoverPreviewElement", () => {
  let preview: HTMLDivElement;

  beforeEach(() => {
    preview = createHoverPreviewElement();
  });

  test("returns a div element", () => {
    expect(preview.tagName).toBe("DIV");
  });

  test("applies the expected class name", () => {
    expect(preview.className).toBe("content-block-highlight__preview");
  });

  test("is initially hidden", () => {
    expect(preview.hidden).toBe(true);
  });

  test("has aria-hidden set to true", () => {
    expect(preview.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("makePreviewContent", () => {
  test("returns the provided HTML unchanged", () => {
    const html = "<p>Preview block</p>";
    const result = makePreviewContent(html);
    expect(result).toBe(html);
  });

  test("does not modify complex HTML", () => {
    const html = '<div class="test"><span>Content</span></div>';
    const result = makePreviewContent(html);
    expect(result).toBe(html);
  });
});
