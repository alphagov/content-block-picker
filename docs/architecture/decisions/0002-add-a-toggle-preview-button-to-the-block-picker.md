# ADR 0002: Add a toggle preview button to the block picker

## Status

Proposed

## Decision

Add an optional toggle preview button to the block picker that allows users to switch between viewing embed codes as static code snippets and previewing how they will render in the final document. The button must be provided by the consuming application in the DOM and specified via the constructor. If no button identifier is passed, the preview functionality will not be initialised.

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

## Options

### Option 1: Make button optional, specified via constructor (Chosen)

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

### Option 2: Build toggle button into the block picker

Create the toggle button as part of the Content Block Picker's internal DOM structure, automatically injecting it near the textarea.

**Pros:**

- Consistent UI across all consuming applications
- Simpler for consuming applications to adopt
- No additional configuration required

**Cons:**

- **Conflicts with existing implementations**: Services like Whitehall already have their own preview functionality; this would duplicate or interfere with their existing UI
- Violates project principle of keeping the library focused on core functionality
- Removes flexibility for different UX approaches across GOV.UK services
- Harder for consuming applications to style consistently with their existing UI

**Verdict**: Rejected due to lack of flexibility and risk of conflicts.

### Option 3: Always show preview, remove toggle

Replace the textarea content with the rendered preview by default, providing an "edit source" option to return to raw embed codes.

**Pros:**

- Most discoverable—users see rendered output immediately
- Could provide a WYSIWYG-like experience

**Cons:**

- **Breaking change**: Fundamentally alters the existing textarea-based interaction model
- Removes the ability to quickly scan and edit multiple embed codes
- Complex state management between preview and edit modes
- Performance concerns if document contains many embed codes
- Over-engineered for the problem

**Verdict**: Rejected as too invasive and complex.

## Consequences

### Positive

1. **Improved discoverability**: Users have an explicit control to toggle preview mode, making the feature more accessible
2. **Persistent preview**: Unlike hover, toggled preview can remain visible while users study the rendered output
3. **Backward compatibility**: Existing implementations without preview buttons continue to work unchanged
4. **Flexibility for services**: Each GOV.UK publishing application can integrate the button according to their needs
5. **No duplication**: Services with existing preview systems can continue using their own implementation

### Negative

1. **Implementation burden on consuming applications**: Each service must add the button to their DOM and pass the identifier
2. **Documentation dependency**: Services need clear guidance on how to integrate the button
3. **Potential for inconsistent UX**: Without strong documentation, different services might implement the button differently
4. **Additional complexity**: The library must conditionally initialise preview functionality based on constructor parameters

### Implementation considerations

1. **Constructor parameter**: Add an optional `previewToggleButtonId` parameter to `ContentBlockPicker.initAll()` and the instance constructor
2. **Conditional initialization**: Check for the button's presence in the DOM during initialization; skip preview setup if absent
3. **Event handling**: Attach click listener to the button; toggle between normal and preview states
4. **State management**: Track whether preview mode is active; update textarea or overlay accordingly
5. **API integration**: Reuse existing `api-client.ts` preview fetching logic
6. **Styling**: Provide CSS classes for preview state but let consuming applications control button appearance

### Testing requirements

- Unit tests must verify:
  - Constructor accepts optional `previewToggleButtonId` parameter
  - Preview functionality initializes only when button is provided
  - Preview functionality does not initialize when button is omitted
  - Toggle button click handlers attach and detach correctly
- E2E tests must verify:
  - Button toggles preview mode on and off
  - Preview displays rendered content correctly
  - Preview mode is keyboard accessible
  - Hover preview still works independently of toggle button

### Documentation updates required

- `README.md`: Add section explaining how to add a preview toggle button
- Include example HTML showing button placement and `data-preview-toggle-button-id` attribute
- Document the constructor parameter in API documentation
- Add note about services with existing preview functionality

### Future considerations

- **Multiple preview formats**: The toggle could eventually support cycling through different formats (e.g., email vs. web rendering)
- **Preview positioning**: Consider allowing services to specify where the preview should render (inline, sidebar, modal)
- **Preview caching**: Already implemented in `api-client.ts`, but may need optimization for documents with many codes
