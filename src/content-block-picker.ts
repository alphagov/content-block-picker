import "../scss/base.scss";
import embedRegex, { formatSpecifierRegex } from "./content-block/regex.ts";
import {
  createHoverPreviewElement,
  makePreviewContent,
} from "./content-block/hover-preview-utils.ts";
import { APIClient } from "./content-block/api-client.ts";
import type { ContentBlock, EmbedCodePreview } from "./@types";
import nunjucksEnv from "./nunjucks-env.ts";
import blockListTemplate from "./templates/block-list.njk?raw";
import { EmbedCodeHighlight } from "./content-block/embed-code-highlight.ts";

export interface ContentBlockPickerOptions {
  baseUrl: string;
  embedPreviewDelayMs?: number;
}

export class ContentBlockPicker {
  readonly embedPreviewDelayMs: number;
  textarea: HTMLTextAreaElement;
  wrapper: HTMLDivElement;
  highlight: HTMLDivElement;
  preview: HTMLDivElement;
  apiClient: APIClient;
  hoverPreviewTimeoutId?: number;
  activeHoverEmbedCode: string | null = null;
  currentMarkUnderCursor: HTMLElement | null = null;
  blockListElement: HTMLDivElement | null = null;
  blockListRequest?: Promise<ContentBlock[]>;
  embedCodeHighlight: EmbedCodeHighlight;

  constructor(element: Element, options: ContentBlockPickerOptions) {
    this.embedPreviewDelayMs = options.embedPreviewDelayMs ?? 200;
    this.textarea = this.initializeModule(element);
    this.wrapper = this.createWrapper();
    this.highlight = this.createHighlight();

    this.preview = createHoverPreviewElement();
    this.wrapper.appendChild(this.preview);

    const baseUrl = options.baseUrl;
    this.apiClient = new APIClient(baseUrl);

    this.textarea.classList.add("content-block-highlight__input");

    this.embedCodeHighlight = new EmbedCodeHighlight(
      this.highlight,
      this.apiClient,
    );
    this.embedCodeHighlight.update(this.textarea.value);

    this.textarea.addEventListener("input", () => {
      this.embedCodeHighlight.update(this.textarea.value);
    });

    this.textarea.addEventListener("scroll", () => {
      this.syncScroll();
      this.onTextareaMouseLeave();
    });
    this.textarea.addEventListener(
      "mousemove",
      (event) => void this.onTextareaMouseMove(event),
    );
    this.textarea.addEventListener("mouseleave", () =>
      this.onTextareaMouseLeave(),
    );
    if (this.textarea.dataset.cbpInsertBlockButton) {
      this.blockListElement = this.createBlockListElement();
      this.attachInsertBlockButtonListener(this.blockListElement);
      this.attachBlockListHideListeners(this.blockListElement);
    }

    // checks for changes to the dimensions of the textarea, and syncs the scroll position of the highlight accordingly
    // see docs: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => this.syncScroll()).observe(this.textarea);
    }
  }

  syncScroll() {
    this.highlight.scrollTop = this.textarea.scrollTop;
    this.highlight.scrollLeft = this.textarea.scrollLeft;
  }

  initializeModule(element: Element): HTMLTextAreaElement {
    if (element instanceof HTMLTextAreaElement) {
      return element as HTMLTextAreaElement;
    } else {
      throw new Error(`The module ${element.outerHTML} is not a textarea`);
    }
  }

  createWrapper(): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "content-block-highlight__wrapper";

    this.textarea.parentNode!.insertBefore(wrapper, this.textarea);
    wrapper.appendChild(this.textarea);

    return wrapper;
  }

  createHighlight(): HTMLDivElement {
    const highlight = document.createElement("div");
    highlight.className = "govuk-textarea content-block-highlight__highlight";

    highlight.setAttribute("aria-hidden", "true");

    this.wrapper.appendChild(highlight);

    return highlight;
  }

  createBlockListElement(): HTMLDivElement {
    const blockListPlaceholder = document.createElement("div");
    blockListPlaceholder.className = "content-block-highlight__block-list";
    blockListPlaceholder.hidden = true;
    blockListPlaceholder.setAttribute("role", "dialog");
    blockListPlaceholder.setAttribute("aria-hidden", "true");
    blockListPlaceholder.setAttribute("aria-label", "Insert content block");

    document.body.appendChild(blockListPlaceholder);

    return blockListPlaceholder;
  }

  attachInsertBlockButtonListener(blockListElement: HTMLDivElement) {
    const buttonId = this.textarea.dataset.cbpInsertBlockButton;
    if (!buttonId) return;

    const button = document.getElementById(buttonId);
    if (!(button instanceof HTMLButtonElement)) return;

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (blockListElement) {
        this.showBlockListElement(button, blockListElement);
      }
    });
  }

  attachBlockListHideListeners(blockListElement: HTMLDivElement) {
    blockListElement.addEventListener("click", () => {
      this.hideElement(blockListElement);
    });

    document.addEventListener("click", (event) => {
      if (blockListElement.hidden) return;
      if (!(event.target instanceof Node)) return;
      if (blockListElement.contains(event.target)) return;

      this.hideElement(blockListElement);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.hideElement(blockListElement as HTMLElement);
    });
  }

  showBlockListElement(
    button: HTMLButtonElement,
    blockListElement: HTMLDivElement,
  ) {
    const buttonRect = button.getBoundingClientRect();
    const topMargin = 8;
    blockListElement.style.top = `${buttonRect.bottom + window.scrollY + topMargin}px`;
    blockListElement.style.left = `${buttonRect.left + window.scrollX}px`;
    blockListElement.replaceChildren(
      document.createTextNode("Fetching blocks..."),
    );
    this.showElement(blockListElement);
    void this.fetchAndRenderBlockList();
  }

  showElement(blockListElement: HTMLElement) {
    blockListElement.hidden = false;
    blockListElement.setAttribute("aria-hidden", "false");
  }

  hideElement(blockListElement: HTMLElement) {
    blockListElement.hidden = true;
    blockListElement.setAttribute("aria-hidden", "true");
  }

  private renderBlockListErrorState() {
    this.blockListElement?.replaceChildren(
      document.createTextNode("Unable to load blocks."),
    );
  }

  insertEmbedCode(embedCode: string) {
    const selectionStart = this.textarea.selectionStart ?? 0;
    const selectionEnd = this.textarea.selectionEnd ?? 0;
    const currentValue = this.textarea.value;

    const { insertPosition, textEndPosition } =
      this.adjustInsertPositionIfSelectionOverlapsEmbedCode(
        selectionStart,
        selectionEnd,
        currentValue,
      );

    this.textarea.value =
      currentValue.slice(0, insertPosition) +
      embedCode +
      currentValue.slice(textEndPosition);

    const newCursorPosition = insertPosition + embedCode.length;
    this.textarea.selectionStart = newCursorPosition;
    this.textarea.selectionEnd = newCursorPosition;

    this.textarea.dispatchEvent(new Event("input"));
  }

  private adjustInsertPositionIfSelectionOverlapsEmbedCode(
    selectionStart: number,
    selectionEnd: number,
    currentValue: string,
  ): { insertPosition: number; textEndPosition: number } {
    const embedCodeMatches = currentValue.matchAll(embedRegex);
    let rightmostOverlapEnd = -1;

    for (const match of embedCodeMatches) {
      const matchStart = match.index!;
      const matchEnd = match.index! + match[0].length;

      // Check if selection overlaps with this embed code
      const startOverlaps =
        selectionStart >= matchStart && selectionStart < matchEnd;
      const endOverlaps = selectionEnd > matchStart && selectionEnd <= matchEnd;
      const fullyContains =
        selectionStart < matchStart && selectionEnd > matchEnd;

      if (startOverlaps || endOverlaps || fullyContains) {
        rightmostOverlapEnd = Math.max(rightmostOverlapEnd, matchEnd);
      }
    }

    if (rightmostOverlapEnd !== -1) {
      return {
        insertPosition: rightmostOverlapEnd,
        textEndPosition: Math.max(selectionEnd, rightmostOverlapEnd),
      };
    }

    return {
      insertPosition: selectionStart,
      textEndPosition: selectionEnd,
    };
  }

  private renderBlockList(blocks: ContentBlock[]) {
    if (!this.blockListElement) return;

    this.blockListElement.innerHTML = nunjucksEnv.renderString(
      blockListTemplate,
      {
        blocks,
      },
    );

    const buttons = this.blockListElement.querySelectorAll<HTMLButtonElement>(
      "button.cbp-insert-button",
    );
    buttons.forEach((button) => {
      const embedCode = button.dataset.embedCode;
      if (embedCode) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.insertEmbedCode(embedCode);
          this.textarea.focus();
        });
      }
    });
  }

  private async fetchAndRenderBlockList() {
    if (this.blockListRequest) {
      return;
    }

    try {
      this.blockListRequest = this.apiClient.fetchAllBlocks();

      const blocks = await this.blockListRequest;
      this.renderBlockList(blocks);
    } catch (error) {
      console.error(error);
      this.renderBlockListErrorState();
    } finally {
      if (this.blockListRequest === this.blockListRequest) {
        this.blockListRequest = undefined;
      }
    }
  }

  async onTextareaMouseMove(event: MouseEvent) {
    const mark = this.getMarkUnderCursor(event);
    if (mark === this.currentMarkUnderCursor) return;

    const previousMark = this.currentMarkUnderCursor;
    this.currentMarkUnderCursor = mark;

    if (previousMark) {
      this.onMarkLeave();
    }
    if (mark) {
      this.onMarkEnter(mark);
    }
  }

  onTextareaMouseLeave() {
    this.currentMarkUnderCursor = null;
    this.onMarkLeave();
  }

  getMarkUnderCursor(event: MouseEvent): HTMLElement | null {
    const previousPointerEvents = this.textarea.style.pointerEvents;
    this.textarea.style.pointerEvents = "none";
    const el = document.elementFromPoint(event.clientX, event.clientY);
    this.textarea.style.pointerEvents = previousPointerEvents;
    if (!(el instanceof Element)) return null;
    const mark = el.closest(".content-block-highlight__mark");
    return mark instanceof HTMLElement ? mark : null;
  }

  onMarkEnter(mark: HTMLElement) {
    const embedCode = mark.textContent?.trim();
    if (!embedCode) return;

    const cachedPreview = this.apiClient.getPreview(embedCode);
    if (!cachedPreview) return;

    this.activeHoverEmbedCode = embedCode;
    this.clearHoverTimer();

    this.hoverPreviewTimeoutId = window.setTimeout(() => {
      this.renderHoverPreview(mark, embedCode, cachedPreview);
    }, this.embedPreviewDelayMs);
  }

  onMarkLeave() {
    this.activeHoverEmbedCode = null;
    this.clearHoverTimer();
    this.hideHoverPreview();
  }

  private async renderHoverPreview(
    mark: HTMLElement,
    embedCode: string,
    preview: EmbedCodePreview,
  ) {
    try {
      if (this.activeHoverEmbedCode !== embedCode || !preview.html) return;

      const block = this.apiClient.getBlock(
        embedCode.replace(formatSpecifierRegex, ""),
      );
      if (!block) return;

      this.preview.innerHTML = makePreviewContent(preview.html, block);
      this.positionHoverPreview(mark);
      this.showElement(this.preview);
    } catch (error) {
      console.error(error);
      this.hideHoverPreview();
    }
  }

  private positionHoverPreview(mark: HTMLElement) {
    const markRect = mark.getBoundingClientRect();
    const wrapperRect = this.wrapper.getBoundingClientRect();

    const top = markRect.bottom - wrapperRect.top + 8;
    const left = markRect.left - wrapperRect.left;

    this.preview.style.position = "absolute";
    this.preview.style.top = `${top}px`;
    this.preview.style.left = `${left}px`;
  }

  private hideHoverPreview() {
    this.preview.hidden = true;
    this.preview.setAttribute("aria-hidden", "true");
    this.preview.innerHTML = "";
  }

  private clearHoverTimer() {
    if (this.hoverPreviewTimeoutId !== undefined) {
      window.clearTimeout(this.hoverPreviewTimeoutId);
      this.hoverPreviewTimeoutId = undefined;
    }
  }

  static initAll(
    options: ContentBlockPickerOptions,
    scope: ParentNode = document,
  ): ContentBlockPicker[] {
    const elements = scope.querySelectorAll(
      '[data-module~="content-block-highlight"]',
    );

    return Array.from(elements).map(
      (element) => new ContentBlockPicker(element, options),
    );
  }
}
