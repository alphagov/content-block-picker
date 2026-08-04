import {
  BlockType,
  ContentBlock,
  BlocksResponse,
  EmbedCodePreview,
} from "../@types";
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

/**
 * APIClient is a simple client for fetching rendered content blocks from the server.
 *
 * It includes an in-memory cache to avoid redundant network requests for the same
 * embed code. The cache is keyed by the embed code string, and the values are the
 * resolved preview data.
 */
export class APIClient {
  private cache = new Map<string, EmbedCodePreview>();
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
  async fetchAllBlocks(): Promise<ContentBlock[]> {
    const url = new URL(this.BLOCKS_PATH, this.baseUrl).toString();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch blocks: ${response.status}`);
    }

    const data = (await response.json()) as BlocksResponse;
    return data.results.filter(isSupportedContentBlock);
  }

  private logAndReturnError(
    message: string,
    error: Error | null = null,
  ): EmbedCodePreview {
    console.warn(message, error);
    return {
      html: null,
      valid: false,
      error: error ?? new Error(message),
    };
  }

  async fetchPreview(embedCode: string): Promise<EmbedCodePreview> {
    if (this.cache.has(embedCode)) {
      return this.cache.get(embedCode)!;
    }

    let url: string;
    try {
      url = this.buildUrl(embedCode);
    } catch (error) {
      const errorResult = this.logAndReturnError(
        "Unable to build API URL",
        error instanceof Error ? error : new Error(String(error)),
      );

      this.cache.set(embedCode, errorResult);
      return errorResult;
    }

    const result = await this.fetchFromNetwork(embedCode, url);

    this.cache.set(embedCode, result);
    return result;
  }

  private async fetchFromNetwork(
    embedCode: string,
    url: string,
  ): Promise<EmbedCodePreview> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return this.logAndReturnError(
          `Failed to fetch block ${embedCode} (${response.status})`,
        );
      }

      return {
        html: await response.text(),
        valid: true,
        error: null,
      };
    } catch (error) {
      return this.logAndReturnError(
        `Error fetching block ${embedCode}: ${error instanceof Error ? error.message : String(error)}`,
        error as Error,
      );
    }
  }

  get(embedCode: string): EmbedCodePreview | undefined {
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
