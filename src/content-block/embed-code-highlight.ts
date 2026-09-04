import embedRegex from "./regex.ts";
import nunjucksEnv from "../nunjucks-env.ts";
import markTemplate from "../templates/mark.njk?raw";

export class EmbedCodeHighlight {
  constructor(
    private overlay: HTMLElement,
  ) {}

  async update(text: string) {
    const sanitisedText = this.sanitiseText(text);
    this.highlightAllEmbedCodes(sanitisedText);
  }

  highlightAllEmbedCodes(text: string) {
    this.overlay.innerHTML = text.replace(embedRegex, (embedCode) =>
      this.createMark(embedCode),
    );
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
}
