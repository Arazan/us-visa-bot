import fetch from 'node-fetch';

export function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

export function randomDelay(minSeconds, maxSeconds) {
  return Math.random() * (maxSeconds - minSeconds) + minSeconds;
}

export function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  sendToDiscord(line);
}

// Discord webhook logging (fire-and-forget, serialized to respect rate limits).
const DISCORD_MAX_LEN = 1900; // leave headroom under Discord's 2000-char limit
let discordQueue = Promise.resolve();

function sendToDiscord(message) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const content = message.length > DISCORD_MAX_LEN
    ? message.slice(0, DISCORD_MAX_LEN - 3) + '...'
    : message;

  discordQueue = discordQueue.then(() => postToDiscord(url, content)).catch(() => {});
}

async function postToDiscord(url, content) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      const retryMs = Math.ceil((data.retry_after ?? 1) * 1000);
      await new Promise(r => setTimeout(r, retryMs));
      return postToDiscord(url, content);
    }

    if (!res.ok) {
      console.error(`[discord] webhook failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error(`[discord] webhook error: ${err.message}`);
  }
}

export function isSocketHangupError(err) {
  return err.code === 'ECONNRESET' || 
         err.code === 'ENOTFOUND' || 
         err.code === 'ETIMEDOUT' ||
         err.message.includes('socket hang up') ||
         err.message.includes('network') ||
         err.message.includes('connection');
}