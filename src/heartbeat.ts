import { spawn } from "node:child_process";
import { basename } from "node:path";
import { findWakatimeCli } from "./cli.js";

interface HookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
}

const WRITE_TOOLS = new Set(["Edit", "Write"]);

function extractEntity(input: HookInput): string | null {
  const toolInput = input.tool_input;
  if (toolInput) {
    const filePath =
      (toolInput.file_path as string) ?? (toolInput.path as string);
    if (filePath) return filePath;
  }
  return input.cwd ?? null;
}

function sendHeartbeat(
  cliPath: string,
  entity: string,
  opts: {
    isWrite: boolean;
    entityType: "file" | "app";
    project?: string;
  }
): void {
  const args = [
    "--entity",
    entity,
    "--entity-type",
    opts.entityType,
    "--plugin",
    "claude-code-wakatime/0.1.0",
    "--time",
    (Date.now() / 1000).toFixed(3),
  ];

  if (opts.project) {
    args.push("--project", opts.project);
  }

  if (opts.isWrite) {
    args.push("--write");
  }

  const child = spawn(cliPath, args, {
    stdio: "ignore",
    detached: true,
  });
  child.unref();
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString()));
    process.stdin.on("error", () => resolve(""));
  });
}

async function main(): Promise<void> {
  const cliPath = findWakatimeCli();
  if (!cliPath) return;

  let input: HookInput;
  try {
    const raw = await readStdin();
    if (!raw.trim()) return;
    input = JSON.parse(raw);
  } catch {
    return; // malformed input, exit silently
  }

  const event = input.hook_event_name;
  const cwd = input.cwd;
  const project = cwd ? basename(cwd) : undefined;

  if (event === "SessionStart" || event === "SessionEnd") {
    if (!cwd) return;
    sendHeartbeat(cliPath, cwd, {
      isWrite: false,
      entityType: "app",
      project,
    });
    return;
  }

  // PostToolUse
  const entity = extractEntity(input);
  if (!entity) return;

  const isWrite = WRITE_TOOLS.has(input.tool_name ?? "");

  sendHeartbeat(cliPath, entity, {
    isWrite,
    entityType: "file",
    project,
  });
}

main().catch(() => {
  // Never crash, never block Claude Code
});
