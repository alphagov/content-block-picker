/**
 * Represents an embed code response from the API.
 */
export type EmbedCodePreview =
  | { html: string; valid: true; error: null }
  | { html: null; valid: false; error: Error };

export enum BlockType {
  Pension = "Pension",
  Contact = "Contact",
  TimePeriod = "Time period",
}

/**
 * The organisation that owns a content block.
 */
export interface ContentBlockOrganisation {
  name: string;
  content_id: string;
}

/**
 * A single content block as returned by the blocks list endpoint.
 */
export interface ContentBlock {
  title: string;
  block_type: BlockType;
  organisation: ContentBlockOrganisation;
  state: string;
  embed_code: string;
  formats: string[];
}

/**
 * The response shape of the blocks list endpoint.
 */
export interface BlocksResponse {
  results: ContentBlock[];
}
