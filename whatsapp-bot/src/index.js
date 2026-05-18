import 'dotenv/config';
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { isAllowed, allowlistSize } from './allowlist.js';
import { askClaude, resetSession } from './claude-agent.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'warn' });

function extractText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    null
  );
}

async function start() {
  if (allowlistSize() === 0) {
    console.warn(
      '⚠  ALLOWED_JIDS is empty. The bot will not respond to anyone until you set it in .env.',
    );
  }

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Claude Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('\nScan this QR with WhatsApp → Settings → Linked Devices → Link a Device:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('✓ WhatsApp connected. Bot is live.');
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(`Connection closed (code=${code}). ${loggedOut ? 'Logged out — delete auth_info_baileys/ to re-pair.' : 'Reconnecting…'}`);
      if (!loggedOut) start().catch((err) => console.error('Reconnect failed:', err));
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid;
      const text = extractText(msg);
      if (!jid || !text) continue;

      if (!isAllowed(jid)) {
        console.log(`✗ Blocked: ${jid} — "${text.slice(0, 60)}"`);
        continue;
      }

      console.log(`→ [${jid}] ${text}`);

      if (text.trim() === '/reset') {
        resetSession(jid);
        await sock.sendMessage(jid, { text: 'Conversation reset.' });
        continue;
      }

      try {
        await sock.sendPresenceUpdate('composing', jid);
        const reply = await askClaude(jid, text);
        console.log(`← [${jid}] ${reply.slice(0, 120)}${reply.length > 120 ? '…' : ''}`);
        await sock.sendMessage(jid, { text: reply });
      } catch (err) {
        console.error('Claude error:', err);
        await sock.sendMessage(jid, { text: `⚠ Error: ${err.message}` });
      } finally {
        await sock.sendPresenceUpdate('paused', jid).catch(() => {});
      }
    }
  });
}

start().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
