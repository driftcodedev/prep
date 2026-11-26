// Short Term / Long Term tabs. Long Term is behind a light password lock: the page keeps only
// a SHA-256 fingerprint of the password, and once unlocked a device stays unlocked until
// someone presses "Lock this tab". This keeps casual visitors out; it isn't real security.

const PASSWORD_SHA256 = "2044fbdb55f9238637ff4adbdd07a491f8225a62b4db057bca43b73de9b3abad";
const UNLOCK_KEY = "prep-long-term-unlocked";
const LONG_HASH = "#long-term";

const $ = (sel) => document.querySelector(sel);
const tabs = [...document.querySelectorAll('.tab-list [role="tab"]')];
const gate = $("#lt-gate");
const space = $("#lt-space");
const input = $("#lt-password");
const error = $("#lt-error");
const longTab = $("#tab-long");

let unlockedHere = false; // fallback when browser storage is unavailable

function isUnlocked() {
  try {
    return localStorage.getItem(UNLOCK_KEY) === PASSWORD_SHA256 || unlockedHere;
  } catch {
    return unlockedHere;
  }
}

function setUnlocked(on) {
  unlockedHere = on;
  try {
    if (on) localStorage.setItem(UNLOCK_KEY, PASSWORD_SHA256);
    else localStorage.removeItem(UNLOCK_KEY);
  } catch { /* storage blocked: stays unlocked for this visit only */ }
}

async function sha256(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function renderLock() {
  const open = isUnlocked();
  gate.hidden = open;
  space.hidden = !open;
  longTab.classList.toggle("is-locked", !open);
}

function select(tab, { focus = false } = {}) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  }
  const hash = tab === longTab ? LONG_HASH : "";
  if (location.hash !== hash) history.replaceState(null, "", hash || location.pathname + location.search);
  if (focus) tab.focus();
  if (tab === longTab) {
    renderLock();
    if (!isUnlocked()) input.focus({ preventScroll: true });
  }
}

for (const t of tabs) t.addEventListener("click", () => select(t));

// Arrow keys move between tabs, as in any tab list.
document.querySelector(".tab-list").addEventListener("keydown", (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  let next = null;
  if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
  else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
  else if (e.key === "Home") next = tabs[0];
  else if (e.key === "End") next = tabs[tabs.length - 1];
  if (next) { e.preventDefault(); select(next, { focus: true }); }
});

gate.addEventListener("submit", async (e) => {
  e.preventDefault();
  // Phone keyboards often capitalize the first letter, so case and stray spaces don't matter.
  const guess = input.value.trim().toLowerCase();
  if (guess && (await sha256(guess)) === PASSWORD_SHA256) {
    setUnlocked(true);
    input.value = "";
    error.hidden = true;
    renderLock();
    $("#lt-title").focus();
  } else {
    error.hidden = false;
    input.select();
  }
});

input.addEventListener("input", () => { error.hidden = true; });

$("#lt-lock").addEventListener("click", () => {
  setUnlocked(false);
  renderLock();
  input.focus();
});

window.addEventListener("hashchange", () => select(location.hash === LONG_HASH ? longTab : tabs[0]));

renderLock();
if (location.hash === LONG_HASH) select(longTab);
