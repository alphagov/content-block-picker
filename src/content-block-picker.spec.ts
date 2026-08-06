import { expect, test, describe, beforeEach, vi } from "vitest";
import { ContentBlockPicker } from "./content-block-picker.ts";
import {
  BlockType,
  ContentBlock,
  EmbedCodePreview,
} from "./content-block/api-client.ts";

describe("ContentBlockPicker", () => {
  let textarea: HTMLTextAreaElement;
  let picker: ContentBlockPicker;

  const embedPreviewDelayMs = 314;
  const baseUrl = "http://not-used.test";
  const sampleBlocks: ContentBlock[] = [
    {
      title: "Sample Pension Block 1",
      block_type: BlockType.Pension,
      organisation: {
        name: "AI Security Institute",
        content_id: "11111111-2222-3333-4444-000000000000",
      },
      state: "published",
      embed_code: "{{embed:content_block_pension:sample-pension-1}}",
      formats: [],
    },
    {
      title: "Sample Time Period Block 1",
      block_type: BlockType.TimePeriod,
      organisation: {
        name: "AI Security Institute",
        content_id: "11111111-2222-3333-4444-000000000001",
      },
      state: "published",
      embed_code: "{{embed:content_block_time_period:sample-time-1}}",
      formats: ["long_form", "years"],
    },
  ];

  function mockSuccessFetch() {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("<p>Rendered</p>"),
    } as unknown as Response);

    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  function setupPickerWithInsertButton() {
    document.body.innerHTML = `
      <button id="insert-content-block-button">Insert block</button>
      <textarea
        id="my-textarea"
        data-module="content-block-highlight"
        data-cbp-insert-block-button="insert-content-block-button"
      ></textarea>
    `;

    const textareaWithButton = document.getElementById(
      "my-textarea",
    ) as HTMLTextAreaElement;
    const insertButton = document.getElementById(
      "insert-content-block-button",
    ) as HTMLButtonElement;
    const pickerInstance = new ContentBlockPicker(textareaWithButton, {
      baseUrl,
    });

    // Mock fetchPreview to return valid responses by default
    vi.spyOn(pickerInstance.apiClient, "fetchPreview").mockResolvedValue({
      html: "<p>Rendered</p>",
      valid: true,
      error: null,
    });

    return { textareaWithButton, insertButton, pickerInstance };
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      </div>
    `;
    textarea = document.getElementById("my-textarea") as HTMLTextAreaElement;
    picker = new ContentBlockPicker(textarea, { baseUrl, embedPreviewDelayMs });

    // Mock fetchPreview to return valid responses by default
    vi.spyOn(picker.apiClient, "fetchPreview").mockResolvedValue({
      html: "<p>Rendered</p>",
      valid: true,
      error: null,
    });
  });

  describe("initializeModule", () => {
    test("it returns the element if it is a textarea", () => {
      expect(picker.initializeModule(textarea)).toBe(textarea);
    });

    test("it throws an error if the element is not a textarea", () => {
      const div = document.createElement("div");
      div.innerHTML = "Not a textarea";
      const pickerMock = Object.create(ContentBlockPicker.prototype);
      expect(() => pickerMock.initializeModule(div)).toThrow(
        /is not a textarea/,
      );
    });
  });

  describe("createWrapper", () => {
    test("it creates a wrapper div and moves the textarea inside it", () => {
      const wrapper = picker.wrapper;

      expect(wrapper.className).toBe("content-block-highlight__wrapper");
      expect(textarea.parentNode).toBe(wrapper);
      expect(document.getElementById("container")?.firstElementChild).toBe(
        wrapper,
      );
    });
  });

  describe("createHighlight", () => {
    test("it creates a highlight div inside the wrapper", () => {
      const highlight = picker.highlight;

      expect(highlight.className).toContain(
        "content-block-highlight__highlight",
      );
      expect(highlight.getAttribute("aria-hidden")).toBe("true");
      expect(picker.wrapper.contains(highlight)).toBe(true);
    });
  });

  describe("createHoverPreview", () => {
    test("it creates an element attached to the wrapper", () => {
      const preview = picker.preview;

      expect(preview).toBeInstanceOf(HTMLDivElement);
      expect(preview.className).toContain("content-block-highlight__preview");
      expect(picker.wrapper.contains(preview)).toBe(true);
    });
  });

  describe("updateHighlight", () => {
    test("it escapes HTML and wraps embed codes", async () => {
      vi.spyOn(picker.apiClient, "fetchPreview").mockResolvedValue({
        html: "<p>Rendered</p>",
        valid: true,
        error: null,
      });

      picker.textarea = textarea;
      picker.highlight = document.createElement("div");

      textarea.value = "<b>{{embed:contact:123}}</b>";
      picker.updateHighlight();

      await vi.waitFor(() => {
        expect(picker.highlight.innerHTML).toBe(
          '&lt;b&gt;<mark class="content-block-highlight__mark">{{embed:contact:123}}</mark>&lt;/b&gt;',
        );
      });
    });

    test("it adds a trailing space if the text ends with a newline", async () => {
      picker.textarea = textarea;
      picker.highlight = document.createElement("div");

      textarea.value = "text\n";
      picker.updateHighlight();

      await vi.waitFor(() => {
        expect(picker.highlight.innerHTML).toBe("text\n ");
      });
    });

    test("it marks invalid embed codes with the invalid CSS class", async () => {
      vi.spyOn(picker.apiClient, "fetchPreview").mockResolvedValue({
        html: null,
        valid: false,
        error: new Error("Some error"),
      });

      picker.textarea = textarea;
      picker.highlight = document.createElement("div");

      textarea.value = "{{embed:contact:invalid}}";
      picker.updateHighlight();

      await vi.waitFor(() => {
        expect(picker.highlight.innerHTML).toBe(
          '<mark class="content-block-highlight__mark content-block-highlight__mark--invalid">{{embed:contact:invalid}}</mark>',
        );
      });
    });

    test("it prevents stale results from overwriting newer ones (race condition)", async () => {
      let firstCallResolve: (value: EmbedCodePreview) => void;
      let secondCallResolve: (value: EmbedCodePreview) => void;

      const firstPromise = new Promise<EmbedCodePreview>((resolve) => {
        firstCallResolve = resolve;
      });
      const secondPromise = new Promise<EmbedCodePreview>((resolve) => {
        secondCallResolve = resolve;
      });

      let callCount = 0;
      vi.spyOn(picker.apiClient, "fetchPreview").mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return firstPromise;
        } else {
          return secondPromise;
        }
      });

      picker.textarea = textarea;
      picker.highlight = document.createElement("div");

      // First call - will resolve slower
      textarea.value = "{{embed:contact:first}}";
      picker.updateHighlight();

      // Second call - will resolve faster
      textarea.value = "{{embed:contact:second}}";
      picker.updateHighlight();

      // Resolve second call first (fast response)
      secondCallResolve!({ html: "<p>Second</p>", valid: true, error: null });

      await vi.waitFor(() => {
        expect(picker.highlight.innerHTML).toContain("second");
      });

      // Now resolve the first call (slow response)
      firstCallResolve!({ html: "<p>First</p>", valid: true, error: null });

      // Wait a bit to ensure first call's .then() executes
      await vi.advanceTimersByTimeAsync(50);

      // Highlight should still show "second", not "first"
      expect(picker.highlight.innerHTML).toContain("second");
      expect(picker.highlight.innerHTML).not.toContain("first");
    });
  });

  describe("hover preview", () => {
    test("it renders cached HTML on mark mouseover", async () => {
      const fetchMock = mockSuccessFetch();
      // Clear the mock from beforeEach so we use the global fetch mock
      vi.mocked(picker.apiClient.fetchPreview).mockRestore();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      // Wait for the mark to be rendered with the correct class
      await vi.waitFor(() => {
        const mark = picker.highlight.querySelector(
          ".content-block-highlight__mark",
        );
        expect(mark).not.toBeNull();
      });

      const mark = picker.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(picker, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);

      await vi.waitFor(() => {
        expect(picker.preview.hidden).toBe(false);
        expect(picker.preview.innerHTML).toContain("<p>Rendered</p>");
      });
    });

    test("it hides the preview on mark mouseout", async () => {
      const fetchMock = mockSuccessFetch();
      // Clear the mock from beforeEach so we use the global fetch mock
      vi.mocked(picker.apiClient.fetchPreview).mockRestore();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      // Wait for the mark to be rendered with the correct class
      await vi.waitFor(() => {
        const mark = picker.highlight.querySelector(
          ".content-block-highlight__mark",
        );
        expect(mark).not.toBeNull();
      });

      const mark = picker.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(picker, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);
      await vi.waitFor(() => expect(picker.preview.hidden).toBe(false));

      textarea.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

      expect(picker.preview.hidden).toBe(true);
      expect(picker.preview.innerHTML).toBe("");
    });

    test("it hides the preview when the cursor moves off the mark", async () => {
      const fetchMock = mockSuccessFetch();
      // Clear the mock from beforeEach so we use the global fetch mock
      vi.mocked(picker.apiClient.fetchPreview).mockRestore();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      // Wait for the mark to be rendered with the correct class
      await vi.waitFor(() => {
        const mark = picker.highlight.querySelector(
          ".content-block-highlight__mark",
        );
        expect(mark).not.toBeNull();
      });

      const mark = picker.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      const getMarkSpy = vi
        .spyOn(picker, "getMarkUnderCursor")
        .mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);
      await vi.waitFor(() => expect(picker.preview.hidden).toBe(false));

      getMarkSpy.mockReturnValue(null);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

      expect(picker.preview.hidden).toBe(true);
      expect(picker.preview.innerHTML).toBe("");
    });

    test("it does not show a preview when embed is not cached", async () => {
      picker.highlight.innerHTML =
        '<mark class="content-block-highlight__mark">{{embed:contact:123}}</mark>';
      const mark = picker.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(picker, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);

      expect(picker.preview.innerHTML).toBe("");
      expect(picker.preview.getAttribute("aria-hidden")).not.toBe("false");
    });
  });

  describe("constructor & events", () => {
    test("the constructor initializes everything correctly", () => {
      const pickerInstance = new ContentBlockPicker(textarea, {
        baseUrl,
        embedPreviewDelayMs,
      });

      expect(pickerInstance.textarea).toBe(textarea);
      expect(
        pickerInstance.wrapper.classList.contains(
          "content-block-highlight__wrapper",
        ),
      ).toBe(true);
      expect(
        pickerInstance.highlight.classList.contains(
          "content-block-highlight__highlight",
        ),
      ).toBe(true);
      expect(
        textarea.classList.contains("content-block-highlight__input"),
      ).toBe(true);

      expect(pickerInstance.preview).toBeInstanceOf(HTMLDivElement);
      expect(pickerInstance.embedPreviewDelayMs).toBe(embedPreviewDelayMs);
    });

    test("it updates the highlight on input", async () => {
      const pickerInstance = new ContentBlockPicker(textarea, { baseUrl });
      vi.spyOn(pickerInstance.apiClient, "fetchPreview").mockResolvedValue({
        html: "<p>Rendered</p>",
        valid: true,
        error: null,
      });

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => {
        const highlight = document.querySelector(
          ".content-block-highlight__highlight",
        );
        expect(highlight?.innerHTML).toContain("<mark");
      });
    });

    test("it syncs scroll positions", () => {
      const pickerInstance = new ContentBlockPicker(textarea, { baseUrl });
      textarea.scrollTop = 50;
      textarea.scrollLeft = 20;
      textarea.dispatchEvent(new Event("scroll"));

      expect(pickerInstance.highlight.scrollTop).toBe(50);
      expect(pickerInstance.highlight.scrollLeft).toBe(20);
    });

    test("it initializes ResizeObserver to sync scroll on resize", () => {
      const observeSpy = vi.spyOn(ResizeObserver.prototype, "observe");
      new ContentBlockPicker(textarea, { baseUrl });

      expect(observeSpy).toHaveBeenCalledWith(textarea);
    });

    test("it shows a fetching message when the configured insert button is clicked", async () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      const fetchAllBlocksMock = vi
        .spyOn(pickerInstance.apiClient, "fetchAllBlocks")
        .mockResolvedValue(sampleBlocks);

      expect(pickerInstance.blockListElement?.hidden).toBe(true);

      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(1);
      expect(pickerInstance.blockListElement?.hidden).toBe(false);
      expect(pickerInstance.blockListElement?.textContent).toBe(
        "Fetching blocks...",
      );
      expect(pickerInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "false",
      );
    });

    test("it renders blocks with their formats after fetching", async () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        const topLevelList =
          pickerInstance.blockListElement?.querySelector("ul");
        expect(topLevelList).not.toBeNull();
        expect(topLevelList?.children).toHaveLength(2);
      });

      const topLevelList = pickerInstance.blockListElement?.querySelector(
        "ul",
      ) as HTMLUListElement;
      const topLevelItems = Array.from(
        topLevelList.children,
      ) as HTMLLIElement[];

      expect(topLevelItems[0].childNodes[0]?.textContent).toBe(
        "Sample Pension Block 1",
      );
      expect(topLevelItems[0].dataset.embedCode).toBe(
        "{{embed:content_block_pension:sample-pension-1}}",
      );
      expect(topLevelItems[0].querySelector("ul")).toBeNull();
      expect(topLevelItems[1].childNodes[0]?.textContent).toBe(
        "Sample Time Period Block 1",
      );
      expect(topLevelItems[1].dataset.embedCode).toBe(
        "{{embed:content_block_time_period:sample-time-1}}",
      );
      const formatItems = Array.from(
        topLevelItems[1].querySelectorAll("ul > li"),
      ) as HTMLLIElement[];

      expect(formatItems.map((item) => item.textContent)).toEqual([
        "long_form",
        "years",
      ]);
      expect(formatItems[0].dataset.embedCode).toBe(
        "{{embed:content_block_time_period:sample-time-1#long_form}}",
      );
      expect(formatItems[1].dataset.embedCode).toBe(
        "{{embed:content_block_time_period:sample-time-1#years}}",
      );
    });

    test("it positions the block list relative to the document, accounting for scroll", () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      vi.spyOn(insertButton, "getBoundingClientRect").mockReturnValue({
        bottom: 100,
        left: 40,
      } as DOMRect);
      vi.spyOn(window, "scrollY", "get").mockReturnValue(500);
      vi.spyOn(window, "scrollX", "get").mockReturnValue(30);

      insertButton.click();

      // top = bottom (100) + scrollY (500) + 8px gap; left = left (40) + scrollX (30)
      expect(pickerInstance.blockListElement?.style.top).toBe("608px");
      expect(pickerInstance.blockListElement?.style.left).toBe("70px");
    });

    test("it does not start a second block fetch while the first one is in flight", async () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      let resolveBlocks: (blocks: ContentBlock[]) => void = () => {};
      const pendingBlocks = new Promise<ContentBlock[]>((resolve) => {
        resolveBlocks = resolve;
      });

      const fetchAllBlocksMock = vi
        .spyOn(pickerInstance.apiClient, "fetchAllBlocks")
        .mockReturnValue(pendingBlocks);

      insertButton.click();
      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(1);
      expect(pickerInstance.blockListElement?.textContent).toBe(
        "Fetching blocks...",
      );

      resolveBlocks(sampleBlocks);

      await vi.waitFor(() => {
        expect(pickerInstance.blockListElement?.textContent).toContain(
          "Sample Pension Block 1",
        );
      });

      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(2);
    });

    test("it hides the block list when escape is pressed", () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(pickerInstance.blockListElement?.hidden).toBe(false);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(pickerInstance.blockListElement?.hidden).toBe(true);
      expect(pickerInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });

    test("it hides the block list when the block list is clicked", () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(pickerInstance.blockListElement?.hidden).toBe(false);

      pickerInstance.blockListElement?.click();

      expect(pickerInstance.blockListElement?.hidden).toBe(true);
      expect(pickerInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });

    test("it hides the block list when clicking outside the block list", () => {
      const { insertButton, pickerInstance } = setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(pickerInstance.blockListElement?.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(pickerInstance.blockListElement?.hidden).toBe(true);
      expect(pickerInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });
  });

  describe("insertEmbedCode", () => {
    test("it inserts the embed code at the caret position", () => {
      picker.textarea.value = "before after";
      picker.textarea.selectionStart = 7;
      picker.textarea.selectionEnd = 7;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe("before {{embed:contact:123}}after");
    });

    test("it inserts at the beginning when the caret is at position 0", () => {
      picker.textarea.value = "existing text";
      picker.textarea.selectionStart = 0;
      picker.textarea.selectionEnd = 0;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe("{{embed:contact:123}}existing text");
    });

    test("it replaces selected text with the embed code", () => {
      picker.textarea.value = "replace me";
      picker.textarea.selectionStart = 0;
      picker.textarea.selectionEnd = 10;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe("{{embed:contact:123}}");
    });

    test("it moves the cursor to after the inserted embed code", () => {
      picker.textarea.value = "text";
      picker.textarea.selectionStart = 4;
      picker.textarea.selectionEnd = 4;

      picker.insertEmbedCode("{{embed:contact:123}}");

      const expectedPosition = "text{{embed:contact:123}}".length;
      expect(picker.textarea.selectionStart).toBe(expectedPosition);
      expect(picker.textarea.selectionEnd).toBe(expectedPosition);
    });

    test("it dispatches an input event to update the highlight", () => {
      const inputSpy = vi.fn();
      picker.textarea.addEventListener("input", inputSpy);

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(inputSpy).toHaveBeenCalledTimes(1);
    });

    test("it inserts after the closing braces if the caret is inside an embed code", () => {
      picker.textarea.value = "text {{embed:contact:existing}} more text";
      // Position caret inside the embed code (at the 'e' in 'existing')
      picker.textarea.selectionStart = 20;
      picker.textarea.selectionEnd = 20;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe(
        "text {{embed:contact:existing}}{{embed:contact:123}} more text",
      );
    });

    test("it inserts after the embed code even when caret is at the start", () => {
      picker.textarea.value = "before {{embed:contact:existing}} more text";
      // Position caret at the start of the embed code
      picker.textarea.selectionStart = 7;
      picker.textarea.selectionEnd = 7;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:123}} more text",
      );
    });

    test("it does not duplicate text when selected range is inside an embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} more text";
      // Selection is entirely inside the embed code.
      picker.textarea.selectionStart = 15;
      picker.textarea.selectionEnd = 20;

      picker.insertEmbedCode("{{embed:contact:123}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:123}} more text",
      );
    });
  });

  describe("adjustInsertPositionIfSelectionOverlapsEmbedCode", () => {
    test("it inserts after the embed code when selection starts before and ends inside", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select from "before " to middle of embed code
      picker.textarea.selectionStart = 0;
      picker.textarea.selectionEnd = 20;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:new}} after",
      );
    });

    test("it inserts after the embed code when selection starts inside and ends after", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select from middle of embed code to " after"
      picker.textarea.selectionStart = 20;
      picker.textarea.selectionEnd = 43;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:new}}",
      );
    });

    test("it inserts after the embed code when selection fully contains an embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select entire line including the embed code
      picker.textarea.selectionStart = 0;
      picker.textarea.selectionEnd = 43;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:new}}",
      );
    });

    test("it inserts after the rightmost embed code when selection overlaps multiple embed codes", () => {
      picker.textarea.value =
        "text {{embed:contact:first}} middle {{embed:contact:second}} end";
      // Select from start of first embed to middle of second embed
      picker.textarea.selectionStart = 5;
      picker.textarea.selectionEnd = 50;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "text {{embed:contact:first}} middle {{embed:contact:second}}{{embed:contact:new}} end",
      );
    });

    test("it preserves normal behavior when selection does not overlap with any embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select "after"
      picker.textarea.selectionStart = 34;
      picker.textarea.selectionEnd = 39;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}} {{embed:contact:new}}",
      );
    });

    test("it handles selection at the exact boundary of an embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select from the opening braces to the closing braces (entire embed code)
      picker.textarea.selectionStart = 7;
      picker.textarea.selectionEnd = 33;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:new}} after",
      );
    });

    test("it handles selection that touches but does not overlap the start of an embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select "before " (ends right before the embed code)
      picker.textarea.selectionStart = 0;
      picker.textarea.selectionEnd = 7;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "{{embed:contact:new}}{{embed:contact:existing}} after",
      );
    });

    test("it handles selection that touches but does not overlap the end of an embed code", () => {
      picker.textarea.value = "before {{embed:contact:existing}} after";
      // Select " after" (starts right after the embed code)
      picker.textarea.selectionStart = 33;
      picker.textarea.selectionEnd = 39;

      picker.insertEmbedCode("{{embed:contact:new}}");

      expect(picker.textarea.value).toBe(
        "before {{embed:contact:existing}}{{embed:contact:new}}",
      );
    });
  });

  describe("block list item clicks", () => {
    test("it inserts the embed code and closes the list when a block item button is clicked", async () => {
      const { insertButton, pickerInstance, textareaWithButton } =
        setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          pickerInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = pickerInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(textareaWithButton.value).toBe(
        "{{embed:content_block_pension:sample-pension-1}}",
      );
      expect(pickerInstance.blockListElement?.hidden).toBe(true);
    });

    test("it inserts the format embed code when a format item button is clicked", async () => {
      const { insertButton, pickerInstance, textareaWithButton } =
        setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          pickerInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const formatButton = pickerInstance.blockListElement?.querySelector(
        "li ul li button",
      ) as HTMLButtonElement;
      formatButton.click();

      expect(textareaWithButton.value).toBe(
        "{{embed:content_block_time_period:sample-time-1#long_form}}",
      );
      expect(pickerInstance.blockListElement?.hidden).toBe(true);
    });

    test("it inserts at the current caret position in the textarea", async () => {
      const { insertButton, pickerInstance, textareaWithButton } =
        setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      textareaWithButton.value = "start end";
      textareaWithButton.selectionStart = 6;
      textareaWithButton.selectionEnd = 6;

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          pickerInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = pickerInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(textareaWithButton.value).toBe(
        "start {{embed:content_block_pension:sample-pension-1}}end",
      );
    });

    test("it returns focus to the textarea after inserting a block", async () => {
      const { insertButton, pickerInstance, textareaWithButton } =
        setupPickerWithInsertButton();
      vi.spyOn(pickerInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          pickerInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = pickerInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(document.activeElement).toBe(textareaWithButton);
    });
  });

  describe("multiple pickers with insert buttons", () => {
    test("it binds each picker instance to its own insert button", () => {
      document.body.innerHTML = `
        <button id="insert-content-block-button-1">Insert block 1</button>
        <textarea
          id="my-textarea-1"
          data-module="content-block-highlight"
          data-cbp-insert-block-button="insert-content-block-button-1"
        ></textarea>

        <button id="insert-content-block-button-2">Insert block 2</button>
        <textarea
          id="my-textarea-2"
          data-module="content-block-highlight"
          data-cbp-insert-block-button="insert-content-block-button-2"
        ></textarea>
      `;

      const insertButtonOne = document.getElementById(
        "insert-content-block-button-1",
      ) as HTMLButtonElement;
      const insertButtonTwo = document.getElementById(
        "insert-content-block-button-2",
      ) as HTMLButtonElement;

      const [firstPicker, secondPicker] = ContentBlockPicker.initAll({
        baseUrl,
      });

      // Mock fetchPreview for both pickers
      vi.spyOn(firstPicker.apiClient, "fetchPreview").mockResolvedValue({
        html: "<p>Rendered</p>",
        valid: true,
        error: null,
      });
      vi.spyOn(secondPicker.apiClient, "fetchPreview").mockResolvedValue({
        html: "<p>Rendered</p>",
        valid: true,
        error: null,
      });

      vi.spyOn(firstPicker.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );
      vi.spyOn(secondPicker.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      expect(firstPicker.blockListElement?.hidden).toBe(true);
      expect(secondPicker.blockListElement?.hidden).toBe(true);

      insertButtonOne.click();

      expect(firstPicker.blockListElement?.hidden).toBe(false);
      expect(secondPicker.blockListElement?.hidden).toBe(true);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(firstPicker.blockListElement?.hidden).toBe(true);
      expect(secondPicker.blockListElement?.hidden).toBe(true);

      insertButtonTwo.click();

      expect(firstPicker.blockListElement?.hidden).toBe(true);
      expect(secondPicker.blockListElement?.hidden).toBe(false);
    });
  });

  describe("initAll", () => {
    test("it initializes multiple instances based on data-module", () => {
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight"></textarea>
        <textarea data-module="content-block-highlight"></textarea>
      `;
      const pickers = ContentBlockPicker.initAll({ baseUrl });
      expect(pickers.length).toBe(2);
      expect(pickers[0]).toBeInstanceOf(ContentBlockPicker);
    });

    test("it initializes given a data module with multiple values", () => {
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight some-other-module"></textarea>
      `;
      const pickers = ContentBlockPicker.initAll({ baseUrl });
      expect(pickers.length).toBe(1);
      expect(pickers[0]).toBeInstanceOf(ContentBlockPicker);
    });

    test("it passes baseUrl from options to API requests", async () => {
      const fetchMock = mockSuccessFetch();
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight">{{embed:contact:123}}</textarea>
      `;

      const [pickerInstance] = ContentBlockPicker.initAll({
        baseUrl: "https://publisher.test",
      });

      pickerInstance.textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "https://publisher.test/api/blocks/%7B%7Bembed%3Acontact%3A123%7D%7D/render",
        );
      });
    });
  });
});
