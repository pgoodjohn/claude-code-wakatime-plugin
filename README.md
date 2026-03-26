# Claude Code WakaTime Plugin

Track your AI coding activity in [WakaTime](https://wakatime.com) (or any compatible self-hosted backend like [Wakapi](https://wakapi.dev)) while using Claude Code.

## What It Does

Sends WakaTime heartbeats when Claude Code reads, edits, or writes files. Your Claude Code sessions show up on your WakaTime dashboard alongside your regular editor activity.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- [wakatime-cli](https://github.com/wakatime/wakatime-cli) installed (via Homebrew, your editor's WakaTime plugin, or manually)
- A WakaTime API key (get one at https://wakatime.com/api-key)

## Installation

1. **Clone this repo:**

   ```bash
   git clone https://github.com/your-username/claude-code-wakatime-plugin.git
   cd claude-code-wakatime-plugin
   ```

2. **Build:**

   ```bash
   npm install && npm run build
   ```

3. **Load the plugin with Claude Code** (choose one):

   **Per-session:** launch Claude Code with the `--plugin-dir` flag:

   ```bash
   claude --plugin-dir /path/to/claude-code-wakatime-plugin
   ```

   **Permanent:** add it to your Claude Code settings (`~/.claude/settings.json`):

   ```json
   {
     "pluginDirs": ["/path/to/claude-code-wakatime-plugin"]
   }
   ```

4. **Configure WakaTime** (if not already configured):

   Create or edit `~/.wakatime.cfg`:

   ```ini
   [settings]
   api_key = your-api-key-here
   ```

5. **Restart Claude Code** to load the plugin.

## Custom / Self-Hosted Endpoint

To point to a self-hosted WakaTime backend (like Wakapi), set `api_url` in `~/.wakatime.cfg`:

```ini
[settings]
api_key = your-api-key-here
api_url = https://your-wakapi-instance.com/api
```

That's it — the plugin delegates all API communication to `wakatime-cli`, which reads this config automatically.

## How It Works

The plugin hooks into three Claude Code events:

| Event | Trigger | What's Tracked |
|-------|---------|---------------|
| **PostToolUse** | Claude reads, edits, or writes a file | The specific file path |
| **SessionStart** | A Claude Code session begins | The working directory |
| **SessionEnd** | A Claude Code session ends | The working directory |

Heartbeats are sent via `wakatime-cli` in the background — they never block Claude Code. If `wakatime-cli` isn't installed or fails, the plugin exits silently.

## Verifying It Works

After a Claude Code session, check your WakaTime dashboard. You should see activity attributed to "Claude Code" as the editor.

You can also check `~/.wakatime/wakatime.log` for heartbeat entries.

## License

MIT
