import { expect, test, describe, beforeEach, vi } from "vitest";
import { ContentBlockEditor } from "./content-block-editor.ts";

describe("ContentBlockPicker", () => {
  let textarea: HTMLTextAreaElement;
  let editor: ContentBlockEditor;

  const embedPreviewDelayMs = 314;
  const baseUrl = "http://not-used.test";

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
