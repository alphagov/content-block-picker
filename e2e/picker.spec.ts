import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("Content Block Picker", () => {
  test("it makes the highlighter visible", async ({ page }) => {
    const wrapper = page.locator(".content-block-highlight__wrapper");
    const textarea = page.locator("textarea.content-block-highlight__input");
    const highlight = page.locator(".content-block-highlight__highlight");

    await expect(wrapper).toBeVisible();
    await expect(textarea).toBeVisible();
    await expect(highlight).toBeVisible();
  });

  test("it detects and highlights embed codes", async ({ page }) => {
    const textarea = page.locator("textarea.content-block-highlight__input");
    const highlight = page.locator(".content-block-highlight__highlight");

    const embedCode =
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab}}";

    await textarea.fill(embedCode);

    const mark = highlight.locator("mark.content-block-highlight__mark");
    await expect(mark).toHaveText(embedCode);
  });

  test("it detects and highlights embed codes with a format specifier", async ({
    page,
  }) => {
    const textarea = page.locator("textarea.content-block-highlight__input");
    const highlight = page.locator(".content-block-highlight__highlight");

    const embedCode =
      "{{embed:content_block_pension:1690ab79-1880-461e-99e4-ed146fd9efab#some_format}}";

    await textarea.fill(embedCode);

    const mark = highlight.locator("mark.content-block-highlight__mark");
    await expect(mark).toHaveText(embedCode);
  });

  test("it syncs scrolling between textarea and highlight div", async ({
    page,
  }) => {
    const textarea = page.locator("textarea.content-block-highlight__input");
    const highlight = page.locator(".content-block-highlight__highlight");

    // Add enough content to make it scrollable
    const longContent = "Line\n".repeat(50) + "{{embed:contact:123}}";
    await textarea.fill(longContent);

    const mark = highlight.locator("mark.content-block-highlight__mark");
    await expect(mark).toBeVisible();

    // Scroll the textarea
    await textarea.evaluate((el) => {
      el.scrollTop = 100;
    });

    // Wait a moment for any observers/events
    await page.waitForTimeout(100);

    // Check if highlight div scrolled to the same position
    const scrollTop = await highlight.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBe(100);
  });

  test("it escapes HTML in the highlight overlay", async ({ page }) => {
    const textarea = page.locator("textarea.content-block-highlight__input");
    const highlight = page.locator(".content-block-highlight__highlight");

    const unsafeText = "<b>Bold</b> {{embed:contact:123}}";
    await textarea.fill(unsafeText);

    const mark = highlight.locator("mark.content-block-highlight__mark");
    await expect(mark).toBeVisible();

    // The highlighter should escape < and >
    const html = await highlight.innerHTML();
    expect(html).toContain("&lt;b&gt;Bold&lt;/b&gt;");
    // Mark should have the base class (may also have --invalid modifier)
    expect(html).toMatch(/content-block-highlight__mark/);
  });
});

test.describe("List available blocks", () => {
  test("it fetches and displays blocks when the insert button is clicked", async ({
    page,
  }) => {
    const mockBlocks = {
      results: [
        {
          title: "Pension Block A",
          block_type: "Pension",
          organisation: {
            name: "Test Org",
            content_id: "test-id-1",
          },
          state: "published",
          embed_code: "{{embed:content_block_pension:abc123}}",
          formats: [],
        },
        {
          title: "Time Period Block B",
          block_type: "Time period",
          organisation: {
            name: "Test Org",
            content_id: "test-id-2",
          },
          state: "published",
          embed_code: "{{embed:content_block_time_period:def456}}",
          formats: ["long_form", "years"],
        },
      ],
    };

    // Set up network interception for the blocks endpoint
    await page.route(/\/api\/blocks$/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBlocks),
      });
    });

    const insertButton = page.locator("#insert-content-block-button");
    const blockList = page.locator(".content-block-highlight__block-list");

    // Block list should be hidden initially
    await expect(blockList).toHaveAttribute("aria-hidden", "true");

    // Click the insert button
    await insertButton.click();

    // Block list should be visible with loading state
    await expect(blockList).toHaveAttribute("aria-hidden", "false");

    // Wait for the blocks to load and be displayed
    const topLevelList = blockList.locator(":scope > ul.govuk-list");
    await expect(topLevelList).toBeVisible();
    await expect(topLevelList.locator(":scope > li")).toHaveCount(2);

    // Check first block (no formats)
    const firstBlock = topLevelList.locator(":scope > li").first();
    await expect(firstBlock.locator(":scope > button")).toHaveText(
      "Pension Block A",
    );
    await expect(firstBlock).toHaveAttribute(
      "data-embed-code",
      "{{embed:content_block_pension:abc123}}",
    );

    // Check second block (with formats)
    const secondBlock = topLevelList.locator(":scope > li").nth(1);
    await expect(secondBlock.locator(":scope > button")).toHaveText(
      "Time Period Block B",
    );
    await expect(secondBlock).toHaveAttribute(
      "data-embed-code",
      "{{embed:content_block_time_period:def456}}",
    );

    // Check that formats are displayed as nested list for second block
    const secondBlockFormatsList = secondBlock.locator(":scope > ul");
    await expect(secondBlockFormatsList).toBeVisible();
    await expect(secondBlockFormatsList.locator(":scope > li")).toHaveCount(2);
    await expect(
      secondBlockFormatsList
        .locator(":scope > li")
        .first()
        .locator(":scope > button"),
    ).toHaveText("long_form");
    await expect(
      secondBlockFormatsList
        .locator(":scope > li")
        .nth(1)
        .locator(":scope > button"),
    ).toHaveText("years");
    await expect(
      secondBlockFormatsList.locator(":scope > li").first(),
    ).toHaveAttribute(
      "data-embed-code",
      "{{embed:content_block_time_period:def456#long_form}}",
    );
    await expect(
      secondBlockFormatsList.locator(":scope > li").nth(1),
    ).toHaveAttribute(
      "data-embed-code",
      "{{embed:content_block_time_period:def456#years}}",
    );
  });

  test("it hides the block list when clicking outside of it", async ({
    page,
  }) => {
    const mockBlocks = {
      results: [
        {
          title: "Test Block",
          block_type: "Pension",
          organisation: {
            name: "Test Org",
            content_id: "test-id",
          },
          state: "published",
          embed_code: "{{embed:content_block_pension:test}}",
          formats: [],
        },
      ],
    };

    await page.route(/\/api\/blocks$/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBlocks),
      });
    });

    const insertButton = page.locator("#insert-content-block-button");
    const blockList = page.locator(".content-block-highlight__block-list");
    const textarea = page.locator("textarea.content-block-highlight__input");

    // Click the insert button to show the block list
    await insertButton.click();
    await expect(blockList).toHaveAttribute("aria-hidden", "false");

    // Click outside the block list (on the textarea)
    await textarea.click();

    // Block list should be hidden
    await expect(blockList).toHaveAttribute("aria-hidden", "true");
  });

  test("it displays an error message when block fetch fails", async ({
    page,
  }) => {
    // Mock the API endpoint to return a 500 error
    await page.route(/\/api\/blocks$/, (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    const insertButton = page.locator("#insert-content-block-button");
    const blockList = page.locator(".content-block-highlight__block-list");

    // Click the insert button
    await insertButton.click();

    // Block list should be visible with error message
    await expect(blockList).toHaveAttribute("aria-hidden", "false");
    await expect(blockList).toContainText("Unable to load blocks.");
  });

  test("it inserts the embed code into the textarea and returns focus when a block is clicked", async ({
    page,
  }) => {
    const mockBlocks = {
      results: [
        {
          title: "Pension Block A",
          block_type: "Pension",
          organisation: { name: "Test Org", content_id: "test-id-1" },
          state: "published",
          embed_code: "{{embed:content_block_pension:abc123}}",
          formats: [],
        },
      ],
    };

    await page.route(/\/api\/blocks$/, (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBlocks),
      });
    });

    const insertButton = page.locator("#insert-content-block-button");
    const blockList = page.locator(".content-block-highlight__block-list");
    const textarea = page.locator("textarea.content-block-highlight__input");

    await insertButton.click();

    // Wait for the block list to populate
    const firstBlockButton = blockList.locator("li button").first();
    await expect(firstBlockButton).toBeVisible();

    await firstBlockButton.click();

    // Embed code should appear in the textarea
    await expect(textarea).toHaveValue(
      "{{embed:content_block_pension:abc123}}",
    );

    // Block list should be dismissed
    await expect(blockList).toHaveAttribute("aria-hidden", "true");

    // Focus should have returned to the textarea
    await expect(textarea).toBeFocused();
  });
});
