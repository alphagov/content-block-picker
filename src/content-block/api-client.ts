/**
 * Represents an embed code response from the API.
 */
export interface EmbedCodePreview {
  html: string;
}

/**
 * APIClient is a simple client for fetching rendered content blocks from the server.
 *
 * It includes an in-memory cache to avoid redundant network requests for the same embed
 * code. The cache is keyed by the embed code string, and the values are Promises that
 * resolve to the fetched data. This allows multiple concurrent requests for the same
 * embed code to share the same Promise, preventing duplicate fetches.
 */

import { isValidEmbedCode } from "./regex.ts";
import type { BlockSearchResponse } from "../@types/block";

export class APIClient {
  private cache = new Map<string, Promise<EmbedCodePreview>>();
  private readonly baseUrl: URL;
  private readonly BLOCKS_PATH = "/api/blocks";
  private readonly RENDER_PATH = `${this.BLOCKS_PATH}/:embedCode/render`;

  constructor(baseUrl: string) {
    this.baseUrl = new URL(baseUrl);
  }

  fetchBlocksPage(url: string): Promise<BlockSearchResponse> {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch blocks: ${response.status}`);
      }

      return response.json() as Promise<BlockSearchResponse>;
    });
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
