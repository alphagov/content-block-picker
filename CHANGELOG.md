# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 6c0aff0..HEAD - 2026-09-03

- Improve SCSS bundling
- Symlink fonts bundled with govuk-frontend
- Fix vite config warnings
- Fix package file issues
- Adds a preview metadata block
- Cache the blocks returned from the 'fetchAllBlocks' call
- Rename cache to previewCache
- Use a template for rendering the block list
- Time Period is now Time period
- Add nunjucks templating engine
- Fix typing on the DOMPurify hook
- Move API response types to a separate file
- Refactor promises to async/await in content-block-picker.ts
- Refactor promises to async/await in API client
- Remove old release job from CI
- Include repo url in package.json
- Add a build step to CI runs
