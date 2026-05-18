import { query } from '@anthropic-ai/claude-agent-sdk';

const sessions = new Map();

const SYSTEM_APPEND =
  "You are a personal assistant chatting with the user over WhatsApp. " +
  "Keep replies concise and chat-friendly — short paragraphs, no markdown headings. " +
  "You have full filesystem and shell access on the user's PC via your tools. " +
  "When the user asks you to do something on their machine, just do it and report back briefly.";

export async function askClaude(jid, userMessage) {
  const resumeId = sessions.get(jid);
  const workDir = process.env.WORK_DIR || process.cwd();

  const textChunks = [];
  let latestSessionId = resumeId;

  const options = {
    cwd: workDir,
    permissionMode: 'bypassPermissions',
    allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: SYSTEM_APPEND,
    },
  };

  if (resumeId) options.resume = resumeId;

  for await (const event of query({ prompt: userMessage, options })) {
    if (event.type === 'system' && event.subtype === 'init' && event.session_id) {
      latestSessionId = event.session_id;
    }
    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'text' && block.text) textChunks.push(block.text);
      }
    }
    if (event.type === 'result' && event.session_id) {
      latestSessionId = event.session_id;
    }
  }

  if (latestSessionId) sessions.set(jid, latestSessionId);

  const reply = textChunks.join('\n').trim();
  return reply || '(no response)';
}

export function resetSession(jid) {
  sessions.delete(jid);
}
