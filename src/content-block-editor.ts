import "../scss/base.scss";
import embedRegex from "./content-block/regex.ts";
import {
  createHoverPreviewElement,
  makeIframePayload,
} from "./content-block/hover-preview-utils.ts";
import { APIClient } from "./content-block/api-client.ts";
import type { BlockSearchResult } from "./@types/block";

export interface ContentBlockEditorOptions {
  baseUrl: string;
  embedPreviewDelayMs?: number;
}

export class ContentBlockEditor {
  readonly embedPreviewDelayMs: number;
  textarea: HTMLTextAreaElement;
  wrapper: HTMLDivElement;
  highlight: HTMLDivElement;
  preview: HTMLIFrameElement;
  blockListOverlay: HTMLDivElement;
  apiClient: APIClient;
  blocks: BlockSearchResult[] = [];
  hoverPreviewTimeoutId?: number;
  activeHoverEmbedCode: string | null = null;
  currentMarkUnderCursor: HTMLElement | null = null;

  constructor(element: Element, options: ContentBlockEditorOptions) {
    this.embedPreviewDelayMs = options.embedPreviewDelayMs ?? 200;
    this.textarea = this.initializeModule(element);
    this.wrapper = this.createWrapper();
    this.highlight = this.createHighlight();

    this.preview = createHoverPreviewElement();
    this.wrapper.appendChild(this.preview);

    this.blockListOverlay = this.createBlockListOverlay();
    document.body.appendChild(this.blockListOverlay);

    const baseUrl = options.baseUrl;
    this.apiClient = new APIClient(baseUrl);

    this.textarea.classList.add("content-block-highlight__input");

    this.updateHighlight();

    this.textarea.addEventListener("input", () => this.updateHighlight());
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

    const insertBlockButton = document.getElementById(
      "insert-content-block-button",
    );
    if (insertBlockButton instanceof HTMLButtonElement) {
      insertBlockButton.addEventListener("click", () =>
        this.onInsertBlockButtonClicked(),
      );
    }

    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "resize-preview") {
        if (this.preview instanceof HTMLIFrameElement) {
          this.preview.style.height = `${event.data.height + 4}px`;
          this.preview.style.width = `${event.data.width + 4}px`;
        }
      }
    });

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

  createBlockListOverlay(): HTMLDivElement {
    const overlay = document.createElement("div");
    overlay.className = "content-block-highlight__block-list-overlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-label", "Available content blocks");
    overlay.setAttribute("aria-hidden", "true");

    return overlay;
  }

  updateHighlight() {
    let text = this.textarea.value;

    if (text[text.length - 1] === "\n") {
      text += " ";
    }

    // Escape HTML entities
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Wrap matched embed codes with <mark>
    text = text.replace(
      embedRegex,
      '<mark class="content-block-highlight__mark">$&</mark>',
    );

    this.highlight.innerHTML = text;

    const allEmbedCodes = text.matchAll(embedRegex);
    for (const embedCode of allEmbedCodes) {
      void this.apiClient
        .fetchPreview(embedCode[0])
        .catch((e) => console.error(e));
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
      await this.onMarkEnter(mark);
    }
  }

  async onInsertBlockButtonClicked() {
    if (this.blocks.length === 0) {
      this.blocks = await this.preloadBlocks();
    }

    this.renderBlockListOverlay();
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

  async onMarkEnter(mark: HTMLElement) {
    const embedCode = mark.textContent?.trim();
    if (!embedCode) return;

    const cachedPreviewPromise = this.apiClient.get(embedCode);
    if (!cachedPreviewPromise) return;

    this.activeHoverEmbedCode = embedCode;
    this.clearHoverTimer();

    this.hoverPreviewTimeoutId = window.setTimeout(() => {
      void this.renderHoverPreview(mark, embedCode, cachedPreviewPromise);
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
    cachedPreviewPromise: NonNullable<ReturnType<APIClient["get"]>>,
  ) {
    try {
      const preview = await cachedPreviewPromise;
      if (this.activeHoverEmbedCode !== embedCode) return;

      this.preview.srcdoc = makeIframePayload(preview.html);
      this.positionHoverPreview(mark);
      this.preview.hidden = false;
      this.preview.setAttribute("aria-hidden", "false");
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

  private renderBlockListOverlay() {
    const heading = document.createElement("h2");
    heading.className = "content-block-highlight__block-list-title";
    heading.textContent = "Available content blocks";

    const content = document.createElement("div");
    content.className = "content-block-highlight__block-list-content";

    if (this.blocks.length === 0) {
      const emptyState = document.createElement("p");
      emptyState.className = "content-block-highlight__block-list-empty-state";
      emptyState.textContent = "No content blocks available.";
      content.appendChild(emptyState);
    } else {
      const list = document.createElement("ul");
      list.className = "content-block-highlight__block-list";

      for (const block of this.blocks) {
        const listItem = document.createElement("li");
        listItem.className = "content-block-highlight__block-list-item";
        listItem.textContent = block.title;
        list.appendChild(listItem);
      }

      content.appendChild(list);
    }

    this.blockListOverlay.replaceChildren(heading, content);
    this.blockListOverlay.hidden = false;
    this.blockListOverlay.setAttribute("aria-hidden", "false");
  }

  async preloadBlocks(): Promise<BlockSearchResult[]> {
    try {
      return await this.apiClient.fetchAllBlocks();
    } catch (error) {
      console.error("Failed to preload blocks:", error);
      return [];
    }
  }

  static initAll(
    options: ContentBlockEditorOptions,
    scope: ParentNode = document,
  ): ContentBlockEditor[] {
    const elements = scope.querySelectorAll(
      '[data-module~="content-block-highlight"]',
    );

    return Array.from(elements).map(
      (element) => new ContentBlockEditor(element, options),
    );
  }
}
