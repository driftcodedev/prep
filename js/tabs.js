// Short Term / Long Term tabs. Long Term is behind a light password lock: the page keeps only
// a SHA-256 fingerprint of the password. Nothing is remembered: the tab locks again on every
// page load and whenever you switch away from it. This keeps casual visitors out; it isn't
// real security.

const PASSWORD_SHA256 = "2044fbdb55f9238637ff4adbdd07a491f8225a62b4db057bca43b73de9b3abad";
const LONG_HASH = "#long-term";

const $ = (sel) => document.querySelector(sel);
const tabs = [...document.querySelectorAll('.tab-list [role="tab"]')];
const gate = $("#lt-gate");
const space = $("#lt-space");
const input = $("#lt-password");
const error = $("#lt-error");
const longTab = $("#tab-long");

let unlocked = false; // lives only as long as this page view

// Earlier versions remembered the unlock on the device; forget that.
try { localStorage.removeItem("prep-long-term-unlocked"); } catch { /* storage blocked */ }

async function sha256(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function renderLock() {
  gate.hidden = unlocked;
  space.hidden = !unlocked;
  longTab.classList.toggle("is-locked", !unlocked);
}

function lock() {
  unlocked = false;
  input.value = "";
  error.hidden = true;
  renderLock();
}

function select(tab, { focus = false } = {}) {
  if (tab !== longTab) lock(); // leaving Long Term locks it
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
    if (!unlocked) input.focus({ preventScroll: true });
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
    unlocked = true;
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
  lock();
  input.focus();
});

window.addEventListener("hashchange", () => select(location.hash === LONG_HASH ? longTab : tabs[0]));

// Coming back with the browser's Back button can restore the page as it was; lock it anyway.
window.addEventListener("pageshow", (e) => { if (e.persisted) lock(); });

renderLock();
if (location.hash === LONG_HASH) select(longTab);
