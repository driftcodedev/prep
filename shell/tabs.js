// The page frame: Short Term / Long Term tabs and the Long Term lock.
//
// Long Term is behind a light password lock: the page keeps only a SHA-256 fingerprint of the
// password. Nothing is remembered: the tab locks again on every page load and whenever you
// switch away from it. This keeps casual visitors out; it isn't real security.
//
// The Long Term plan itself lives in long-term/. Its code is only fetched after the password is
// entered: this file imports long-term/app.js and calls mount(root, context) to draw it inside
// #lt-root, then unmount(root) and clears #lt-root when the tab locks. See long-term/README.md.

const PASSWORD_SHA256 = "2044fbdb55f9238637ff4adbdd07a491f8225a62b4db057bca43b73de9b3abad";
const LONG_HASH = "#long-term";

const $ = (sel) => document.querySelector(sel);
const tabs = [...document.querySelectorAll('.tab-list [role="tab"]')];
const gate = $("#lt-gate");
const space = $("#lt-space");
const input = $("#lt-password");
const error = $("#lt-error");
const longTab = $("#tab-long");
const root = $("#lt-root");
const HOUSEHOLD_KEY = "prep-household-v1"; // saved by the Short Term plan

let unlocked = false; // lives only as long as this page view
let mounted = null;    // the long-term module while it is on screen
let opening = 0;       // bumps on every open and lock, so a slow load can't draw after a lock

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

// What the long-term plan is handed: the household from the Short Term tab, read-only.
function context() {
  let household = null;
  try { household = JSON.parse(localStorage.getItem(HOUSEHOLD_KEY)) || null; } catch { /* none saved */ }
  return { household };
}

async function openWorkspace() {
  const mine = ++opening;
  root.textContent = "";
  try {
    const mod = await import("../long-term/app.js");
    if (mine !== opening) return;
    await mod.mount(root, context());
    if (mine !== opening) { mod.unmount?.(root); root.textContent = ""; return; }
    mounted = mod;
  } catch (err) {
    console.error("Long-term plan failed to load:", err);
    if (mine !== opening) return;
    root.innerHTML = '<p class="lt-load-error">The long-term plan didn\'t load. Reload the page and try again.</p>';
  }
  // Move focus to the plan's first heading, or the plan itself.
  const heading = root.querySelector("h1, h2, h3");
  if (heading && !heading.hasAttribute("tabindex")) heading.tabIndex = -1;
  (heading || root).focus({ preventScroll: true });
}

function closeWorkspace() {
  opening++;
  if (mounted) {
    try { mounted.unmount?.(root); } catch (err) { console.error(err); }
    mounted = null;
  }
  root.textContent = "";
}

function lock() {
  // The README lives on this tab: close it if it's open (closing also saves an edit in progress).
  const readme = document.getElementById("rmmodal");
  if (readme && !readme.hidden) document.getElementById("rmclose")?.click();
  unlocked = false;
  input.value = "";
  error.hidden = true;
  closeWorkspace();
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
    openWorkspace();
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
