import embedRegex from "./regex.ts";
import { EmbedCodePreview } from "../@types";
import { APIClient } from "./api-client.ts";
import nunjucksEnv from "../nunjucks-env.ts";
import markTemplate from "../templates/mark.njk?raw";

export class EmbedCodeHighlight {
  private updateHighlightId: number = 0;

  constructor(
    private overlay: HTMLElement,
    private apiClient: APIClient,
  ) {}

  async update(text: string) {
    const sanitisedText = this.sanitiseText(text);
    this.highlightAllEmbedCodes(sanitisedText);

    const embedCodeMatches = this.embedCodeMatches(sanitisedText);
    if (embedCodeMatches.length === 0) return;

    const previews = await this.fetchEmbedCodeValidity(embedCodeMatches);
    if (previews.length === 0) return;

    this.highlightEmbedCodeValidity(sanitisedText, embedCodeMatches, previews);
  }

  highlightAllEmbedCodes(text: string) {
    this.overlay.innerHTML = text.replace(embedRegex, (embedCode) =>
      this.createMark(embedCode),
    );
  }

  highlightEmbedCodeValidity(
    text: string,
    embedCodeMatches: RegExpExecArray[],
    previews: EmbedCodePreview[],
  ) {
    let result = "";
    let lastIndex = 0;

    embedCodeMatches.forEach((match, index) => {
      const preview = previews[index];
      const matchingText = match[0];
      const matchStart = match.index;
      const matchEnd = matchStart + matchingText.length;

      result += text.slice(lastIndex, matchStart);
      result += this.createMark(matchingText, preview.valid);

      lastIndex = matchEnd;
    });

    result += text.slice(lastIndex);

    this.overlay.innerHTML = result;
  }

  embedCodeMatches(text: string) {
    return Array.from(text.matchAll(embedRegex));
  }

  private sanitiseText(text: string) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  private createMark(text: string, valid: boolean = true) {
    const modifier = valid ? "" : "--invalid";
    return nunjucksEnv.renderString(markTemplate, { modifier, text }).trim();
  }

  private async fetchEmbedCodeValidity(
    embedCodeMatches: RegExpMatchArray[],
  ): Promise<EmbedCodePreview[]> {
    try {
      const previews = await this.abortIfStale<EmbedCodePreview[]>(() =>
        Promise.all(
          embedCodeMatches.map((match) =>
            this.apiClient.fetchPreview(match[0]),
          ),
        ),
      );
      return previews;
    } catch (e) {
      return Promise.resolve([]);
    }
  }

  private async abortIfStale<T>(asyncFn: Function): Promise<T> {
    const currentUpdateId = ++this.updateHighlightId;

    const result = await asyncFn();

    if (currentUpdateId !== this.updateHighlightId) {
      throw new StaleRequestError(
        "This request has been superseded by another request",
      );
    }

    return result;
  }
}

class StaleRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleRequestError";
  }
}
