/* global process */
import { execSync } from "child_process";

const baseRef = process.env.GITHUB_BASE_REF || process.argv[2];
const headSha = process.env.GITHUB_SHA || process.argv[3];

if (!baseRef || !headSha) {
  throw new Error("Missing pull request context. Pass base ref and head SHA or run in GitHub Actions.");
}

execSync(`git fetch origin ${baseRef} --depth=1`, { stdio: "inherit" });

const commits = execSync(`git rev-list origin/${baseRef}..${headSha}`, { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

if (commits.length === 0) {
  console.error("No commits found in this pull request.");
  process.exit(1);
}

for (const sha of commits) {
  const message = execSync(`git log --format=%s -n 1 ${sha}`, { encoding: "utf8" }).trim();

  try {
    execSync("npx commitlint --config commitlint.config.js", {
      input: `${message}\n`,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    process.exit(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // Keep checking until at least one commit passes.
  }
}

console.error("At least one commit in this pull request must use conventional commits format.");
process.exit(1);
