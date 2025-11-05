/**
 * @file content_script.js
 * @brief Manages the Roblox voice chat UI widget, showing mute/banned status and timers.
 */

/** SVG icons for voice status */
const ICONS = {
  voice:
    '<svg viewBox="-5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>microphone</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-107.000000, -309.000000)" fill="#ffffff"> <path d="M118,333 C121.866,333 125,329.866 125,326 L125,316 C125,312.134 121.866,309 118,309 C114.134,309 111,312.134 111,316 L111,326 C111,329.866 114.134,333 118,333 L118,333 Z M129,328 L127,328 C126.089,332.007 122.282,335 118,335 C113.718,335 109.911,332.007 109,328 L107,328 C107.883,332.799 112.063,336.51 117,336.955 L117,339 L116,339 C115.448,339 115,339.448 115,340 C115,340.553 115.448,341 116,341 L120,341 C120.552,341 121,340.553 121,340 C121,339.448 120.552,339 120,339 L119,339 L119,336.955 C123.937,336.51 128.117,332.799 129,328 L129,328 Z" id="microphone" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>',
  muted:
    '<svg viewBox="-3.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>microphone-off</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set-Filled" sketch:type="MSLayerGroup" transform="translate(-156.000000, -309.000000)" fill="#ffffff"> <path d="M169,335 C167.061,335 165.236,334.362 163.716,333.318 L162.31,334.742 C163.944,335.953 165.892,336.765 168,336.955 L168,339 L167,339 C166.448,339 166,339.448 166,340 C166,340.553 166.448,341 167,341 L171,341 C171.552,341 172,340.553 172,340 C172,339.448 171.552,339 171,339 L170,339 L170,336.955 C174.938,336.51 179.117,332.799 180,328 L178,328 C177.089,332.007 173.282,335 169,335 L169,335 Z M176,326 L176,320.739 L164.735,331.515 C165.918,332.432 167.386,333 169,333 C172.866,333 176,329.866 176,326 L176,326 Z M160.047,328.145 L160,328 L158,328 C158.109,328.596 158.271,329.175 158.478,329.733 L160.047,328.145 L160.047,328.145 Z M179.577,312.013 L155.99,334.597 L157.418,336.005 L181.014,313.433 L179.577,312.013 L179.577,312.013 Z M169,309 C165.134,309 162,312.134 162,316 L161.997,326.309 L175.489,313.401 C174.456,310.825 171.946,309 169,309 L169,309 Z" id="microphone-off" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>',
};

/**
 * @brief Formats milliseconds to mm:ss string.
 * @param {number} msLeft - Time in milliseconds.
 * @return {string} Formatted string in "mm:ss".
 */
function formatTime(msLeft) {
  if (typeof msLeft !== 'number' || msLeft <= 0) return '';
  const totalSeconds = Math.floor(msLeft / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * @brief Generates the inner HTML for the voice widget.
 * @param {boolean} muted - Whether the user is muted/banned.
 * @param {string} timeStr - Remaining time string or empty.
 * @return {string} HTML string for the widget.
 */
function getElementHTML(muted, timeStr) {
  const className = muted ? 'muted' : 'voice';
  const icon = muted ? ICONS.muted : ICONS.voice;
  const value = muted ? timeStr || 'Banned' : 'Enabled';
  return `<button id="vcban-label" type="button" class="btn-navigation-nav-robux-md c-${className}">
    <span class="nav-robux-icon rbx-menu-item">
      <span id="vcban-icon" class="icon-voice-28x28">${icon}</span>
      <span id="vcban-value" class="rbx-text-navbar-right text-header">${value}</span>
    </span>
  </button>`;
}

/**
 * @brief Clears any existing interval for updating the widget.
 * @param {HTMLElement} element - The widget element.
 */
function clearExistingInterval(element) {
  if (!element) return;
  const existing = element.__vcIntervalId;
  if (existing) {
    clearInterval(existing);
    element.__vcIntervalId = null;
  }
}

/**
 * @brief Renders the voice widget state.
 * @param {HTMLElement} element - The widget element.
 * @param {Object} state - State object { banned, expiresAt, error }.
 */
function render(element, state) {
  if (!element || !document.body.contains(element)) return;
  state = state || { banned: false, expiresAt: null, error: null };

  // Convert seconds → ms if needed
  if (state.expiresAt && state.expiresAt < 10_000_000_000) {
    state.expiresAt = state.expiresAt * 1000;
  }

  clearExistingInterval(element);

  const muted = !!state.banned;
  let remainingMs = state.expiresAt ? Number(state.expiresAt) - Date.now() : 0;
  if (remainingMs < 0) remainingMs = 0;

  element.innerHTML = getElementHTML(
    muted,
    remainingMs > 0 ? formatTime(remainingMs) : ''
  );

  // Update timer every second if temporarily banned
  if (muted && remainingMs > 0) {
    element.__vcIntervalId = setInterval(() => {
      remainingMs -= 1000;
      if (remainingMs <= 0) {
        clearExistingInterval(element);
        chrome.runtime.sendMessage('fast-refresh'); // refresh data from background
        element.innerHTML = getElementHTML(false, '');
      } else {
        element.innerHTML = getElementHTML(true, formatTime(remainingMs));
      }
    }, 1000);
  }
}

/**
 * @brief Sets up a listener for storage changes to update the widget dynamically.
 * @param {HTMLElement} element - The widget element.
 */
function setupStorageListener(element) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.banned || changes.expiresAt || changes.error) {
      let state = {
        banned: changes.banned
          ? changes.banned.newValue
          : changes.banned === undefined
            ? undefined
            : false,
        expiresAt: changes.expiresAt
          ? changes.expiresAt.newValue
          : changes.expiresAt === undefined
            ? undefined
            : null,
        error: changes.error ? changes.error.newValue : undefined,
      };

      // Fetch full state if values undefined
      if (state.banned === undefined || state.expiresAt === undefined) {
        chrome.storage.local.get(['banned', 'expiresAt', 'error'], (res) =>
          render(element, res)
        );
      } else {
        // Convert seconds → ms if needed
        if (state.expiresAt && state.expiresAt < 10_000_000_000) {
          state.expiresAt = state.expiresAt * 1000;
        }

        render(element, state);
      }
    }
  });
}

/**
 * @brief Sends a message to the background script and returns a Promise.
 * @param {any} message - Message to send.
 * @return {Promise<Object>} Resolves with response { ok, error }.
 */
function sendMessageToBackground(message) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { ok: false });
        }
      });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

/**
 * @brief Initializes the voice widget, renders state, and sets up listeners.
 */
(async function main() {
  const robuxElement = document.getElementById('navbar-robux');
  if (!robuxElement || !robuxElement.parentElement) return;
  const parent = robuxElement.parentElement;

  let widget = document.getElementById('navbar-voice');
  if (!widget) {
    widget = document.createElement('li');
    widget.id = 'navbar-voice';
    widget.className = 'navbar-icon-item';
    const fourthChild = parent.children[3];
    if (fourthChild) parent.insertBefore(widget, fourthChild);
    else parent.appendChild(widget);
  }

  // Initial state render
  chrome.storage.local.get(['banned', 'expiresAt', 'error'], (res) => {
    // Convert seconds → ms if needed
    if (res.expiresAt && res.expiresAt < 10_000_000_000) {
      res.expiresAt = res.expiresAt * 1000;
    }
    render(widget, res);
  });

  // Listen for storage changes
  setupStorageListener(widget);

  // Click to force refresh
  widget.addEventListener('click', async () => {
    const resp = await sendMessageToBackground('force-refresh');
    if (!resp.ok) console.error('Manual refresh failed', resp.error);
  });

  // Periodic fast refresh
  const fastInterval = setInterval(async () => {
    if (!document.body.contains(widget)) {
      clearInterval(fastInterval);
      clearExistingInterval(widget);
      return;
    }
    await sendMessageToBackground('fast-refresh');
  }, 10000);

  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    clearInterval(fastInterval);
    clearExistingInterval(widget);
  });
})();
