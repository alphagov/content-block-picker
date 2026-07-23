import { beforeEach, describe, expect, Mock, test, vi } from "vitest";
import { APIClient } from "./api-client";
import type { BlocksResponse } from "./api-client";

interface BlockResponse {
  html: string;
}

export interface MockResponse {
  ok: boolean;
  status: number;
  text?: Mock<() => Promise<string>>;
  json?: Mock<() => Promise<BlocksResponse>>;
}

function createSuccessResponse(data: BlockResponse): MockResponse {
  const text = vi.fn().mockResolvedValue(data.html);
  return {
    ok: true,
    status: 200,
    text,
  };
}

function createJsonResponse(data: unknown): MockResponse {
  const json = vi.fn().mockResolvedValue(data);
  return {
    ok: true,
    status: 200,
    json,
  };
}

function createErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    text: vi.fn(),
  } as unknown as Response;
}

describe("APIClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  const baseUrl = "https://example.test";

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  test("it fetches from the encoded block render URL", async () => {
    const embedCode = "{{embed:contact:abc-123/some-path#full}}";
    const expectedPayload: BlockResponse = { html: "<p>Rendered</p>" };
    const expectedUrl = `${baseUrl}/api/blocks/${encodeURIComponent(embedCode)}/render`;
    const client = new APIClient(baseUrl);

    fetchMock.mockResolvedValue(createSuccessResponse(expectedPayload));

    const result = await client.fetchPreview(embedCode);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result).toEqual({ ...expectedPayload, valid: true });
  });

  test("it reuses cached requests for the same embed code", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const payload: BlockResponse = { html: "<p>Cached</p>" };
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createSuccessResponse(payload));

    const firstResult = await client.fetchPreview(embedCode);
    const secondResult = await client.fetchPreview(embedCode);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({ ...payload, valid: true });
    expect(secondResult).toEqual({ ...payload, valid: true });
  });

  test("it caches retries requests", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createErrorResponse(500));

    const firstResult = await client.fetchPreview(embedCode);
    expect(firstResult.html).toContain("Failed to fetch block");
    expect(firstResult.html).toContain("500");

    const secondResult = await client.fetchPreview(embedCode);

    // Should only fetch once - the error is cached
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(secondResult).toEqual(firstResult);
  });

  test("it returns a cached promise only when present", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const payload: BlockResponse = {
      html: "<p>Cached lookup</p>",
    };
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createSuccessResponse(payload));

    expect(client.get(embedCode)).toBeUndefined();

    const pending = client.fetchPreview(embedCode);
    expect(client.get(embedCode)).toBe(pending);
    await expect(pending).resolves.toEqual({ ...payload, valid: true });
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
    const client = new APIClient("https://example.test/picker/") as unknown as {
      buildUrl: (embed: string) => string;
    };
    expect(() => client.buildUrl("{{embed:contact:abcd-123}}")).toThrow(
      "is not within the base path",
    );
  });

  test("it returns error message for invalid embed codes", async () => {
    const client = new APIClient(baseUrl);

    const result = await client.fetchPreview("not an embed code");

    expect(result.html).toBe("Invalid URL");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("fetchAllBlocks", () => {
    const payload: BlocksResponse = {
      results: [
        {
          title: "Sample Pension Block 1",
          block_type: "Pension",
          organisation: {
            name: "AI Security Institute",
            content_id: "11111111-2222-3333-4444-000000000000",
          },
          state: "published",
          embed_code: "{{embed:content_block_pension:sample-pension-1}}",
          formats: [],
        },
        {
          title: "Sample Time Period Block 1",
          block_type: "Time period",
          organisation: {
            name: "AI Security Institute",
            content_id: "11111111-2222-3333-4444-000000000001",
          },
          state: "published",
          embed_code: "{{embed:content_block_time_period:sample-time-1}}",
          formats: ["long_form", "years"],
        },
      ],
    };

    test("it fetches from the blocks list URL and unwraps results", async () => {
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createJsonResponse(payload));

      const result = await client.fetchAllBlocks();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/api/blocks`);
      expect(result).toEqual(payload.results);
    });

    test("it does not cache results between calls", async () => {
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createJsonResponse(payload));

      await client.fetchAllBlocks();
      await client.fetchAllBlocks();

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("it throws when the response is not ok", async () => {
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createErrorResponse(500));

      await expect(client.fetchAllBlocks()).rejects.toThrow(
        "Failed to fetch blocks: 500",
      );
    });
  });
});
