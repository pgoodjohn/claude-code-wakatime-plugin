import { spawn, execSync } from "node:child_process";
import { join } from "node:path";

describe("heartbeat script", () => {
  const heartbeatScript = join(__dirname, "..", "dist", "heartbeat.js");
  const nodePath = execSync("which node", { encoding: "utf-8" }).trim();

  function runHeartbeat(
    stdinData: string,
    envOverrides: Record<string, string> = {}
  ): Promise<{ code: number; stderr: string }> {
    return new Promise((resolve) => {
      const child = spawn(nodePath, [heartbeatScript], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...envOverrides },
      });

      const stderrChunks: Buffer[] = [];
      child.stderr?.on("data", (chunk) => stderrChunks.push(chunk));

      child.on("close", (code) => {
        resolve({
          code: code ?? 0,
          stderr: Buffer.concat(stderrChunks).toString(),
        });
      });

      child.stdin?.write(stdinData);
      child.stdin?.end();
    });
  }

  test("exits cleanly when wakatime-cli is not found", async () => {
    const result = await runHeartbeat(
      JSON.stringify({
        hook_event_name: "PostToolUse",
        cwd: "/tmp/test-project",
        tool_name: "Read",
        tool_input: { file_path: "/tmp/test-project/src/index.ts" },
      }),
      { HOME: "/nonexistent" }
    );

    expect(result.code).toBe(0);
    expect(result.stderr).toContain("wakatime-cli not found");
  });

  test("exits cleanly with empty stdin", async () => {
    const result = await runHeartbeat("", { HOME: "/nonexistent" });
    expect(result.code).toBe(0);
  });

  test("exits cleanly with malformed JSON", async () => {
    const result = await runHeartbeat("not json{{{", {
      HOME: "/nonexistent",
    });
    expect(result.code).toBe(0);
  });
});
