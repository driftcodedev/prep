import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PAGES, pagesJson, fingerprint, norm } from "../readme-pages.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const index = read("../../index.html");
const script = read("../readme.js");
const embedded = index.match(/<script type="application\/json" id="rmpages">([\s\S]*?)<\/script>/)?.[1];

// Readers' edits are saved under these ids, so once published they must stay.
const PUBLISHED = ["about", "short-term", "amounts", "prices", "long-term", "code"];

test("index.html holds the current README pages (run `npm run readme` if this fails)", () => {
  assert.ok(embedded, "index.html has no rmpages block");
  assert.equal(embedded, pagesJson());
});

test("each README page has a unique id, a matching base and its own name in aka", () => {
  const pages = JSON.parse(embedded);
  assert.equal(new Set(pages.map((p) => p.id)).size, pages.length);
  for (const p of pages) {
    assert.ok(p.id && p.title && p.html, `page ${p.id} is missing something`);
    assert.equal(p.base, fingerprint(p.title, p.html), `base for ${p.id}`);
    assert.ok(p.aka.includes(norm(p.title)), `aka for ${p.id}`);
    for (const a of p.aka) assert.match(a, /^[a-z0-9]+$/);
  }
});

test("published README page ids are kept", () => {
  const ids = PAGES.map((p) => p.id);
  for (const id of PUBLISHED) assert.ok(ids.includes(id), `page "${id}" was published; keep its id`);
});

test("the README has this site's own storage name", () => {
  assert.match(script, /const NS = 'prep';/);
  assert.doesNotMatch(script, /myproject/);
});

test("the README pop-up sits above the page", () => {
  assert.match(read("../readme.css"), /#rmmodal \{[^}]*z-index:57/);
});
