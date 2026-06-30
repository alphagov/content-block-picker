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

To initialise the picker on a textarea, add the `data-module="content-block-highlight"` attribute. If you want to wire in a button to trigger the block list, add the `data-insert-button-id` attribute with the ID of the button.

```html
<button class="govuk-button" id="insert-content-block-button">
  Insert content block
</button>
...
<textarea
  class="my-textarea govuk-textarea"
  data-module="content-block-highlight"
  data-insert-button-id="insert-content-block-button"
></textarea>
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

## Demo

You can see a [demo of the work so far here](https://alphagov.github.io/content-block-editor/)

## Future work

In future, we'd like to provide previews of the content blocks when the user hovers over an embed code.
