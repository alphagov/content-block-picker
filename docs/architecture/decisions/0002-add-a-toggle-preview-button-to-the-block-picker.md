# ADR 0002: Add a toggle preview button to the block picker

## Status

Proposed

## Context

### Current behaviour

The Content Block Picker currently provides visual feedback for embed codes through:

1. **Syntax highlighting**: Embed codes are highlighted in the textarea using overlaid `<mark>` elements
2. **Hover previews**: When users hover over an embed code, a sandboxed iframe displays the rendered preview

### The problem

The hover-only preview has several limitations:

1. **Limited discoverability**: Users may not realise preview functionality exists unless they accidentally hover over an embed code
2. **No text comparison**: The hover preview appears as an overlay and doesn't show how the rendered block will integrate with surrounding text
3. **Temporary visibility**: The preview disappears as soon as the mouse moves away, making it hard to study the rendered output

### Why this matters for this project

- Content editors need confidence that their document will render correctly, especially when embed codes are interspersed with text
- Different publishing applications may have different preview needs—some already implement their own preview functionality

### Technical considerations

The library currently:

- Uses a transparent `<textarea>` overlaid on a styled `<div>` for highlighting
- Generates hover previews via `hover-preview-utils.ts` using sandboxed iframes
- Fetches rendered previews from the API via `api-client.ts`
- Maintains an in-memory cache of previews keyed by embed code

Any solution must:

- Avoid breaking existing implementations that have their own preview systems
- Preserve the existing hover preview functionality
- Follow the principle of not building UI controls directly into the library
- Allow consuming applications to control when and how preview functionality is exposed

## Decision

Add an optional toggle preview button to the block picker that allows users to switch between viewing embed codes as static code snippets and previewing how they will render in the final document. The button must be provided by the consuming application in the DOM and specified via the constructor. If no button identifier is passed, the preview functionality will not be initialised.

### Options

#### Chosen Option: Make button optional, specified via constructor

Require consuming applications to provide their own toggle button in the DOM and pass its identifier to the Content Block Picker constructor. The library handles the preview logic but not the button creation.

**Pros:**

- **Preserves existing implementations**: Services without preview buttons continue to work unchanged
- **Allows customisation**: Each service can style and position the button according to their design system
- **Follows library principles**: Keeps the library focused on highlighting and preview logic, not UI chrome
- **Opt-in behaviour**: Services can adopt the feature when ready, without breaking changes
- **Conditional initialisation**: If no button identifier is provided, the preview event listeners are never attached, avoiding overhead

**Cons:**

- Requires consuming applications to add the button to their DOM
- Each service must understand how to integrate the button
- Potential for inconsistent UX across services if not documented well

**Verdict**: Chosen for flexibility and compatibility with existing implementations.

#### Rejected options

Other potential options which were rejected included:

- **Automatically include "preview" toggle**: Too inflexible for services like Whitehall which already have preview functionality on GovSpeak-enabled textareas. Would duplicate or interfere with existing UI and violate the principle of keeping the library focused on core functionality.
- **Preview by default**: Too complex and conflicts with existing publishing app behaviour. Would require fundamental changes to the textarea-based interaction model and create performance concerns for documents with many embed codes.

## Consequences

### Positive

1. **Persistent preview**: Unlike hover, toggled preview can remain visible while users study the rendered output
2. **Backward compatibility**: Existing implementations without preview buttons continue to work unchanged
3. **Flexibility for services**: Each GOV.UK publishing application can integrate the button according to their needs
4. **No duplication**: Services with existing preview systems can continue using their own implementation

### Negative

1. **Implementation burden on consuming applications**: Each service must add the button to their DOM and pass the identifier
2. **Documentation dependency**: Services need clear guidance on how to integrate the button
3. **Potential for inconsistent UX**: Without strong documentation, different services might implement the button differently
4. **Additional complexity**: The library must conditionally initialise preview functionality based on constructor parameters

### Implementation considerations

1. **Constructor parameter**: Add an optional `previewToggleButtonId` parameter to `ContentBlockPicker.initAll()` and the instance constructor
2. **Conditional initialisation**: Check for the button's presence in the DOM during initialisation; skip preview setup if absent
3. **Event handling**: Attach click listener to the button; toggle between normal and preview states
4. **State management**: Track whether preview mode is active; update textarea or overlay accordingly
5. **API integration**: Reuse existing `api-client.ts` preview fetching logic
6. **Styling**: Utilise the CSS classes from the [design system](https://components.publishing.service.gov.uk/component-guide/button) for preview state but let consuming applications control button appearance

### Future considerations

- **Preview positioning**: Consider allowing services to specify where the preview should render (inline, sidebar, modal)
- **Preview caching**: Already implemented in `api-client.ts`, but may need optimization for documents with many codes
