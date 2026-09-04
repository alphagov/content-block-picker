import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EmbedCodeHighlight } from "./embed-code-highlight";
import { APIClient } from "./api-client";
import { EmbedCodePreview } from "../@types";

describe("EmbedCodeHighlight", () => {
  const mockApiClient = new APIClient("https://example.com");
  let overlay = document.createElement("div");
  let embedCodeHighlight = new EmbedCodeHighlight(overlay, mockApiClient);
  const mockEmbedCode1 = "{{embed:content_block_contact:example}}";
  const mockEmbedCode2 = "{{embed:content_block_contact:bad}}";

  const textWithEmbedCodes = `
This is some text.
${mockEmbedCode1}
Something else ${mockEmbedCode2} here too.`;

  const mockEmbedCodePreview: EmbedCodePreview = {
    html: "<div>Preview content</div>",
    valid: true,
    error: null,
  };
  const mockEmbedCodeInvalidPreview: EmbedCodePreview = {
    html: null,
    valid: false,
    error: new Error("Invalid embed code"),
  };

  beforeEach(() => {
    overlay = document.createElement("div");
    embedCodeHighlight = new EmbedCodeHighlight(overlay, mockApiClient);
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

  describe("embedCodeMatches", () => {
    it("should return one RegExpExecArray for each embed code in the document", () => {
      const matches = embedCodeHighlight.embedCodeMatches(textWithEmbedCodes);

      expect(matches.length).toBe(2);

      const [match1, match2] = matches;

      expect(match1[0]).toBe(mockEmbedCode1);
      expect(match1.index).toBeDefined();
      expect(match1.input).toBeDefined();

      expect(match2[0]).toBe(mockEmbedCode2);
      expect(match2.index).toBeDefined();
      expect(match2.input).toBeDefined();
    });
  });

  describe("highlightEmbedCodeValidity", () => {
    it("should highlight valid embed codes in the document", () => {
      const text = `${mockEmbedCode1}`;
      const matches = embedCodeHighlight.embedCodeMatches(text);
      const previews = [mockEmbedCodePreview];

      embedCodeHighlight.highlightEmbedCodeValidity(text, matches, previews);

      expect(embedCodeHighlight["overlay"].innerHTML).toContain(
        '<mark class="content-block-highlight__mark">',
      );
    });

    it("should highlight invalid embed codes in the document", () => {
      const text = `${mockEmbedCode1}`;
      const matches = embedCodeHighlight.embedCodeMatches(text);
      const previews = [mockEmbedCodeInvalidPreview];

      embedCodeHighlight.highlightEmbedCodeValidity(text, matches, previews);

      expect(embedCodeHighlight["overlay"].innerHTML).toContain(
        '<mark class="content-block-highlight__mark--invalid">',
      );
    });
  });

  describe("update", () => {
    it("should sanitise the input text before processing", async () => {
      const mockHighlightAllEmbedCodes = vi.spyOn(
        embedCodeHighlight,
        "highlightAllEmbedCodes",
      );
      vi.spyOn(mockApiClient, "fetchPreview").mockResolvedValue(
        mockEmbedCodePreview,
      );

      const unsanitizedText = `<div>${mockEmbedCode1}</div>`;
      const sanitizedText =
        "&lt;div&gt;{{embed:content_block_contact:example}}&lt;/div&gt;";

      await embedCodeHighlight.update(unsanitizedText);

      expect(mockHighlightAllEmbedCodes).toHaveBeenCalledWith(sanitizedText);
    });

    it("should highlight all embed codes immediately, without waiting for API responses", () => {
      vi.spyOn(mockApiClient, "fetchPreview").mockResolvedValue(
        mockEmbedCodePreview,
      );
      embedCodeHighlight.update(`${mockEmbedCode1}`); // no await

      expect(embedCodeHighlight["overlay"].innerHTML).toBe(
        `<mark class="content-block-highlight__mark">{{embed:content_block_contact:example}}</mark>`,
      );
    });

    it("should return early when no embed codes are found", async () => {
      const mockHighlightInvalidEmbedCodes = vi.spyOn(
        embedCodeHighlight,
        "highlightEmbedCodeValidity",
      );
      await embedCodeHighlight.update("This text has no embed codes.");

      expect(mockHighlightInvalidEmbedCodes).not.toHaveBeenCalled();
    });

    it("should highlight invalid embed codes", async () => {
      vi.spyOn(mockApiClient, "fetchPreview")
        .mockResolvedValueOnce(mockEmbedCodePreview)
        .mockResolvedValueOnce(mockEmbedCodeInvalidPreview);

      await embedCodeHighlight.update(`
Valid:   ${mockEmbedCode1}
Invalid: {{embed:content_block_contact:bad}}`);

      expect(overlay.innerHTML).toBe(`
Valid:   <mark class="content-block-highlight__mark">{{embed:content_block_contact:example}}</mark>
Invalid: <mark class="content-block-highlight__mark--invalid">{{embed:content_block_contact:bad}}</mark>`);
    });
  });
});
