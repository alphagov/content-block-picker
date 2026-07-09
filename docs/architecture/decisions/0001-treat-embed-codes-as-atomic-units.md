# ADR 0001: Treat embed codes as atomic units

## Status

Proposed

## Decision

Modify the `ContentBlockEditor` to treat embed codes as single, atomic units within the textarea. Embed codes will behave like single characters from a user interaction perspective: cursor navigation will skip over them entirely, deletion operations will remove the whole code, and selection will always include the complete code or none of it.

## Context

### Current behaviour

The Content Block Picker currently highlights embed codes (in the format `{{embed:<document_type>:<uuid-or-alias>[/<internal/path>][#format]}}`) by overlaying a transparent textarea on a styled `<div>` that renders matched codes inside `<mark>` elements. This provides visual highlighting while maintaining standard textarea functionality.

However, embed codes remain fully editable as regular text. Each character in an embed code like `{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}` can be individually added, deleted, or modified.

### The problem

Embed codes are machine-generated identifiers, not human-editable content. They must maintain their exact structure to remain valid:

1. **Accidental modification breaks codes silently**: If an editor accidentally adds, deletes, or changes even one character (e.g., deleting a closing brace while editing nearby text), the code no longer matches `embedRegex` and loses its highlighting. The broken code remains as junk text in the textarea.

2. **No indication of breakage**: The editor may not notice the code is broken until they save or preview their content. The highlight simply disappears, providing minimal feedback.

3. **Recovery requires manual deletion**: The editor must manually select and delete all characters of the broken code, then re-insert it via the block list overlay or by copying a valid code.

4. **Current partial solution is incomplete**: The `adjustInsertPositionIfSelectionOverlapsEmbedCode()` method (lines 214-249 of `content-block-editor.ts`) already demonstrates awareness of this problem—it prevents new embed codes from being inserted into existing ones. However, this only addresses insertion, not editing.

### Why this matters for this project

- **GOV.UK publishing applications** use this library to ensure content editors can safely include structured content blocks without risking malformed references
- The library already treats embed codes as special via highlighting and hover previews, but allows them to be fragile in their most critical aspect: maintaining validity
- The current transparent-textarea-over-highlight architecture provides a foundation for this enhancement

### Technical considerations

The current architecture uses:

- A standard `<textarea>` element for input
- Event listeners for `input`, `scroll`, `mousemove`, and `mouseleave`
- Direct manipulation of `textarea.value`, `selectionStart`, and `selectionEnd`
- Regex-based detection of valid embed codes via `embedRegex`

Any solution must preserve:

- Standard textarea undo/redo behaviour
- Copy/paste support (embed codes should copy as their full text)
- Accessibility via native textarea semantics
- The existing visual highlighting system

## Options

### Option 1: Intercept keyboard and input events (Chosen)

Intercept `keydown`, `keyup`, `beforeinput`, `input`, and selection-related events to prevent modification of embed codes. When an edit would affect an embed code:

- **Cursor navigation** (Arrow keys, Home, End): Skip over embed codes as if they were single characters
- **Deletion** (Backspace, Delete): Remove entire embed code as a single unit
- **Selection**: Expand selection to include full embed code if any part is selected
- **Double-click**: Select entire embed code
- **Insertion**: Prevent typing within embed codes; position cursor before or after the code
- **Undo/redo**: Leverage browser's native undo stack where possible; augment with custom history tracking if needed

**Pros:**

- Builds on existing textarea-based architecture
- Maintains native textarea undo/redo behaviour
- No change to data model (codes remain plain text in `textarea.value`)
- Preserves copy/paste semantics
- Can be implemented incrementally

**Cons:**

- Complex event interception logic required for each edit scenario
- Must handle edge cases (e.g., IME input, mobile keyboards, browser-specific behaviours)
- May conflict with future browser features or extensions
- Requires thorough testing across browsers and input methods

### Option 2: Replace textarea with contenteditable

Switch from `<textarea>` to a `contenteditable` element, representing embed codes as non-editable nested elements (e.g., `<span contenteditable="false">`).

**Pros:**

- Native browser support for atomic, non-editable regions
- Simpler handling of cursor navigation and selection
- More flexible for future rich-text features

**Cons:**

- **Breaking change**: Fundamentally alters the component's architecture
- Loss of native textarea semantics and robustness
- Significant accessibility concerns (contenteditable has poor AT support compared to textarea)
- Complex undo/redo management
- Must reimplement features like line wrapping, scrolling, and form submission
- Conflicts with project principles: this is a high-abstraction, high-risk change

**Verdict**: Rejected due to architectural overhaul required and accessibility risks.

### Option 3: Virtual cursor with hidden input

Maintain a "virtual" cursor position in a shadow data structure, syncing periodically to the real textarea cursor. Intercept all input and apply it to the virtual structure, then re-render the textarea.

**Pros:**

- Complete control over edit behaviour
- Could support complex transformations

**Cons:**

- Extremely complex to implement correctly
- High risk of bugs and unexpected behaviour
- Loses native undo/redo
- Performance concerns for large documents
- Over-engineered for the problem

**Verdict**: Rejected as too complex and fragile.

## Consequences

### Positive

1. **Embed codes become tamper-resistant**: Accidental edits will no longer break codes silently
2. **Improved editor confidence**: Content editors can work without fear of corrupting references
3. **Consistent with visual metaphor**: The highlighting already signals "this is special"—behaviour will now match
4. **Reduced support burden**: Fewer cases of broken codes requiring manual cleanup
5. **Foundation for future enhancements**: Atomic treatment enables potential features like drag-and-drop reordering or inline badges

### Negative

1. **Implementation complexity**: Event interception requires careful handling of many edge cases
2. **Cross-browser testing burden**: Keyboard and input behaviours vary across browsers, especially on mobile
3. **Potential browser compatibility issues**: Some older or niche browsers may behave unexpectedly
4. **Undo/redo complexity**: May need custom history management if native undo stack doesn't handle programmatic edits well
5. **Learning curve for maintainers**: Future contributors must understand the event interception logic

### Risks and mitigations

| Risk                                                                        | Mitigation                                                                                                |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| IME input (e.g., Japanese, Chinese) breaks or bypasses interception         | Test with IME input methods; use `beforeinput` and `compositionstart`/`compositionend` events             |
| Mobile keyboards behave differently                                         | Test on iOS Safari and Android Chrome; provide fallback to current behaviour if interception fails        |
| Copy/paste from external sources pastes inside embed codes                  | Detect and prevent paste operations that would split codes                                                |
| Screen readers may not announce atomic behaviour clearly                    | Add `aria-live` announcements when cursor skips over codes; include documentation for AT users            |
| Custom browser extensions or accessibility tools conflict with interception | Fail gracefully; log warnings; consider a `data-cbp-disable-atomic-codes` opt-out attribute for debugging |

### Implementation phasing

1. **Phase 1**: Implement cursor navigation skipping (arrow keys, Home, End)
2. **Phase 2**: Implement deletion behaviour (Backspace, Delete)
3. **Phase 3**: Implement selection expansion (single-click positioning, double-click selection, drag selection)
4. **Phase 4**: Implement insertion prevention (typing, paste)
5. **Phase 5**: Test and refine undo/redo support

Each phase should include:

- Unit tests in `content-block-picker.spec.ts`
- E2E tests in `e2e/picker.spec.ts`
- Manual testing across target browsers
- Accessibility review

### Future considerations

- **Performance**: If documents contain many embed codes, the regex-based position detection in event handlers may become a bottleneck. Consider caching embed code positions and invalidating on `input` events.
- **User customisation**: Some advanced users may want to edit codes manually (e.g., developers debugging). Consider a hidden keyboard shortcut or data attribute to temporarily disable atomic behaviour.
- **Visual indicators**: Once atomic behaviour is implemented, consider adding visual cues (e.g., a distinct background or border on focused codes) to reinforce the behaviour.

### Documentation updates required

- `README.md`: Add section explaining atomic embed code behaviour
- Potentially an end-user guide for publishing applications that embed this library

### Testing requirements

- Unit tests must cover all keyboard interactions (arrow keys, delete, backspace, etc.)
- E2E tests must verify behaviour in real browsers
- Test with assistive technologies (screen readers, voice control)
- Test with mobile devices (iOS, Android)
- Test with IME input methods
- Test undo/redo behaviour
- Test copy/paste scenarios
- Performance test with documents containing 50+ embed codes
