// Long Term plan: entry point.
//
// The page frame (shell/tabs.js) imports this file only after the password is entered. It then
// calls mount(root, context) to draw the plan inside #lt-root, and unmount(root) when the tab
// locks (switching tabs, the Lock button, or reloading). Each unlock calls mount() again, so
// mount() must draw from scratch. See README.md in this folder.

import { WORKSPACE } from "./data/plan.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Data in, HTML out. Kept apart from mount() so the tests can run it without a browser.
// context.household is the household from the Short Term tab, or null (see README.md).
export function render(data = WORKSPACE, context = {}) {
  return `
    <h2 class="section-title">${esc(data.heading)}</h2>
    <p class="muted">${esc(data.intro)}</p>
  `;
}

// Loads style.css from this folder the first time the plan opens.
function loadStyles() {
  if (document.querySelector("link[data-long-term]")) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = new URL("./style.css", import.meta.url).href;
    link.dataset.longTerm = "";
    link.onload = link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

export async function mount(root, context = {}) {
  await loadStyles();
  root.innerHTML = render(WORKSPACE, context);
}

export function unmount(root) {
  // Stop any timers or remove any window/document listeners that mount() added.
  // The frame empties #lt-root after this.
}
