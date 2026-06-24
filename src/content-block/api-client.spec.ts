import { beforeEach, describe, expect, test, vi } from "vitest";
import { APIClient } from "./api-client";
import type { BlockSearchResponse, BlockSearchResult } from "../@types/block";

interface BlockResponse {
  html: string;
}

function createSuccessResponse(data: BlockResponse): Response {
  const text = vi.fn().mockResolvedValue(data.html);
  return {
    ok: true,
    status: 200,
    text,
  } as unknown as Response;
}

function createErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    text: vi.fn(),
  } as unknown as Response;
}

function createJsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

function createBlockSearchResult(
  overrides?: Partial<BlockSearchResult>,
): BlockSearchResult {
  return {
    title: "Sample Block",
    block_type: "Contact",
    organisation: {
      name: "Test Organisation",
      content_id: "test-org-id",
    },
    state: "published",
    embed_code: "{{embed:content_block_contact:sample-contact-1}}",
    formats: [],
    ...overrides,
  };
}

function createBlockSearchResponse(
  overrides?: Partial<BlockSearchResponse>,
): BlockSearchResponse {
  return {
    total: 1,
    pages: 1,
    current_page: 1,
    links: [],
    results: [createBlockSearchResult()],
    ...overrides,
  };
}

function mockPaginatedResponses(
  fetchMock: ReturnType<typeof vi.fn>,
  ...pages: BlockSearchResponse[]
): void {
  pages.forEach((page) => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(page));
  });
}

describe("APIClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const baseUrl = "https://example.test";

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  describe("fetchPreview", () => {
    test("it fetches from the encoded block render URL", async () => {
      const embedCode = "{{embed:contact:abc-123/some-path#full}}";
      const expectedPayload: BlockResponse = { html: "<p>Rendered</p>" };
      const expectedUrl = `${baseUrl}/api/blocks/${encodeURIComponent(embedCode)}/render`;
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createSuccessResponse(expectedPayload));

      const result = await client.fetchPreview(embedCode);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
      expect(result).toEqual(expectedPayload);
    });

    test("it fetches a blocks page and returns parsed JSON", async () => {
      const client = new APIClient(baseUrl) as unknown as {
        fetchBlocksPage: (url: string) => Promise<BlockSearchResponse>;
      };
      const url = `${baseUrl}/api/blocks?page=2`;
      const payload = {
        total: 1,
        pages: 1,
        current_page: 1,
        links: [],
        results: [
          {
            title: "Sample Contact Block",
            block_type: "Contact",
            organisation: {
              name: "AI Security Institute",
              content_id: "3a279946-1880-410e-ad4e-eb3cef22e210",
            },
            state: "published",
            embed_code: "{{embed:content_block_contact:sample-contact-1}}",
            formats: [],
          },
        ],
      };

      fetchMock.mockResolvedValue(createJsonResponse(payload));

      const result = await client.fetchBlocksPage(url);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(url);
      expect(result).toEqual(payload);
    });

    test("it throws when fetchBlocksPage receives a non-ok response", async () => {
      const client = new APIClient(baseUrl) as unknown as {
        fetchBlocksPage: (url: string) => Promise<BlockSearchResponse>;
      };

      fetchMock.mockResolvedValue(createErrorResponse(500));

      await expect(
        client.fetchBlocksPage(`${baseUrl}/api/blocks`),
      ).rejects.toThrow("Failed to fetch blocks: 500");
    });

    test("it reuses cached requests for the same embed code", async () => {
      const embedCode = "{{embed:contact:abc-123}}";
      const payload: BlockResponse = { html: "<p>Cached</p>" };
      const client = new APIClient("http://not-used.test");

      fetchMock.mockResolvedValue(createSuccessResponse(payload));

      const firstResult = await client.fetchPreview(embedCode);
      const secondResult = await client.fetchPreview(embedCode);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(firstResult).toEqual(payload);
      expect(secondResult).toEqual(payload);
    });

    test("it removes failed requests from cache so retries can succeed", async () => {
      const embedCode = "{{embed:contact:abc-123}}";
      const client = new APIClient("http://not-used.test");
      const payload: BlockResponse = { html: "<p>Retry worked</p>" };

      fetchMock
        .mockResolvedValueOnce(createErrorResponse(500))
        .mockResolvedValueOnce(createSuccessResponse(payload));

      await expect(client.fetchPreview(embedCode)).rejects.toThrow(
        "Failed to fetch block {{embed:contact:abc-123}}: 500",
      );

      const result = await client.fetchPreview(embedCode);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result).toEqual(payload);
    });

    test("it returns a cached promise only when present", async () => {
      const embedCode = "{{embed:contact:abc-123}}";
      const payload: BlockResponse = { html: "<p>Cached lookup</p>" };
      const client = new APIClient("http://not-used.test");

      fetchMock.mockResolvedValue(createSuccessResponse(payload));

      expect(client.get(embedCode)).toBeUndefined();

      const pending = client.fetchPreview(embedCode);
      expect(client.get(embedCode)).toBe(pending);
      await expect(pending).resolves.toEqual(payload);
    });

    test("buildUrl encodes the embed code in the render path", () => {
      const embedCode = "{{embed:contact:abc-123/somepath#full}}";
      const client = new APIClient(baseUrl) as unknown as {
        buildUrl: (embed: string) => string;
      };

      const result = client.buildUrl(embedCode);

      expect(result).toBe(
        `${baseUrl}/api/blocks/${encodeURIComponent(embedCode)}/render`,
      );
    });

    test("buildUrl rejects URLs outside the configured base path", () => {
      // bit of a fudge to test the URL validation logic without exposing buildUrl as a public method, but it allows us
      // to verify that the client correctly rejects embed codes that would result in URLs outside the base path
      const client = new APIClient(
        "https://example.test/editor/",
      ) as unknown as {
        buildUrl: (embed: string) => string;
      };
      expect(() => client.buildUrl("{{embed:contact:abcd-123}}")).toThrow(
        "is not within the base path",
      );
    });

    test("it rejects embed codes that do not match the supported syntax", async () => {
      const client = new APIClient(baseUrl);

      await expect(client.fetchPreview("not an embed code")).rejects.toThrow(
        "Invalid embed code: not an embed code",
      );

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("fetchAllBlocks", () => {
    const evaluatePage = (result: BlockSearchResult[]) => {
      expect(result).toHaveLength(1);
      expect(result[0].embed_code).toBe("{{embed:block-1}}");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/api/blocks`);
    };

    test("it fetches all blocks from a single page", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 1,
        current_page: 1,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-1}}" })],
      });

      fetchMock.mockResolvedValue(createJsonResponse(page1));

      const result = await client.fetchAllBlocks();
      evaluatePage(result);
    });

    test("it fetches all blocks across multiple pages", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-1}}" })],
        links: [
          {
            rel: "next",
            href: `${baseUrl}/api/blocks?page=2`,
          },
        ],
      });

      const page2 = createBlockSearchResponse({
        pages: 2,
        current_page: 2,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-2}}" })],
        links: [],
      });

      mockPaginatedResponses(fetchMock, page1, page2);

      const result = await client.fetchAllBlocks();

      expect(result).toHaveLength(2);
      expect(result[0].embed_code).toBe("{{embed:block-1}}");
      expect(result[1].embed_code).toBe("{{embed:block-2}}");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("it stops pagination when no next link is returned", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-1}}" })],
        links: [],
      });

      fetchMock.mockResolvedValue(createJsonResponse(page1));

      const result = await client.fetchAllBlocks();
      evaluatePage(result);
    });

    test("it collects multiple results from each page", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [
          createBlockSearchResult({ embed_code: "{{embed:block-1}}" }),
          createBlockSearchResult({ embed_code: "{{embed:block-2}}" }),
        ],
        links: [
          {
            rel: "next",
            href: `${baseUrl}/api/blocks?page=2`,
          },
        ],
      });

      const page2 = createBlockSearchResponse({
        pages: 2,
        current_page: 2,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-3}}" })],
        links: [],
      });

      mockPaginatedResponses(fetchMock, page1, page2);

      const result = await client.fetchAllBlocks();

      expect(result).toHaveLength(3);
      expect(result.map((b) => b.embed_code)).toEqual([
        "{{embed:block-1}}",
        "{{embed:block-2}}",
        "{{embed:block-3}}",
      ]);
    });

    test("it propagates fetch errors during pagination", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult()],
        links: [
          {
            rel: "next",
            href: `${baseUrl}/api/blocks?page=2`,
          },
        ],
      });

      fetchMock.mockResolvedValueOnce(createJsonResponse(page1));
      fetchMock.mockResolvedValueOnce(createErrorResponse(500));

      await expect(client.fetchAllBlocks()).rejects.toThrow(
        "Failed to fetch blocks: 500",
      );
    });

    test("it rejects pagination links outside the configured base origin", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult()],
        links: [
          {
            rel: "next",
            href: "https://malicious.test/api/blocks?page=2",
          },
        ],
      });

      fetchMock.mockResolvedValue(createJsonResponse(page1));

      await expect(client.fetchAllBlocks()).rejects.toThrow(
        "Invalid pagination URL",
      );
    });

    test("it rejects pagination links outside the configured base path", async () => {
      const client = new APIClient("https://example.test/api/");
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult()],
        links: [
          {
            rel: "next",
            href: "https://example.test/other/blocks?page=2",
          },
        ],
      });

      fetchMock.mockResolvedValue(createJsonResponse(page1));

      await expect(client.fetchAllBlocks()).rejects.toThrow(
        "Invalid pagination URL",
      );
    });

    test("it accepts relative pagination links within the base path", async () => {
      const client = new APIClient(baseUrl);
      const page1 = createBlockSearchResponse({
        pages: 2,
        current_page: 1,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-1}}" })],
        links: [
          {
            rel: "next",
            href: "/api/blocks?page=2",
          },
        ],
      });

      const page2 = createBlockSearchResponse({
        pages: 2,
        current_page: 2,
        results: [createBlockSearchResult({ embed_code: "{{embed:block-2}}" })],
        links: [],
      });

      mockPaginatedResponses(fetchMock, page1, page2);

      const result = await client.fetchAllBlocks();

      expect(result).toHaveLength(2);
      expect(result[0].embed_code).toBe("{{embed:block-1}}");
      expect(result[1].embed_code).toBe("{{embed:block-2}}");
    });
  });
});
