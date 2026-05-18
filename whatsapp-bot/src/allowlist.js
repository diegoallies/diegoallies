const raw = process.env.ALLOWED_JIDS || '';

const allowed = new Set(
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isAllowed(jid) {
  if (!jid) return false;
  if (allowed.size === 0) return false;
  return allowed.has(jid);
}

export function allowlistSize() {
  return allowed.size;
}
