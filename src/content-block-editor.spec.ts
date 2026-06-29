import { expect, test, describe, beforeEach, afterEach, vi } from "vitest";
import { ContentBlockEditor } from "./content-block-editor.ts";

describe("ContentBlockPicker", () => {
  let textarea: HTMLTextAreaElement;
  let editor: ContentBlockEditor;

  const embedPreviewDelayMs = 314;
  const baseUrl = "http://not-used.test";

  /**
   * Re-stubs global fetch for tests that need to assert calls against a dedicated spy.
   *
   * This intentionally overrides the default fetch stub set in beforeEach because
   * vi.stubGlobal replaces the current global value for the rest of the test.
   */
  function mockSuccessFetch() {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("<p>Rendered</p>"),
    } as unknown as Response);

    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("<p>Rendered</p>"),
        json: vi.fn().mockResolvedValue({
          total: 0,
          pages: 1,
          current_page: 1,
          links: [],
          results: [],
        }),
      } as unknown as Response),
    );

    document.body.innerHTML = `
      <div id="container">
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      </div>
    `;
    textarea = document.getElementById("my-textarea") as HTMLTextAreaElement;
    editor = new ContentBlockEditor(textarea, { baseUrl, embedPreviewDelayMs });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("initializeModule", () => {
    test("it returns the element if it is a textarea", () => {
      expect(editor.initializeModule(textarea)).toBe(textarea);
    });

    test("it throws an error if the element is not a textarea", () => {
      const div = document.createElement("div");
      div.innerHTML = "Not a textarea";
      const editorMock = Object.create(ContentBlockEditor.prototype);
      expect(() => editorMock.initializeModule(div)).toThrow(
        /is not a textarea/,
      );
    });
  });

  describe("createWrapper", () => {
    test("it creates a wrapper div and moves the textarea inside it", () => {
      const wrapper = editor.wrapper;

      expect(wrapper.className).toBe("content-block-highlight__wrapper");
      expect(textarea.parentNode).toBe(wrapper);
      expect(document.getElementById("container")?.firstElementChild).toBe(
        wrapper,
      );
    });
  });

  describe("createHighlight", () => {
    test("it creates a highlight div inside the wrapper", () => {
      const highlight = editor.highlight;

      expect(highlight.className).toContain(
        "content-block-highlight__highlight",
      );
      expect(highlight.getAttribute("aria-hidden")).toBe("true");
      expect(editor.wrapper.contains(highlight)).toBe(true);
    });
  });

  describe("createHoverPreview", () => {
    test("it creates an element attached to the wrapper", () => {
      const preview = editor.preview;

      expect(preview).toBeInstanceOf(HTMLIFrameElement);
      expect(preview.className).toContain("content-block-highlight__preview");
      expect(editor.wrapper.contains(preview)).toBe(true);
    });
  });

  describe("createBlockListOverlay", () => {
    test("it creates a hidden overlay attached to the page", () => {
      const overlay = editor.blockListOverlay;

      expect(overlay.className).toContain(
        "content-block-highlight__block-list-overlay",
      );
      expect(overlay.hidden).toBe(true);
      expect(overlay.getAttribute("aria-hidden")).toBe("true");
      expect(document.body.contains(overlay)).toBe(true);
    });
  });

  describe("updateHighlight", () => {
    test("it escapes HTML and wraps embed codes", () => {
      editor.textarea = textarea;
      editor.highlight = document.createElement("div");

      textarea.value = "<b>{{embed:contact:123}}</b>";
      editor.updateHighlight();

      expect(editor.highlight.innerHTML).toBe(
        '&lt;b&gt;<mark class="content-block-highlight__mark">{{embed:contact:123}}</mark>&lt;/b&gt;',
      );
    });

    test("it adds a trailing space if the text ends with a newline", () => {
      editor.textarea = textarea;
      editor.highlight = document.createElement("div");

      textarea.value = "text\n";
      editor.updateHighlight();

      expect(editor.highlight.innerHTML).toBe("text\n ");
    });
  });

  describe("hover preview", () => {
    test("it renders cached HTML on mark mouseover", async () => {
      const fetchMock = mockSuccessFetch();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      const mark = editor.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(editor, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);

      await vi.waitFor(() => {
        expect(editor.preview.hidden).toBe(false);
        expect(editor.preview.srcdoc).toContain("<p>Rendered</p>");
      });
    });

    test("it hides the preview on mark mouseout", async () => {
      const fetchMock = mockSuccessFetch();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      const mark = editor.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(editor, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);
      await vi.waitFor(() => expect(editor.preview.hidden).toBe(false));

      textarea.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));

      expect(editor.preview.hidden).toBe(true);
      expect(editor.preview.innerHTML).toBe("");
    });

    test("it hides the preview when the cursor moves off the mark", async () => {
      const fetchMock = mockSuccessFetch();

      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

      const mark = editor.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      const getMarkSpy = vi
        .spyOn(editor, "getMarkUnderCursor")
        .mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);
      await vi.waitFor(() => expect(editor.preview.hidden).toBe(false));

      getMarkSpy.mockReturnValue(null);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));

      expect(editor.preview.hidden).toBe(true);
      expect(editor.preview.innerHTML).toBe("");
    });

    test("it does not show a preview when embed is not cached", async () => {
      editor.highlight.innerHTML =
        '<mark class="content-block-highlight__mark">{{embed:contact:123}}</mark>';
      const mark = editor.highlight.querySelector(
        ".content-block-highlight__mark",
      ) as HTMLElement;

      vi.spyOn(editor, "getMarkUnderCursor").mockReturnValue(mark);
      textarea.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(embedPreviewDelayMs);

      expect(editor.preview.srcdoc).toBe("");
      expect(editor.preview.getAttribute("aria-hidden")).not.toBe("false");
    });
  });

  describe("constructor & events", () => {
    test("the constructor initializes everything correctly", () => {
      const editorInstance = new ContentBlockEditor(textarea, {
        baseUrl,
        embedPreviewDelayMs,
      });

      expect(editorInstance.textarea).toBe(textarea);
      expect(
        editorInstance.wrapper.classList.contains(
          "content-block-highlight__wrapper",
        ),
      ).toBe(true);
      expect(
        editorInstance.highlight.classList.contains(
          "content-block-highlight__highlight",
        ),
      ).toBe(true);
      expect(
        textarea.classList.contains("content-block-highlight__input"),
      ).toBe(true);

      expect(editorInstance.preview).toBeInstanceOf(HTMLIFrameElement);
      expect(editorInstance.blockListOverlay).toBeInstanceOf(HTMLDivElement);
      expect(editorInstance.embedPreviewDelayMs).toBe(embedPreviewDelayMs);
    });

    test("it updates the highlight on input", () => {
      new ContentBlockEditor(textarea, { baseUrl });
      textarea.value = "{{embed:contact:123}}";
      textarea.dispatchEvent(new Event("input"));

      const highlight = document.querySelector(
        ".content-block-highlight__highlight",
      );
      expect(highlight?.innerHTML).toContain("<mark");
    });

    test("it syncs scroll positions", () => {
      const editorInstance = new ContentBlockEditor(textarea, { baseUrl });
      textarea.scrollTop = 50;
      textarea.scrollLeft = 20;
      textarea.dispatchEvent(new Event("scroll"));

      expect(editorInstance.highlight.scrollTop).toBe(50);
      expect(editorInstance.highlight.scrollLeft).toBe(20);
    });

    test("it initializes ResizeObserver to sync scroll on resize", () => {
      const observeSpy = vi.spyOn(ResizeObserver.prototype, "observe");
      new ContentBlockEditor(textarea, { baseUrl });

      expect(observeSpy).toHaveBeenCalledWith(textarea);
    });

    test("it wires insert-content-block-button click to onInsertBlockButtonClicked", () => {
      document.body.innerHTML = `
        <button id="insert-content-block-button" type="button">Insert content block</button>
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      `;

      const textareaWithButton = document.getElementById(
        "my-textarea",
      ) as HTMLTextAreaElement;
      const onInsertSpy = vi.spyOn(
        ContentBlockEditor.prototype,
        "onInsertBlockButtonClicked",
      );

      new ContentBlockEditor(textareaWithButton, { baseUrl });

      const insertButton = document.getElementById(
        "insert-content-block-button",
      ) as HTMLButtonElement;
      insertButton.click();

      expect(onInsertSpy).toHaveBeenCalledTimes(1);
    });

    test("it starts with empty blocks and populates them when insert button is clicked", async () => {
      document.body.innerHTML = `
        <button id="insert-content-block-button" type="button">Insert content block</button>
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      `;

      const textareaWithButton = document.getElementById(
        "my-textarea",
      ) as HTMLTextAreaElement;
      const blocksFromApi = [
        {
          title: "Test block",
          block_type: "contact",
          organisation: {
            name: "Test org",
            content_id: "org-1",
          },
          state: "published",
          embed_code: "{{embed:contact:test}}",
          formats: ["html"],
        },
      ];

      const editorInstance = new ContentBlockEditor(textareaWithButton, {
        baseUrl,
      });
      const preloadSpy = vi
        .spyOn(editorInstance, "preloadBlocks")
        .mockResolvedValue(blocksFromApi);

      expect(editorInstance.blocks).toEqual([]);

      const insertButton = document.getElementById(
        "insert-content-block-button",
      ) as HTMLButtonElement;
      insertButton.click();

      await vi.waitFor(() => {
        expect(preloadSpy).toHaveBeenCalledTimes(1);
        expect(editorInstance.blocks).toEqual(blocksFromApi);
        expect(editorInstance.blockListOverlay.hidden).toBe(false);
        expect(editorInstance.blockListOverlay.textContent).toContain(
          "Available content blocks",
        );
        expect(editorInstance.blockListOverlay.textContent).toContain(
          "Test block",
        );
      });
    });

    test("it shows an empty state when no blocks are available", async () => {
      document.body.innerHTML = `
        <button id="insert-content-block-button" type="button">Insert content block</button>
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      `;

      const textareaWithButton = document.getElementById(
        "my-textarea",
      ) as HTMLTextAreaElement;

      const editorInstance = new ContentBlockEditor(textareaWithButton, {
        baseUrl,
      });
      vi.spyOn(editorInstance, "preloadBlocks").mockResolvedValue([]);

      const insertButton = document.getElementById(
        "insert-content-block-button",
      ) as HTMLButtonElement;
      insertButton.click();

      await vi.waitFor(() => {
        expect(editorInstance.blockListOverlay.hidden).toBe(false);
        expect(editorInstance.blockListOverlay.textContent).toContain(
          "No content blocks available.",
        );
      });
    });
  });

  describe("initAll", () => {
    test("it initializes multiple instances based on data-module", () => {
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight"></textarea>
        <textarea data-module="content-block-highlight"></textarea>
      `;
      const editors = ContentBlockEditor.initAll({ baseUrl });
      expect(editors.length).toBe(2);
      expect(editors[0]).toBeInstanceOf(ContentBlockEditor);
    });

    test("each instance has its own block list overlay", () => {
      document.body.innerHTML = `
         <button class="govuk-button" id="insert-content-block-button-one"> Insert content block </button>
         <button class="govuk-button" id="insert-content-block-button-two"> Insert content block </button>
         <textarea data-module="content-block-highlight" data-insert-button-id="insert-content-block-button-one"></textarea>
         <textarea data-module="content-block-highlight" data-insert-button-id="insert-content-block-button-two"></textarea>
       `;
      const editors = ContentBlockEditor.initAll({ baseUrl });

      expect(editors.length).toBe(2);
      expect(editors[0].blockListOverlay).not.toBe(editors[1].blockListOverlay);
      expect(
        document.querySelectorAll(
          ".content-block-highlight__block-list-overlay",
        ).length,
      ).toBe(2);
    });

    test("it initializes given a data module with multiple values", () => {
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight some-other-module"></textarea>
      `;
      const editors = ContentBlockEditor.initAll({ baseUrl });
      expect(editors.length).toBe(1);
      expect(editors[0]).toBeInstanceOf(ContentBlockEditor);
    });

    test("it passes baseUrl from options to API requests", async () => {
      const fetchMock = mockSuccessFetch();
      document.body.innerHTML = `
        <textarea data-module="content-block-highlight">{{embed:contact:123}}</textarea>
      `;

      const [editorInstance] = ContentBlockEditor.initAll({
        baseUrl: "https://publisher.test",
      });

      editorInstance.textarea.dispatchEvent(new Event("input"));

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "https://publisher.test/api/blocks/%7B%7Bembed%3Acontact%3A123%7D%7D/render",
        );
      });
    });
  });
});
