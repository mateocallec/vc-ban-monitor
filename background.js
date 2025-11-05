/**
 * @file background.js
 * @brief Periodically checks Roblox voice chat ban status and stores it locally.
 */

const CHECK_INTERVAL_MINUTES = 1; /**< Periodic check interval in minutes */
const FAST_CHECK_INTERVAL_MS = 10000; /**< Minimum interval for fast refresh in milliseconds */

let lastCheck = 0; /**< Timestamp of the last check */
let lastData = null; /**< Last retrieved data */
let isActive = true; /**< Whether the extension/service is active */

/**
 * @brief Fetches Roblox voice chat settings.
 * @return {Promise<Object>} Returns an object containing either `data` or `error`.
 */
async function fetchSettings() {
  if (!isActive) return { error: 'inactive' };

  try {
    const resp = await fetch('https://voice.roblox.com/v1/settings', {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
    });

    if (!resp.ok) return { error: resp.status };

    const data = await resp.json();
    return { data };
  } catch (e) {
    return { error: 'exception' };
  }
}

/**
 * @brief Parses voice chat ban information from settings data.
 * @param {Object|null} data - The settings data returned from fetchSettings().
 * @return {Object} An object containing `banned` (boolean) and `expiresAt` (timestamp or null).
 */
function parseBanInfo(data) {
  if (!data) return { banned: false, expiresAt: null };

  const ts =
    data.voiceBanExpiration || data.voice_ban_expires_at || data.bannedUntil;

  if (ts) {
    let expiresAt;

    // New Roblox API: { Seconds, Nanos }
    if (typeof ts === 'object' && ts.Seconds) {
      expiresAt = ts.Seconds * 1000; // convert seconds → ms
    }
    // Timestamp already a number (ms)
    else if (typeof ts === 'number') {
      expiresAt = ts;
    }
    // String timestamp / ISO Date
    else {
      expiresAt = Date.parse(ts);
    }

    if (!isNaN(expiresAt)) {
      return { banned: true, expiresAt };
    }
  }

  // If Roblox provides a boolean ban flag only
  if (typeof data.isBanned === 'boolean') {
    return { banned: data.isBanned, expiresAt: null };
  }

  // Backup format: voice.blockedUntil
  if (data.voice && data.voice.blockedUntil) {
    const expiresAt = Date.parse(data.voice.blockedUntil);
    if (!isNaN(expiresAt)) return { banned: true, expiresAt };
  }

  return { banned: false, expiresAt: null };
}

/**
 * @brief Checks the current ban status and stores it in local storage.
 * @param {boolean} force - If true, bypasses the fast refresh throttle.
 */
async function checkAndStore(force = false) {
  if (!isActive) return;

  const now = Date.now();

  // Throttle rapid requests
  if (!force && lastData && now - lastCheck < FAST_CHECK_INTERVAL_MS) {
    try {
      await chrome.storage.local.set({ ...lastData, lastCheck: now });
    } catch (e) {
      console.error('Error updating storage:', e);
    }
    return;
  }

  const r = await fetchSettings();

  if (r.error) {
    try {
      await chrome.storage.local.set({ lastCheck: now, error: r.error });
    } catch (e) {
      console.error('Error updating storage:', e);
    }
    return;
  }

  const parsed = parseBanInfo(r.data);
  lastData = {
    lastCheck: now,
    raw: r.data,
    banned: parsed.banned,
    expiresAt: parsed.expiresAt || null,
  };

  try {
    await chrome.storage.local.set(lastData);
  } catch (e) {
    console.error('Error updating storage:', e);
  }
}

/**
 * @brief Initializes the periodic alarm when the extension is installed.
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('vc-check', { periodInMinutes: CHECK_INTERVAL_MINUTES });
  checkAndStore();
});

/**
 * @brief Ensures the periodic alarm is active when the browser starts.
 */
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.get('vc-check', (alarm) => {
    if (!alarm)
      chrome.alarms.create('vc-check', {
        periodInMinutes: CHECK_INTERVAL_MINUTES,
      });
  });
  isActive = true;
});

/**
 * @brief Listens for periodic alarms to trigger a check.
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'vc-check') checkAndStore();
});

/**
 * @brief Handles messages from content scripts.
 * @param {any} msg - Message received from content script.
 * @param {Object} sender - Sender of the message.
 * @param {Function} sendResponse - Function to send a response back.
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!isActive) {
    sendResponse({ ok: false, error: 'Extension inactive' });
    return;
  }

  if (msg === 'force-refresh') {
    checkAndStore(true)
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true; // Async response
  }

  if (msg === 'fast-refresh') {
    checkAndStore()
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }

  if (msg === 'get-state') {
    chrome.storage.local.get(['banned', 'expiresAt', 'error'], (res) => {
      sendResponse({ ok: true, state: res });
    });
    return true;
  }
});

/**
 * @brief Cleans up when the service worker is suspended.
 */
chrome.runtime.onSuspend.addListener(() => {
  isActive = false;
});
