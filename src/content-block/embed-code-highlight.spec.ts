import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EmbedCodeHighlight } from "./embed-code-highlight";

describe("EmbedCodeHighlight", () => {
  let overlay = document.createElement("div");
  let embedCodeHighlight = new EmbedCodeHighlight(overlay);
  const mockEmbedCode1 = "{{embed:content_block_contact:example}}";
  const mockEmbedCode2 = "{{embed:content_block_contact:bad}}";

  const textWithEmbedCodes = `
This is some text.
${mockEmbedCode1}
Something else ${mockEmbedCode2} here too.`;

  beforeEach(() => {
    overlay = document.createElement("div");
    embedCodeHighlight = new EmbedCodeHighlight(overlay);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("highlightAllEmbedCodes", () => {
    it("should highlight all embed codes in the document", async () => {
      overlay.innerHTML = textWithEmbedCodes;
      embedCodeHighlight.highlightAllEmbedCodes(textWithEmbedCodes);

      expect(overlay.innerHTML).toBe(`
This is some text.
<mark class="content-block-highlight__mark">{{embed:content_block_contact:example}}</mark>
Something else <mark class="content-block-highlight__mark">{{embed:content_block_contact:bad}}</mark> here too.`);
    });
  });

  describe("update", () => {
    it("should sanitise the input text before processing", async () => {
      const mockHighlightAllEmbedCodes = vi.spyOn(
        embedCodeHighlight,
        "highlightAllEmbedCodes",
      );

      const unsanitizedText = `<div>${mockEmbedCode1}</div>`;
      const sanitizedText =
        "&lt;div&gt;{{embed:content_block_contact:example}}&lt;/div&gt;";

      await embedCodeHighlight.update(unsanitizedText);

      expect(mockHighlightAllEmbedCodes).toHaveBeenCalledWith(sanitizedText);
    });

    it("should highlight all embed codes immediately, without waiting for API responses", () => {
      embedCodeHighlight.update(`${mockEmbedCode1}`); // no await

      expect(embedCodeHighlight["overlay"].innerHTML).toBe(
        `<mark class="content-block-highlight__mark">{{embed:content_block_contact:example}}</mark>`,
      );
    });
  });
});
