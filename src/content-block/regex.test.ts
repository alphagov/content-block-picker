import { describe, test, expect, afterEach } from "vitest";
import regex, { isValidEmbedCode } from "./regex.ts";

describe("regex", () => {
  afterEach(() => {
    regex.lastIndex = 0;
  });

  test("matches an embed without an internal content path", () => {
    const input =
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![0]).toEqual(input);
    expect(result![2]).toEqual("content_block_pension");
    expect(result![3]).toEqual("1690ab79-1880-461e-99e4-ed146fd9efab");
    expect(result![4]).toBeUndefined();
  });

  test("matches an embed with an internal content path", () => {
    const input =
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab/rates/rate-1/amount}}";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![2]).toEqual("content_block_pension");
    expect(result![3]).toEqual("1690ab79-1880-461e-99e4-ed146fd9efab");
    expect(result![4]).toEqual("/rates/rate-1/amount");
  });

  test("matches an embed with a format specifier", () => {
    const input =
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab#some_format}}";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![2]).toEqual("content_block_pension");
    expect(result![3]).toEqual("1690ab79-1880-461e-99e4-ed146fd9efab");
    expect(result![5]).toEqual("#some_format");
  });

  test.each([
    "contact",
    "content_block_pension",
    "content_block_contact",
    "content_block_tax",
    "content_block_time_period",
  ])("matches document type: %s", (type) => {
    const input = `{{embed:${type}:1690ab79-1880-461e-99e4-ed146fd9efab}}`;
    const result = regex.exec(input);
    regex.lastIndex = 0;

    expect(result).not.toBeNull();
    expect(result![2]).toEqual(type);
  });

  test("matches a content ID alias instead of a UUID", () => {
    const input = "{{embed:content_block_pension:my-pension-block}}";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![3]).toEqual("my-pension-block");
  });

  test("matches aliases with en-dash and em-dash characters", () => {
    const input = "{{embed:content_block_tax:some–alias—here}}";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![3]).toEqual("some–alias—here");
  });

  test("does not match an unsupported document type", () => {
    const input =
      "{{embed:content_block_unknown:1690ab79-1880-461e-99e4-ed146fd9efab}}";
    expect(regex.exec(input)).toBeNull();
  });

  test("does not match malformed brackets", () => {
    const input =
      "{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}";
    expect(regex.exec(input)).toBeNull();
  });

  test("finds multiple embeds in a single string", () => {
    const input =
      "Hello {{embed:contact:abc-123}} and {{embed:content_block_tax:def-456}}";
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(input)) !== null) {
      matches.push(match[0]);
    }

    expect(matches).toEqual([
      "{{embed:contact:abc-123}}",
      "{{embed:content_block_tax:def-456}}",
    ]);
  });

  test("matches an embed surrounded by other text", () => {
    const input =
      "Some text {{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}} more text";
    const result = regex.exec(input);

    expect(result).not.toBeNull();
    expect(result![0]).toEqual(
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}",
    );
  });

  test("validates full embed codes only", () => {
    expect(
      isValidEmbedCode(
        "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}",
      ),
    ).toBe(true);

    expect(isValidEmbedCode("prefix {{embed:contact:abc-123}} suffix")).toBe(
      false,
    );
    expect(isValidEmbedCode("not an embed code")).toBe(false);
  });
});
