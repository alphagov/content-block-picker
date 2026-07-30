/**
 * Represents an embed code response from the API.
 */
export interface EmbedCodePreview {
  html: string;
}

export enum BlockType {
  Pension = "Pension",
  Contact = "Contact",
  TimePeriod = "Time Period",
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

/**
 * APIClient is a simple client for fetching rendered content blocks from the server.
 *
 * It includes an in-memory cache to avoid redundant network requests for the same
 * embed code. The cache is keyed by the embed code string, and the values are Promises that
 * resolve to the fetched data. This allows multiple concurrent requests for the same
 * embed code to share the same Promise, preventing duplicate fetches.
 */

import { isValidEmbedCode } from "./regex.ts";

const supportedBlockTypes = new Set<string>(Object.values(BlockType));
const EXCLUDED_TITLE_PREFIX = "E2E";

function isSupportedBlockType(blockType: string): blockType is BlockType {
  return supportedBlockTypes.has(blockType);
}

function isSupportedContentBlock(block: ContentBlock): boolean {
  if (block.title.startsWith(EXCLUDED_TITLE_PREFIX)) {
    return false;
  }

  if (isSupportedBlockType(block.block_type)) {
    return true;
  }

  console.warn(
    `Skipping unsupported block type "${block.block_type}" for block "${block.title}".`,
  );
  return false;
}

export class APIClient {
  private cache = new Map<string, Promise<EmbedCodePreview>>();
  private readonly baseUrl: URL;
  private readonly API_BASE_PATH = "/api/blocks";
  private readonly BLOCKS_PATH = this.API_BASE_PATH;
  private readonly RENDER_PATH = `${this.API_BASE_PATH}/:embedCode/render`;

  constructor(baseUrl: string) {
    this.baseUrl = new URL(baseUrl);
  }

  /**
   * Fetches all content blocks from the API.
   *
   * Deliberately does not cache the results, as the list of blocks may change over time. Each call to this method will
   * make a new network request to fetch the latest data.
   *
   * @returns A Promise that resolves to an array of ContentBlock objects.
   */
  fetchAllBlocks(): Promise<ContentBlock[]> {
    const url = new URL(this.BLOCKS_PATH, this.baseUrl).toString();

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch blocks: ${response.status}`);
        }

        return response.json() as Promise<BlocksResponse>;
      })
      .then((data) => data.results.filter(isSupportedContentBlock));
  }

  fetchPreview(embedCode: string): Promise<EmbedCodePreview> {
    if (this.cache.has(embedCode)) {
      return this.cache.get(embedCode)!;
    }

    let url: string;
    try {
      url = this.buildUrl(embedCode);
    } catch (error) {
      return Promise.reject(error);
    }

    const promise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          this.cache.delete(embedCode);
          throw new Error(
            `Failed to fetch block ${embedCode}: ${response.status}`,
          );
        }

        return response.text();
      })
      .then((html) => ({ html }))
      .catch((error) => {
        this.cache.delete(embedCode);
        throw error;
      });

    this.cache.set(embedCode, promise);
    return promise;
  }

  get(embedCode: string): Promise<EmbedCodePreview> | undefined {
    return this.cache.get(embedCode);
  }

  private buildUrl(embedCode: string): string {
    if (!isValidEmbedCode(embedCode)) {
      throw new Error(`Invalid embed code: ${embedCode}`);
    }

    const path = this.RENDER_PATH.replace(
      ":embedCode",
      encodeURIComponent(embedCode),
    );
    const fullUrl = new URL(path, this.baseUrl);
    if (fullUrl.origin !== this.baseUrl.origin) {
      throw new Error(
        `Invalid URL: ${fullUrl} is not on the same origin as ${this.baseUrl}`,
      );
    }
    if (!fullUrl.pathname.startsWith(this.baseUrl.pathname)) {
      throw new Error(
        `Invalid URL: ${fullUrl} is not within the base path of ${this.baseUrl}`,
      );
    }
    return fullUrl.toString();
  }
}
