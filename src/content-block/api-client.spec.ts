import { beforeEach, describe, expect, Mock, test, vi } from "vitest";
import { APIClient } from "./api-client";
import { BlocksResponse, BlockType } from "../@types";

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
    expect(result).toEqual({ ...expectedPayload, valid: true, error: null });
  });

  test("it reuses cached requests for the same embed code", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const payload: BlockResponse = { html: "<p>Cached</p>" };
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createSuccessResponse(payload));

    const firstResult = await client.fetchPreview(embedCode);
    const secondResult = await client.fetchPreview(embedCode);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({ ...payload, valid: true, error: null });
    expect(secondResult).toEqual({ ...payload, valid: true, error: null });
  });

  test("it caches failed requests to prevent repeated failures", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createErrorResponse(500));

    const firstResult = await client.fetchPreview(embedCode);
    expect(firstResult.error).toBeInstanceOf(Error);
    expect(firstResult.error!.message).toContain("Failed to fetch block");
    expect(firstResult.html).toBeNull();
    expect(firstResult.valid).toBe(false);

    const secondResult = await client.fetchPreview(embedCode);

    // Failed requests are now cached to enable hover preview feedback
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(secondResult).toEqual(firstResult);
  });

  test("it returns a cached promise only when present", async () => {
    const embedCode = "{{embed:contact:abc-123}}";
    const payload: BlockResponse = { html: "<p>Cached lookup</p>" };
    const client = new APIClient("http://not-used.test");

    fetchMock.mockResolvedValue(createSuccessResponse(payload));

    expect(client.get(embedCode)).toBeUndefined();

    const pending = client.fetchPreview(embedCode);
    expect(client.get(embedCode)).toBe(pending);
    await expect(pending).resolves.toEqual({
      ...payload,
      valid: true,
      error: null,
    });
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

  test("it caches and returns specific error messages for invalid embed codes", async () => {
    const client = new APIClient(baseUrl);

    const result = await client.fetchPreview("not an embed code");

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toContain("Invalid embed code");
    expect(result.valid).toBe(false);
    expect(result.html).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    const cachedResult = await client.fetchPreview("not an embed code");
    expect(cachedResult).toEqual(result);
    expect(fetchMock).not.toHaveBeenCalled(); // Still no fetch call
  });

  test("it allows retrieval of cached error results via get()", async () => {
    const embedCode = "{{embed:contact:missing-123}}";
    const client = new APIClient(baseUrl);

    fetchMock.mockResolvedValue(createErrorResponse(404));

    await client.fetchPreview(embedCode);

    const cachedPromise = client.get(embedCode);
    expect(cachedPromise).toBeDefined();

    const result = await cachedPromise!;
    expect(result.valid).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toContain("Failed to fetch block");
    expect(result.html).toBeNull();
  });

  describe("fetchAllBlocks", () => {
    const payload: BlocksResponse = {
      results: [
        {
          title: "Sample Pension Block 1",
          block_type: BlockType.Pension,
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
          block_type: BlockType.TimePeriod,
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

    test("it skips unsupported block types and warns", async () => {
      const client = new APIClient(baseUrl);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const payloadWithUnsupportedType: BlocksResponse = {
        results: [
          ...payload.results,
          {
            title: "Unsupported Block",
            block_type: "Unknown" as BlockType,
            organisation: {
              name: "AI Security Institute",
              content_id: "11111111-2222-3333-4444-000000000999",
            },
            state: "published",
            embed_code: "{{embed:content_block_unknown:sample-unknown-1}}",
            formats: [],
          },
        ],
      };

      fetchMock.mockResolvedValue(
        createJsonResponse(payloadWithUnsupportedType),
      );

      const result = await client.fetchAllBlocks();

      expect(result).toEqual(payload.results);
      expect(warnSpy).toHaveBeenCalledWith(
        'Skipping unsupported block type "Unknown" for block "Unsupported Block".',
      );
      warnSpy.mockRestore();
    });

    test('it skips blocks with titles that start with "E2E Test"', async () => {
      const client = new APIClient(baseUrl);
      const payloadWithE2ETestTitle: BlocksResponse = {
        results: [
          ...payload.results,
          {
            title: "E2E Test Pension Block",
            block_type: BlockType.Pension,
            organisation: {
              name: "AI Security Institute",
              content_id: "11111111-2222-3333-4444-000000000998",
            },
            state: "published",
            embed_code: "{{embed:content_block_pension:e2e-test-pension-1}}",
            formats: [],
          },
        ],
      };

      fetchMock.mockResolvedValue(createJsonResponse(payloadWithE2ETestTitle));

      const result = await client.fetchAllBlocks();

      expect(result).toEqual(payload.results);
    });
  });

  describe("fetchBlock", () => {
    const embedCode = "{{embed:content_block_pension:sample-pension-1}}";
    const block = {
      title: "Sample Pension Block 1",
      block_type: BlockType.Pension,
      organisation: {
        name: "AI Security Institute",
        content_id: "11111111-2222-3333-4444-000000000000",
      },
      state: "published",
      embed_code: embedCode,
      formats: [],
    };
    const payload: BlocksResponse = { results: [block] };

    test("it fetches the specified block", async () => {
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createJsonResponse(payload));

      const result = await client.fetchBlock(embedCode);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/api/blocks/?keyword=${encodeURIComponent(embedCode)}`,
      );
      expect(result).toEqual(block);
    });

    test("it throws when the response is not ok", async () => {
      const client = new APIClient(baseUrl);

      fetchMock.mockResolvedValue(createErrorResponse(404));

      await expect(client.fetchBlock(embedCode)).rejects.toThrow(
        `Failed to fetch block ${embedCode}: 404`,
      );
    });

    test("it throws when the block type is unsupported", async () => {
      const client = new APIClient(baseUrl);
      const unsupportedPayload: BlocksResponse = {
        results: [
          {
            ...block,
            block_type: "Unknown" as BlockType,
            title: "Unsupported Block",
          },
        ],
      };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      fetchMock.mockResolvedValue(createJsonResponse(unsupportedPayload));

      await expect(client.fetchBlock(embedCode)).rejects.toThrow(
        `Unsupported block type for embed code {{embed:content_block_pension:sample-pension-1}}.`,
      );
      warnSpy.mockRestore();
    });

    test("it throws when the block title has excluded prefix", async () => {
      const client = new APIClient(baseUrl);
      const excludedPayload: BlocksResponse = {
        results: [
          {
            ...block,
            title: "E2E Test Block",
          },
        ],
      };

      fetchMock.mockResolvedValue(createJsonResponse(excludedPayload));

      await expect(client.fetchBlock(embedCode)).rejects.toThrow(
        `for embed code {{embed:content_block_pension:sample-pension-1}}`,
      );
    });
  });
});
