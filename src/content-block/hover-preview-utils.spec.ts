import { describe, test, expect, beforeEach } from "vitest";
import {
  createHoverPreviewElement,
  makeIframePayload,
} from "./hover-preview-utils";

describe("createHoverPreviewElement", () => {
  let preview: HTMLIFrameElement;

  beforeEach(() => {
    preview = createHoverPreviewElement();
  });

  test("returns an iframe element", () => {
    expect(preview.tagName).toBe("IFRAME");
  });

  test("applies the expected class name", () => {
    expect(preview.className).toBe("content-block-highlight__preview-frame");
  });

  test("sets the sandbox attribute to allow scripts", () => {
    expect(preview.getAttribute("sandbox")).toBe("allow-scripts");
  });

  test("applies the expected inline styles", () => {
    expect(preview.style.width).toBe("300px");
    expect(preview.style.height).toBe("0px");
    expect(preview.style.borderStyle).toBe("none");
    expect(preview.style.pointerEvents).toBe("none");
  });
});

describe("makeIframePayload", () => {
  test("injects the provided HTML inside the preview content container", () => {
    const html = "<p>Preview block</p>";

    const payload = makeIframePayload(html);

    expect(payload).toContain(`<div id="preview-content">${html}</div>`);
  });

  test("includes the script that posts resize messages", () => {
    const payload = makeIframePayload("<span>Example</span>");

    expect(payload).toContain("type: 'resize-preview'");
    expect(payload).toContain("window.parent.postMessage");
    expect(payload).toContain(
      "window.addEventListener('load', updateDimensions)",
    );
    expect(payload).toContain("ResizeObserver");
  });

  test("returns a complete html document string", () => {
    const payload = makeIframePayload("<strong>Hi</strong>");

    expect(payload).toContain("<!DOCTYPE html>");
    expect(payload).toContain("<html>");
    expect(payload).toContain("<head>");
    expect(payload).toContain("<body>");
    expect(payload).toContain("</html>");
  });
});
