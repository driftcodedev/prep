// Writes the README pages from shell/readme-pages.js into index.html.
// Run with: npm run readme

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pagesJson } from "./readme-pages.js";

const OPEN = '<script type="application/json" id="rmpages">';
const file = fileURLToPath(new URL("../index.html", import.meta.url));

export function withPages(html) {
  const start = html.indexOf(OPEN);
  const end = html.indexOf("</script>", start);
  if (start < 0 || end < 0) throw new Error(`index.html has no ${OPEN} block`);
  return html.slice(0, start + OPEN.length) + pagesJson() + html.slice(end);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const before = readFileSync(file, "utf8");
  const after = withPages(before);
  writeFileSync(file, after);
  console.log(before === after ? "README pages already up to date." : "README pages written to index.html.");
}
