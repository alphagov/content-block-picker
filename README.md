# Content Block Picker

A lightweight, drop-in textarea highlighter for highlighting content blocks within publishing apps.

## Local development

1. Clone the repo
1. Install dependencies:

   ```bash
   npm install
   ```

1. Run the development server:

   ```bash
   npm run dev
   ```

1. Access the [Example Picker](http://localhost:5173/)
1. Run tests

   ### Unit tests

   ```bash
   npm run test
   ```

   ### E2E tests (using [Playwright](https://playwright.dev/))

   ```bash
   npm run e2e-test
   ```

## Overview

The picker can be used as a "drop-in" replacement for textareas, allowing Content Block embed codes from
[Content Block Manager](https://docs.publishing.service.gov.uk/repos/whitehall/content_block_manager.html) to be
highlighted.

It works by overlaying a transparent textarea on top of a styled `<div>` that contains the highlighted content. This ensures that standard textarea behaviour is maintained while providing visual highlighting.

### Usage

To initialise the picker on a textarea, add the `data-module="content-block-highlight"` attribute:

```html
<textarea data-module="content-block-highlight"></textarea>
```

Then initialise the Javascript:

```javascript
import { ContentBlockEditor } from "content-block-editor";

ContentBlockEditor.initAll({
  baseUrl: "http://content-block-manager.dev.gov.uk",
});
// or
ContentBlockEditor.initAll({
  baseUrl: "http://content-block-manager.dev.gov.uk",
  embedPreviewDelayMs: 500,
});
```

### Listing available blocks

The picker can show editors the content blocks available to them so they don't need to know an embed code up front. Add a trigger button and point the textarea at it with the `data-cbp-insert-block-button` attribute, set to the button's `id`:

```html
<button id="insert-content-block-button">Insert block</button>
<textarea
  data-module="content-block-highlight"
  data-cbp-insert-block-button="insert-content-block-button"
></textarea>
```

Clicking the button opens an overlay that fetches the blocks from `GET {baseUrl}/api/blocks` and lists each one by title, with its available formats nested underneath. The list is loaded fresh each time it is opened (so it always reflects the current state of the blocks) and is dismissed by pressing `Escape`, clicking the list, or clicking anywhere outside it.

Each textarea is wired to its own button, so multiple editors can appear on the same page. The attribute is optional — omit it and the picker behaves exactly as before.

## Demo

You can see a [demo of the work so far here](https://alphagov.github.io/content-block-editor/)

## Future work

In future, we'd like to provide previews of the content blocks when the user hovers over an embed code.
