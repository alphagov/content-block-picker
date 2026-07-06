import { expect, test, describe, beforeEach, vi } from "vitest";
import { ContentBlockEditor } from "./content-block-editor.ts";
import type { ContentBlock } from "./content-block/api-client.ts";

describe("ContentBlockPicker", () => {
  let textarea: HTMLTextAreaElement;
  let editor: ContentBlockEditor;

  const embedPreviewDelayMs = 314;
  const baseUrl = "http://not-used.test";
  const sampleBlocks: ContentBlock[] = [
    {
      title: "Sample Pension Block 1",
      block_type: "Pension",
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
      block_type: "Time period",
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

  function setupEditorWithInsertButton() {
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
    const editorInstance = new ContentBlockEditor(textareaWithButton, {
      baseUrl,
    });

    return { textareaWithButton, insertButton, editorInstance };
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <textarea id="my-textarea" data-module="content-block-highlight"></textarea>
      </div>
    `;
    textarea = document.getElementById("my-textarea") as HTMLTextAreaElement;
    editor = new ContentBlockEditor(textarea, { baseUrl, embedPreviewDelayMs });
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

    test("it shows a fetching message and then renders blocks when the configured insert button is clicked", async () => {
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      const fetchAllBlocksMock = vi
        .spyOn(editorInstance.apiClient, "fetchAllBlocks")
        .mockResolvedValue(sampleBlocks);

      expect(editorInstance.blockListElement?.hidden).toBe(true);

      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(1);
      expect(editorInstance.blockListElement?.hidden).toBe(false);
      expect(editorInstance.blockListElement?.textContent).toBe(
        "Fetching blocks...",
      );
      expect(editorInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "false",
      );

      await vi.waitFor(() => {
        const topLevelList =
          editorInstance.blockListElement?.querySelector("ul");
        expect(topLevelList).not.toBeNull();
        expect(topLevelList?.children).toHaveLength(2);
      });

      const topLevelList = editorInstance.blockListElement?.querySelector(
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
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
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
      expect(editorInstance.blockListElement?.style.top).toBe("608px");
      expect(editorInstance.blockListElement?.style.left).toBe("70px");
    });

    test("it does not start a second block fetch while the first one is in flight", async () => {
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      let resolveBlocks: (blocks: ContentBlock[]) => void = () => {};
      const pendingBlocks = new Promise<ContentBlock[]>((resolve) => {
        resolveBlocks = resolve;
      });

      const fetchAllBlocksMock = vi
        .spyOn(editorInstance.apiClient, "fetchAllBlocks")
        .mockReturnValue(pendingBlocks);

      insertButton.click();
      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(1);
      expect(editorInstance.blockListElement?.textContent).toBe(
        "Fetching blocks...",
      );

      resolveBlocks(sampleBlocks);

      await vi.waitFor(() => {
        expect(editorInstance.blockListElement?.textContent).toContain(
          "Sample Pension Block 1",
        );
      });

      insertButton.click();

      expect(fetchAllBlocksMock).toHaveBeenCalledTimes(2);
    });

    test("it hides the block list when escape is pressed", () => {
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(editorInstance.blockListElement?.hidden).toBe(false);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(editorInstance.blockListElement?.hidden).toBe(true);
      expect(editorInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });

    test("it hides the block list when the block list is clicked", () => {
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(editorInstance.blockListElement?.hidden).toBe(false);

      editorInstance.blockListElement?.click();

      expect(editorInstance.blockListElement?.hidden).toBe(true);
      expect(editorInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });

    test("it hides the block list when clicking outside the block list", () => {
      const { insertButton, editorInstance } = setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();
      expect(editorInstance.blockListElement?.hidden).toBe(false);

      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      expect(editorInstance.blockListElement?.hidden).toBe(true);
      expect(editorInstance.blockListElement?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    });
  });

  describe("insertEmbedCode", () => {
    test("it inserts the embed code at the caret position", () => {
      editor.textarea.value = "before after";
      editor.textarea.selectionStart = 7;
      editor.textarea.selectionEnd = 7;

      editor.insertEmbedCode("{{embed:contact:123}}");

      expect(editor.textarea.value).toBe("before {{embed:contact:123}}after");
    });

    test("it inserts at the beginning when the caret is at position 0", () => {
      editor.textarea.value = "existing text";
      editor.textarea.selectionStart = 0;
      editor.textarea.selectionEnd = 0;

      editor.insertEmbedCode("{{embed:contact:123}}");

      expect(editor.textarea.value).toBe("{{embed:contact:123}}existing text");
    });

    test("it replaces selected text with the embed code", () => {
      editor.textarea.value = "replace me";
      editor.textarea.selectionStart = 0;
      editor.textarea.selectionEnd = 10;

      editor.insertEmbedCode("{{embed:contact:123}}");

      expect(editor.textarea.value).toBe("{{embed:contact:123}}");
    });

    test("it moves the cursor to after the inserted embed code", () => {
      editor.textarea.value = "text";
      editor.textarea.selectionStart = 4;
      editor.textarea.selectionEnd = 4;

      editor.insertEmbedCode("{{embed:contact:123}}");

      const expectedPosition = "text{{embed:contact:123}}".length;
      expect(editor.textarea.selectionStart).toBe(expectedPosition);
      expect(editor.textarea.selectionEnd).toBe(expectedPosition);
    });

    test("it dispatches an input event to update the highlight", () => {
      const inputSpy = vi.fn();
      editor.textarea.addEventListener("input", inputSpy);

      editor.insertEmbedCode("{{embed:contact:123}}");

      expect(inputSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("block list item clicks", () => {
    test("it inserts the embed code and closes the list when a block item button is clicked", async () => {
      const { insertButton, editorInstance, textareaWithButton } =
        setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          editorInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = editorInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(textareaWithButton.value).toBe(
        "{{embed:content_block_pension:sample-pension-1}}",
      );
      expect(editorInstance.blockListElement?.hidden).toBe(true);
    });

    test("it inserts the format embed code when a format item button is clicked", async () => {
      const { insertButton, editorInstance, textareaWithButton } =
        setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          editorInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const formatButton = editorInstance.blockListElement?.querySelector(
        "li ul li button",
      ) as HTMLButtonElement;
      formatButton.click();

      expect(textareaWithButton.value).toBe(
        "{{embed:content_block_time_period:sample-time-1#long_form}}",
      );
      expect(editorInstance.blockListElement?.hidden).toBe(true);
    });

    test("it inserts at the current caret position in the textarea", async () => {
      const { insertButton, editorInstance, textareaWithButton } =
        setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      textareaWithButton.value = "start end";
      textareaWithButton.selectionStart = 6;
      textareaWithButton.selectionEnd = 6;

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          editorInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = editorInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(textareaWithButton.value).toBe(
        "start {{embed:content_block_pension:sample-pension-1}}end",
      );
    });

    test("it returns focus to the textarea after inserting a block", async () => {
      const { insertButton, editorInstance, textareaWithButton } =
        setupEditorWithInsertButton();
      vi.spyOn(editorInstance.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      insertButton.click();

      await vi.waitFor(() => {
        expect(
          editorInstance.blockListElement?.querySelector("ul"),
        ).not.toBeNull();
      });

      const firstBlockButton = editorInstance.blockListElement?.querySelector(
        "li button",
      ) as HTMLButtonElement;
      firstBlockButton.click();

      expect(document.activeElement).toBe(textareaWithButton);
    });
  });

  describe("multiple editors with insert buttons", () => {
    test("it binds each editor instance to its own insert button", () => {
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

      const [firstEditor, secondEditor] = ContentBlockEditor.initAll({
        baseUrl,
      });
      vi.spyOn(firstEditor.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );
      vi.spyOn(secondEditor.apiClient, "fetchAllBlocks").mockResolvedValue(
        sampleBlocks,
      );

      expect(firstEditor.blockListElement?.hidden).toBe(true);
      expect(secondEditor.blockListElement?.hidden).toBe(true);

      insertButtonOne.click();

      expect(firstEditor.blockListElement?.hidden).toBe(false);
      expect(secondEditor.blockListElement?.hidden).toBe(true);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(firstEditor.blockListElement?.hidden).toBe(true);
      expect(secondEditor.blockListElement?.hidden).toBe(true);

      insertButtonTwo.click();

      expect(firstEditor.blockListElement?.hidden).toBe(true);
      expect(secondEditor.blockListElement?.hidden).toBe(false);
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
