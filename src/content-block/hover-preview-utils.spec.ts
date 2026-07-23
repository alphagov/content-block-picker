import { describe, test, expect, beforeEach, vi } from "vitest";
import {
  createHoverPreviewElement,
  makePreviewContent,
  sanitizeHtml,
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

describe("sanitizeHtml", () => {
  test("allows whitelisted HTML tags", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    const result = sanitizeHtml(html, "embedcode");
    expect(result).toBe("<p>Hello <strong>world</strong></p>");
  });

  test("removes disallowed tags but keeps their content", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = "<div>Safe <section>wrapped text</section> content</div>";
    const result = sanitizeHtml(html, "embedcode");

    expect(result).toBe("<div>Safe wrapped text content</div>");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("disallowed HTML tags"),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("section"));

    warnSpy.mockRestore();
  });

  test("removes multiple different disallowed tags", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html =
      "<div><section>text1</section><p>Good</p><article>text2</article></div>";
    const result = sanitizeHtml(html, "embedcode");

    expect(result).toBe("<div>text1<p>Good</p>text2</div>");
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("section, article"),
    );

    warnSpy.mockRestore();
  });

  test("preserves href attribute on anchor tags", () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(html, "embedcode");
    expect(result).toBe('<a href="https://example.com">Link</a>');
  });

  test("removes other attributes for security", () => {
    const html = '<p class="test" onclick="alert()">Text</p>';
    const result = sanitizeHtml(html, "embedcode");
    expect(result).toBe("<p>Text</p>");
    expect(result).not.toContain("class");
    expect(result).not.toContain("onclick");
  });

  test("allows all whitelisted tags", () => {
    const html = `
      <a href="#">link</a>
      <abbr>abbr</abbr>
      <blockquote>quote</blockquote>
      <br>
      <code>code</code>
      <div>div</div>
      <em>em</em>
      <h1>h1</h1>
      <h2>h2</h2>
      <h3>h3</h3>
      <h4>h4</h4>
      <h5>h5</h5>
      <h6>h6</h6>
      <dl><dt>term</dt><dd>definition</dd></dl>
      <hr>
      <ol><li>item</li></ol>
      <p>p</p>
      <pre>pre</pre>
      <span>span</span>
      <strong>strong</strong>
      <sub>sub</sub>
      <sup>sup</sup>
      <table>
        <thead><tr><th>header</th></tr></thead>
        <tbody><tr><td>cell</td></tr></tbody>
        <tfoot><tr><td>footer</td></tr></tfoot>
      </table>
      <ul><li>item</li></ul>
    `;

    const result = sanitizeHtml(html, "embedcode");

    // Check that all allowed tags are present
    expect(result).toContain('<a href="#">');
    expect(result).toContain("<abbr>");
    expect(result).toContain("<blockquote>");
    expect(result).toContain("<br>");
    expect(result).toContain("<dl>");
    expect(result).toContain("<dd>");
    expect(result).toContain("<dt>");
    expect(result).toContain("<code>");
    expect(result).toContain("<div>");
    expect(result).toContain("<em>");
    expect(result).toContain("<h1>");
    expect(result).toContain("<h2>");
    expect(result).toContain("<h3>");
    expect(result).toContain("<h4>");
    expect(result).toContain("<h5>");
    expect(result).toContain("<h6>");
    expect(result).toContain("<hr>");
    expect(result).toContain("<li>");
    expect(result).toContain("<ol>");
    expect(result).toContain("<p>");
    expect(result).toContain("<pre>");
    expect(result).toContain("<span>");
    expect(result).toContain("<strong>");
    expect(result).toContain("<sub>");
    expect(result).toContain("<sup>");
    expect(result).toContain("<table>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("<td>");
    expect(result).toContain("<tfoot>");
    expect(result).toContain("<th>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tr>");
    expect(result).toContain("<ul>");
  });

  test("handles nested disallowed tags", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = "<div><article>content</article><p>Good</p></div>";
    const result = sanitizeHtml(html, "embedcode");

    expect(result).toBe("<div>content<p>Good</p></div>");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("article"));

    warnSpy.mockRestore();
  });

  test("does not warn when no disallowed tags are present", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = "<p>All <strong>safe</strong> content</p>";
    sanitizeHtml(html, "embedcode");

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe("makePreviewContent", () => {
  test("sanitizes the provided HTML", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const html = "<p>Safe</p><section>wrapped</section>";
    const result = makePreviewContent(html, "embedcode");

    expect(result).toBe("<p>Safe</p>wrapped");
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  test("returns sanitized HTML unchanged if already safe", () => {
    const html = "<div><p>Safe content</p><strong>Bold</strong></div>";
    const result = makePreviewContent(html, "embedcode");
    expect(result).toBe(html);
  });
});
