# Grouping blocks in the picker

## Status

Proposed

## Context

The content block picker currently displays an insert blocks overlay that presents all available content blocks in a flat list. Each block can have multiple formats (defined in the `formats` array) and potentially internal paths. The current implementation in `renderBlockList()` creates a simple hierarchical structure:

```
Block title
  └─ Format 1
  └─ Format 2
  └─ Format N
```

As the system scales, we anticipate:

1. **Many blocks**: Possibly hundreds of content blocks across the platform
2. **Multiple formats per block**: Some block types may have 5+ format variants (e.g., timeperiod)
3. **Multiple organisations**: Blocks are owned by different government organizations, each with their own set of blocks

The current flat list becomes unwieldy for editors who need to:

- Find blocks belonging to their organisation
- Locate a specific type of block
- Choose the appropriate format for their context

Without grouping, editors face cognitive load in scanning through potentially hundreds of entries to find the right block and format combination.

The `ContentBlock` interface already provides the necessary metadata for grouping:

```typescript
interface ContentBlock {
  title: string;
  block_type: string;
  organisation: ContentBlockOrganisation;
  state: string;
  embed_code: string;
  formats: string[];
}
```

## Decision

We will implement configurable hierarchical grouping for the block list overlay. The grouping strategy will be configurable per textarea instance using a data attribute.

### Two grouping strategies

**Strategy 1: Organisation-first grouping**

```
Organisation Name
  └─ Block Type
      └─ Block Title (instance)
          └─ Format 1
          └─ Format 2
```

**Strategy 2: Type-first grouping**

```
Block Type
  └─ Organisation Name
      └─ Block Title (instance)
          └─ Format 1
          └─ Format 2
```

### Configuration approach

Add a new data attribute `data-cbp-grouping-strategy` to the textarea element with allowed values:

- `"organisation"` (organisation → type → instance → format/path)
- `"type"` (type → organisation → instance → format/path)
- Default to `"organisation"` if not specified

Example usage:

```html
<textarea
  data-module="content-block-highlight"
  data-cbp-insert-block-button="insert-button-id"
  data-cbp-grouping-strategy="organisation"
></textarea>
```

### Implementation details

1. **Grouping logic**: Extract grouping logic into a separate function that transforms the flat `ContentBlock[]` array into a nested data structure based on the chosen strategy

2. **Rendering**: Update `renderBlockList()` to render nested `<ul>` elements with appropriate styling for each hierarchy level

3. **Collapsible groups**: Implement collapsible/expandable behaviour for group headings to reduce visual clutter (using `<details>`/`<summary>` elements for accessibility)

4. **Search/filter capability**: Reserve space for future enhancement to add a search input that filters the grouped list (documented in consequences)

## Consequences

### Positive impacts

- **Improved discoverability**: Editors can navigate through logical groupings rather than scanning a flat list
- **Scalability**: The interface can accommodate hundreds of blocks without overwhelming users
- **Flexibility**: Different contexts can choose the most appropriate grouping strategy (e.g., multi-organisation editing teams might prefer type-first; single-organisation teams might prefer organisation-first)
- **Accessibility**: Using semantic HTML (`<details>`/`<summary>`) provides keyboard navigation and screen reader support out of the box
- **Future-proof**: The nested structure can accommodate additional grouping dimensions if needed

### Negative impacts or trade-offs

- **More clicks required**: Users must expand groups to see blocks, adding interaction steps compared to the current flat list
- **Implementation complexity**: The rendering logic becomes more complex with nested structures and state management for expand/collapse
- **Memory overhead**: Storing the expanded/collapsed state for groups adds client-side state management
- **Initial configuration burden**: Sites must choose an appropriate grouping strategy, though the sensible default mitigates this

### Future implications

1. **Search/filter**: As the next enhancement, we should add a search input that filters blocks across all groups while preserving group context. This would allow users to quickly jump to specific blocks while still seeing their organisational context.

2. **Persistent state**: We may want to remember which groups the user has expanded across page loads (using localStorage), reducing repeated clicks for frequently accessed groups.

### Rejected options

**Tabs for top-level grouping**: We considered using tabs to separate organisations or types, but this would hide content and make it impossible to see blocks across multiple groups simultaneously. The collapsible tree structure provides better visibility.

**Single fixed grouping strategy**: We considered always grouping by organisation, but different editing contexts have different needs. Type-first grouping is valuable when editors regularly work with multiple organisations but focus on specific block types.

**Flat list with badges**: We considered keeping the flat list but adding visual badges for organisation and type. This doesn't solve the scaling problem and would still result in very long scrollable lists.

**Virtual scrolling**: We considered implementing virtual scrolling to handle large flat lists, but this is a technical solution that doesn't address the cognitive challenge of finding the right block. Grouping provides both performance and usability benefits.
