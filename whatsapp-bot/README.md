# WhatsApp Claude Bot

A personal WhatsApp bot powered by your **Claude Code subscription** (not API tokens). It links to your phone via QR code like WhatsApp Web, and Claude has full filesystem + shell access to the machine it runs on.

## How it works

```
Your phone (WhatsApp)
       │
       ▼  Baileys (multi-device protocol, QR pairing)
  Node process on your PC
       │
       ▼  @anthropic-ai/claude-agent-sdk
  Claude — with Read / Write / Edit / Bash / Glob / Grep tools
       │
       ▼  reply
  Back to your phone
```

The Agent SDK auto-detects your local Claude Code login and uses your subscription. If `ANTHROPIC_API_KEY` is set, it falls back to API billing instead.

## Setup (on your PC)

### 1. Prerequisites

- Node.js 20+
- Logged in to Claude Code with your Pro/Max subscription:
  ```
  claude login
  ```

### 2. Install

```
cd whatsapp-bot
npm install
```

### 3. Configure

```
cp .env.example .env
```

Leave `ALLOWED_JIDS` empty for now — you'll fill it in after the first message.

### 4. First run (pair + find your JID)

```
npm start
```

- A QR code prints in the terminal. On your phone: **WhatsApp → Settings → Linked Devices → Link a Device** and scan it.
- Once connected, send any message to your own number from another device (or use WhatsApp's "message yourself" feature).
- The bot will refuse to reply (allowlist is empty) but logs the sender's JID, e.g.:
  ```
  ✗ Blocked: 14155551234@s.whatsapp.net — "hi"
  ```
- Copy that JID into `.env`:
  ```
  ALLOWED_JIDS=14155551234@s.whatsapp.net
  ```
- Restart the bot. You're live.

## Usage

Just chat. The bot remembers the conversation per chat (via Agent SDK session resumption).

Special commands:
- `/reset` — clear the conversation history for your chat

Examples to try:
- *"What's in my Downloads folder?"*
- *"Read my package.json and tell me what scripts are defined."*
- *"Create a file called notes.md with today's date as the header."*
- *"Find all TODO comments in this repo."*

## ⚠ Security

This bot has **full shell access** as the user running it. Treat it like giving someone an SSH session.

- **Allowlist is fail-closed.** Empty `ALLOWED_JIDS` = nobody can use it.
- **Only allowlist numbers you 100% trust** — anyone on the list can `rm -rf` your home directory through chat.
- **Don't run as root.**
- **Sandbox if you can:** set `WORK_DIR=/home/you/bot-sandbox` so the bot's `cwd` is a scoped folder. (Bash can still escape, but it makes accidents less likely.)
- **WhatsApp ToS:** unofficial libraries on personal numbers technically violate ToS. Low risk for personal use, but consider a secondary number if you care.

## Troubleshooting

- **"Logged out" on startup** → delete `auth_info_baileys/` and re-scan the QR.
- **No reply, no log line** → JID isn't in `ALLOWED_JIDS`. Check the console for the blocked-message log.
- **Hit subscription limits** → set `ANTHROPIC_API_KEY` in `.env` to fall back to API billing.

## Extracting to its own repo

This was scaffolded inside another repo. To move it out:

```
cp -r whatsapp-bot ~/whatsapp-bot && cd ~/whatsapp-bot
git init && git add . && git commit -m "init"
# create the repo on github.com, then:
git remote add origin git@github.com:<you>/whatsapp-bot.git
git push -u origin main
```
