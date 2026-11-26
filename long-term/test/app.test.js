import { test } from "node:test";
import assert from "node:assert/strict";
import { render } from "../app.js";
import { WORKSPACE } from "../data/plan.js";

test("the long-term plan draws its heading", () => {
  const html = render(WORKSPACE, { household: null });
  assert.match(html, /<h2[^>]*>Workspace<\/h2>/);
});

test("text from data is escaped", () => {
  const html = render({ heading: "<b>x</b>", intro: "a & b" });
  assert.ok(html.includes("&lt;b&gt;x&lt;/b&gt;"));
  assert.ok(html.includes("a &amp; b"));
});
