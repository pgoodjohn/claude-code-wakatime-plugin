import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

let cachedPath: string | null | undefined = undefined;

export function findWakatimeCli(): string | null {
  if (cachedPath !== undefined) return cachedPath;

  // 1. Check PATH
  try {
    const result = execFileSync("which", ["wakatime-cli"], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (result) {
      cachedPath = result;
      return cachedPath;
    }
  } catch {
    // not in PATH
  }

  // 2. Check ~/.wakatime/ for wakatime-cli-* binaries
  const wakatimeDir = join(homedir(), ".wakatime");
  try {
    const entries = readdirSync(wakatimeDir);
    const match = entries.find((e) => e.startsWith("wakatime-cli"));
    if (match) {
      cachedPath = join(wakatimeDir, match);
      return cachedPath;
    }
  } catch {
    // directory doesn't exist
  }

  console.error(
    "[claude-code-wakatime] wakatime-cli not found. Install it or add it to PATH."
  );
  cachedPath = null;
  return null;
}
