// The full Long Term report, for paper.
//
// buildReport() returns one list of plain blocks (headings, paragraphs, tables, pictures). The same
// list is drawn two ways: reportHtml() below, for the browser's Print, and reportPdf() in
// js/report-pdf.js, for Download PDF. Pure: no browser needed, so the tests run it in Node.
//
// Block types:
//   cover   { title, sub, lines[], contents[] }
//   part    { text }                         a main section; starts a new page
//   h3      { text }
//   p       { runs }  note { runs }          runs: a string, or [{ text, b, i, link }]
//   ul / ol { items: [runs] }
//   table   { head[], rows[][], widths[], align[], size }   cell: string or { text, fill, color, b, swatch }
//   svg     { svg, width, caption }          width in points on a 612 pt wide page
//   rings   { items: [{ title, svg, sub, legend: [{ color, name, value }] }] }
//   card    { title, sub, rows: [[label, value]], bullets[], table }
//   img     { src, width, alt, caption }       src: a data: URL (pdfmake needs one)

import { HOUSES, HOUSES_CHECKED, HOUSES_CHANGES } from "../data/houses.js";
import { TOWNS, RING_COLORS, DENNYSVILLE } from "../data/places.js";
import { PAGE, CURRENTS, DEPTH } from "../data/plan.js";
import * as POWER from "../data/power.js";
import { SEASONS, SPECIES, FISH_CHECKED } from "../data/fishing.js";
import {
  FISH_PAGE, CONFIDENCE, HERRING_METHODS, HERRING_CATCH_NOTE, METHOD, FISH_NOTES, SEAWEED, FISH_SOURCES, PROFILES,
} from "../data/fishing-notes.js";
import {
  esc, makeShoreDistance, milesBetween, money, niceDate, milesText, shoreText, precisionOf, STATUS_LABEL, POWER_LABEL,
  lifespanRows, changesText,
} from "./geo.js";
import { listedText } from "./popup.js";
import {
  seasonTotal, seasonRanking, rankingText, fedText, donutSlices, herringCatch, meatText, millions, thousands, caloriesText,
  commas, pct,
} from "./fishing.js";
import { tideLabel } from "./currents.js";
import { saltingBlocks } from "./salting.js";

// README pages (from the README button) that belong in the paper copy, in this order.
// Pages about using the website itself stay out.
export const README_IN_REPORT = ["why-cobscook", "solar-panels", "off-grid-checklist", "nov-dec-food-shortage", "species-extinction", "gas-pump"];

export const COLORS = {
  ink: "#1c2a29", ink2: "#4a5957", line: "#c6cfcb", lid: "#1f5f7a", lidTint: "#ddeaf0", paper: "#f2f4f1",
  water: "#cfe1ea", solar: "#1d7a4c", backup: "#b5740d", plain: "#3d4f5c",
};

// ---------- small helpers ----------

const SHORT_POWER = { none: "None listed", backup: "Backup", "offgrid-solar": "Off-grid solar" };

const p = (runs) => ({ t: "p", runs });
const h3 = (text) => ({ t: "h3", text });
const part = (text) => ({ t: "part", text });

// Mixes a hex color with white: share 0 = white, 1 = the color.
export function tint(hex, share) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(255 + (c - 255) * share);
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function decode(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");
}

// Inline HTML (b, i, a) to runs.
export function inlineRuns(html) {
  const runs = [];
  let b = false, i = false, link = null;
  const re = /<(\/?)(b|strong|i|em|a)\b([^>]*)>|<[^>]+>|([^<]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      const text = decode(m[4].replace(/\s+/g, " "));
      if (text) runs.push({ text, b, i, link });
    } else if (m[2]) {
      const tag = m[2].toLowerCase(), close = m[1] === "/";
      if (tag === "b" || tag === "strong") b = !close;
      else if (tag === "i" || tag === "em") i = !close;
      else if (tag === "a") link = close ? null : (/href="([^"]*)"/.exec(m[3]) || [])[1] || null;
    }
  }
  if (runs.length) {
    runs[0].text = runs[0].text.replace(/^\s+/, "");
    runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
  }
  return runs.filter((r) => r.text);
}

// README page HTML (p, h3, ul, ol, table) to blocks.
export function htmlToBlocks(html) {
  const blocks = [];
  const re = /<(p|h3|h4|ul|ol|table|pre)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase(), body = m[2];
    if (tag === "p" || tag === "pre") blocks.push(p(inlineRuns(body)));
    else if (tag === "h3" || tag === "h4") blocks.push(h3(decode(body.replace(/<[^>]+>/g, "")).trim()));
    else if (tag === "ul" || tag === "ol") {
      const items = [...body.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((x) => inlineRuns(x[1]));
      blocks.push({ t: tag, items });
    } else if (tag === "table") {
      const rows = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) =>
        [...r[1].matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((c) => ({ th: c[1].toLowerCase() === "th", text: decode(c[2].replace(/<[^>]+>/g, "")).trim() })));
      if (!rows.length) continue;
      const headed = rows[0].every((c) => c.th);
      const head = headed ? rows[0].map((c) => c.text) : rows[0].map(() => "");
      const body2 = (headed ? rows.slice(1) : rows).map((r) => r.map((c) => (c.th ? { text: c.text, b: true } : c.text)));
      blocks.push({ t: "table", head, rows: body2, size: "s" });
    }
  }
  return blocks;
}

// ---------- the map ----------

function geomPolys(g) {
  return g.type === "Polygon" ? [g.coordinates] : g.coordinates;
}

// A plain vector map of the bay: the 1–10 mile bands in their colors, the bay, towns, and every house.
// items: [{ lat, lon, power, num }]; houses with num get a number label.
export function mapSvg(geo, items, { width = 720, towns = TOWNS, colors = RING_COLORS } = {}) {
  const outer = geo.rings.at(-1).geometry;
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const poly of [...geomPolys(outer), ...geomPolys(geo.bay)]) {
    for (const [lon, lat] of poly[0]) {
      minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    }
  }
  const pad = 12;
  const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const scale = (width - 2 * pad) / ((maxLon - minLon) * kx);
  const height = Math.round((maxLat - minLat) * scale + 2 * pad);
  const X = (lon) => pad + (lon - minLon) * kx * scale;
  const Y = (lat) => pad + (maxLat - lat) * scale;
  const f = (n) => n.toFixed(1);
  const path = (g) => geomPolys(g).map((poly) => poly.map((ring) => "M" + ring.map(([lon, lat]) => `${f(X(lon))},${f(Y(lat))}`).join("L") + "Z").join("")).join("");
  const font = 'font-family="Roboto, Helvetica, Arial, sans-serif"';

  // Each band is a closed ring over land and water; water inside it is pale and land is stronger,
  // so the coastline still shows on paper, where there's no background map.
  const bands = [...geo.rings].reverse().map((r) => {
    const c = colors[r.miles - 1];
    return `<path d="${path(r.geometry)}" fill="${tint(c, 0.14)}" fill-rule="evenodd" stroke="${c}" stroke-width="0.4"/>`
      + (r.land ? `<path d="${path(r.land)}" fill="${tint(c, 0.42)}" fill-rule="evenodd"/>` : "");
  }).join("");
  const bay = `<path d="${path(geo.bay)}" fill="${COLORS.water}" fill-rule="evenodd" stroke="${COLORS.lid}" stroke-width="0.8"/>`;

  const inside = (lat, lon) => lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  const townSvg = towns.filter((t) => t.kind === "town" && inside(t.lat, t.lon)).map((t) => {
    const x = X(t.lon), y = Y(t.lat);
    const right = x < width * 0.78;
    const label = `${t.name.replace(/ \(.*\)/, "")}${t.pop ? ` ${commas(t.pop)}` : ""}`;
    const tx = right ? x + 5 : x - 5, anchor = right ? "start" : "end";
    return `<circle cx="${f(x)}" cy="${f(y)}" r="2.4" fill="${COLORS.ink}"/>`
      + `<text x="${f(tx)}" y="${f(y + 3.5)}" ${font} font-size="10" font-weight="bold" text-anchor="${anchor}" fill="#ffffff" stroke="#ffffff" stroke-width="2.6">${esc(label)}</text>`
      + `<text x="${f(tx)}" y="${f(y + 3.5)}" ${font} font-size="10" font-weight="bold" text-anchor="${anchor}" fill="${COLORS.ink}">${esc(label)}</text>`;
  }).join("");

  const order = { none: 0, backup: 1, "offgrid-solar": 2 };
  const pins = [...items].sort((a, b) => order[a.power] - order[b.power]).map((h) => {
    const x = X(h.lon), y = Y(h.lat);
    const style = h.power === "offgrid-solar" ? [4.6, COLORS.solar] : h.power === "backup" ? [3.6, COLORS.backup] : [2, COLORS.plain];
    const dot = `<circle cx="${f(x)}" cy="${f(y)}" r="${style[0]}" fill="${style[1]}" stroke="#ffffff" stroke-width="${h.power === "none" ? 0.6 : 1.2}"/>`;
    if (!h.num) return dot;
    const lx = x + 5, ly = y - 4;
    return dot
      + `<text x="${f(lx)}" y="${f(ly)}" ${font} font-size="9" font-weight="bold" fill="#ffffff" stroke="#ffffff" stroke-width="2.6">${h.num}</text>`
      + `<text x="${f(lx)}" y="${f(ly)}" ${font} font-size="9" font-weight="bold" fill="${style[1]}">${h.num}</text>`;
  }).join("");

  const perMile = scale / 69.05;
  const bar = 5 * perMile, bx = pad + 6, by = height - pad - 6;
  const scaleBar = `<rect x="${f(bx - 4)}" y="${f(by - 14)}" width="${f(bar + 40)}" height="20" fill="#ffffff" opacity="0.85"/>`
    + `<line x1="${f(bx)}" y1="${f(by)}" x2="${f(bx + bar)}" y2="${f(by)}" stroke="${COLORS.ink}" stroke-width="2"/>`
    + `<line x1="${f(bx)}" y1="${f(by - 4)}" x2="${f(bx)}" y2="${f(by + 1)}" stroke="${COLORS.ink}" stroke-width="1.2"/>`
    + `<line x1="${f(bx + bar)}" y1="${f(by - 4)}" x2="${f(bx + bar)}" y2="${f(by + 1)}" stroke="${COLORS.ink}" stroke-width="1.2"/>`
    + `<text x="${f(bx + bar + 5)}" y="${f(by + 3)}" ${font} font-size="9" fill="${COLORS.ink}">5 mi</text>`;
  const nx = width - pad - 10, ny = pad + 6;
  const north = `<path d="M${nx},${ny} L${nx + 6},${ny + 16} L${nx},${ny + 12} L${nx - 6},${ny + 16} Z" fill="${COLORS.ink}"/>`
    + `<text x="${nx}" y="${ny + 28}" ${font} font-size="10" font-weight="bold" text-anchor="middle" fill="${COLORS.ink}">N</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
    + `<rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>${bands}${bay}${townSvg}${pins}${scaleBar}${north}</svg>`;
}

// ---------- fishing rings ----------

function arc(cx, cy, R, r, a0, a1) {
  const pt = (rad, a) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(R, a0), [x1, y1] = pt(R, a1), [x2, y2] = pt(r, a1), [x3, y3] = pt(r, a0);
  const f = (n) => n.toFixed(2);
  return `M${f(x0)},${f(y0)}A${R},${R} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r},${r} 0 ${large} 0 ${f(x3)},${f(y3)}Z`;
}

// A ring chart drawn with filled arcs (no CSS), so it prints and goes into the PDF the same way.
export function ringSvg(slices, big, small) {
  const font = 'font-family="Roboto, Helvetica, Arial, sans-serif"';
  let at = 0;
  const parts = slices.map((s) => {
    const a0 = at, a1 = at + (s.share / 100) * 2 * Math.PI;
    at = a1;
    if (s.share >= 99.99) {
      return `<path d="${arc(60, 60, 54, 32, 0, Math.PI)}" fill="${s.color}"/><path d="${arc(60, 60, 54, 32, Math.PI, 2 * Math.PI)}" fill="${s.color}"/>`;
    }
    return `<path d="${arc(60, 60, 54, 32, a0, a1)}" fill="${s.color}" stroke="#ffffff" stroke-width="0.8"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${parts}`
    + `<text x="60" y="61" ${font} font-size="17" font-weight="bold" text-anchor="middle" fill="${COLORS.ink}">${esc(big)}</text>`
    + `<text x="60" y="75" ${font} font-size="8" text-anchor="middle" fill="${COLORS.ink2}">${esc(small)}</text></svg>`;
}

// ---------- the report ----------

// opts: { geo (data/geo.json), today ("YYYY-MM-DD"), dateText, readme ([{ id, title, html }]),
//         currents (data/currents.json), currentsImage (data: URL of data/currents-print.png),
//         depth (data/depth.json), depthImage (data: URL of data/depth-print.png) }
export function buildReport({ geo, today, dateText, readme = [], currents = null, currentsImage = "", depth = null, depthImage = "" }) {
  const pages = README_IN_REPORT.map((id) => readme.find((pg) => pg.id === id)).filter(Boolean);
  const pageOf = (id) => pages.find((pg) => pg.id === id);
  const blocks = [];

  const cover = {
    t: "cover",
    title: "The long-term plan",
    sub: "Cobscook Bay, Maine",
    lines: [
      `Printed ${dateText}. Houses checked ${niceDate(HOUSES_CHECKED)}; fishing numbers made ${niceDate(FISH_CHECKED)}.`,
      "A phone or laptop won't help once the batteries die. Keep this copy somewhere dry.",
    ],
    contents: [], // filled in at the end
  };
  blocks.push(cover);

  const readmePart = (pg) => {
    if (!pg) return;
    blocks.push(part(pg.title), ...htmlToBlocks(pg.html));
  };

  readmePart(pageOf("why-cobscook"));

  // --- map ---
  const shoreMiles = makeShoreDistance(geo.bay);
  const houses = HOUSES.map((h) => ({ h, shore: shoreMiles(h.lat, h.lon), dennysville: milesBetween(h, DENNYSVILLE) }))
    .sort((a, b) => a.shore - b.shore || a.h.price - b.h.price);
  houses.forEach((x, i) => { x.num = i + 1; });
  const powered = houses.filter((x) => x.h.power !== "none");
  const solar = houses.filter((x) => x.h.power === "offgrid-solar");
  const backup = houses.filter((x) => x.h.power === "backup");

  blocks.push(part("The Cobscook Bay map"));
  blocks.push(p("Colored rings show distance from the bay's shore, 1 to 10 miles, straight across land and water: land is the stronger color and water the paler one. The bay is pale blue. Dots are houses for sale: green for off-grid solar, amber for backup power, small gray for the rest. Numbered houses match the house list."));
  const map = mapSvg(geo, houses.map((x) => ({ lat: x.h.lat, lon: x.h.lon, power: x.h.power, num: x.h.power === "none" ? 0 : x.num })));
  const [, mw, mh] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(map).map(Number);
  blocks.push({
    t: "svg",
    svg: map,
    width: Math.min(532, Math.round((540 * mw) / mh)), // leaves room on the page for the caption and key
    caption: "White beyond the bands is land more than 10 miles away, or open water.",
  });
  blocks.push({
    t: "table",
    head: ["Miles from the bay", ...RING_COLORS.map((_, i) => `${i + 1}`)],
    rows: [["Band color", ...RING_COLORS.map((c) => ({ text: "", fill: tint(c, 0.42) }))]],
    size: "s",
  });
  if (currents) blocks.push(...currentsBlocks(currents, currentsImage));
  if (depth) blocks.push(...depthBlocks(depth, depthImage));
  blocks.push(h3("Towns around the bay"));
  blocks.push({
    t: "table",
    head: ["Town", "People", "Count"],
    rows: TOWNS.filter((t) => t.kind === "town").map((t) => [t.name, t.pop ? commas(t.pop) : "–", t.popNote]),
    widths: [150, 50, "*"],
    align: ["left", "right", "left"],
    size: "s",
  });
  blocks.push(h3(PAGE.notesHeading));
  blocks.push({ t: "ul", items: PAGE.notes });

  // --- houses ---
  blocks.push(part("Houses for sale"));
  const changes = changesText(HOUSES_CHANGES);
  blocks.push(p(`${houses.length} houses for sale within 10 miles of the bay, checked ${niceDate(HOUSES_CHECKED)}. ${solar.length} are off grid with solar and ${backup.length} more have some backup power. The numbers match the map.${changes ? ` ${changes}` : ""} Listings change every week, so check one before you act.`));

  blocks.push(h3("Off-grid solar houses"));
  for (const x of solar) blocks.push(houseCard(x, today));

  blocks.push(h3("Houses with backup power"));
  blocks.push({
    t: "table",
    head: ["#", "House", "Price", "Status", "Backup power", "To the bay"],
    rows: backup.map((x) => [String(x.num), `${x.h.address}, ${x.h.town}`, money(x.h.price), STATUS_LABEL[x.h.status], backupText(x.h), milesText(x.shore)]),
    widths: [14, 110, 46, 52, "*", 44],
    align: ["right", "left", "right", "left", "left", "right"],
    size: "s",
  });

  blocks.push(h3("Every house, closest to the bay first"));
  blocks.push({
    t: "table",
    head: ["#", "House", "Price", "Status", "Power", "Beds · baths · acres", "To the bay", "MLS"],
    rows: houses.map((x) => [
      String(x.num), `${x.h.address}, ${x.h.town}`, money(x.h.price), STATUS_LABEL[x.h.status], SHORT_POWER[x.h.power],
      [x.h.beds, x.h.baths, x.h.acres].map((v) => (v == null ? "?" : String(v))).join(" · "),
      x.shore < 0.05 ? "On the bay" : milesText(x.shore), x.h.mls || "",
    ]),
    widths: [14, "*", 46, 54, 50, 54, 40, 40],
    align: ["right", "left", "right", "left", "left", "left", "right", "left"],
    size: "xs",
  });

  readmePart(pageOf("solar-panels"));
  readmePart(pageOf("off-grid-checklist"));

  // --- fishing ---
  blocks.push(...fishingBlocks());

  // --- salting: the by-hand formulas and how-to, for when there's no power ---
  blocks.push(...saltingBlocks());

  readmePart(pageOf("nov-dec-food-shortage"));
  readmePart(pageOf("species-extinction"));
  readmePart(pageOf("gas-pump"));
  cover.contents = blocks.filter((b) => b.t === "part").map((b) => b.text);
  return blocks;
}

// The fishing part: how much food is in the bay each season, with how sure each number is.
export function fishingBlocks(list = SPECIES, seasons = SEASONS) {
  const out = [part(FISH_PAGE.heading)];
  const fed = (b) => fedText(seasonTotal(list, "kcal", b));
  const conf = (sp) => ({ text: String(sp.confidence), b: true });
  const sixAlign = ["left", "right", "right", "right", "right", "right", "right"];

  out.push(p(`${FISH_PAGE.intro} For species that stay all year, like urchins, periwinkles, clams and scallops, each season shows the same animals, so don't add the seasons together.`));
  out.push({ t: "note", runs: FISH_PAGE.draft });

  out.push(h3("Calories in the bay (millions)"));
  out.push({
    t: "table",
    head: ["Species", ...seasons.map((s) => s.label), "Sure (1–5)"],
    rows: [
      ...list.map((sp) => [sp.name, ...sp.kcal.map(millions), conf(sp)]),
      [{ text: "Total", b: true }, ...seasons.map((_, b) => ({ text: millions(seasonTotal(list, "kcal", b)), b: true })), ""],
      [{ text: "Active adults fed a year, if all were caught", b: true }, ...seasons.map((_, b) => ({ text: fed(b), b: true })), ""],
    ],
    widths: ["*", 44, 44, 44, 44, 44, 44, 40],
    align: [...sixAlign, "center"],
    size: "s",
  });
  out.push({ t: "note", runs: "? = not counted. Calories = pounds × meat share × calories per pound of meat. Adults fed = calories ÷ 3,000 a day ÷ 365. Herring's 0 in January–April means no catch was recorded then; some herring may be there." });

  out.push(h3("How sure each number is"));
  out.push({ t: "ul", items: Object.keys(CONFIDENCE).sort((a, b) => b - a).map((k) => [{ text: `${k}: `, b: true }, { text: CONFIDENCE[k] }]) });

  out.push(h3("Pounds in the bay (thousands, live weight)"));
  out.push({
    t: "table",
    head: ["Species", ...seasons.map((s) => s.label), "Where the number comes from"],
    rows: list.map((sp) => [sp.weight === "meat" ? `${sp.name} (meat)` : sp.name, ...sp.lb.map(thousands), sp.source]),
    widths: [92, 34, 34, 34, 34, 34, 34, "*"],
    align: [...sixAlign, "left"],
    size: "xs",
  });
  out.push({ t: "ul", items: FISH_NOTES });

  out.push(h3("Each season's calories, by species"));
  out.push({
    t: "rings",
    items: seasons.map((s, b) => {
      const slices = donutSlices(seasonRanking(list, "kcal", b));
      const total = seasonTotal(list, "kcal", b);
      return {
        title: s.label,
        svg: ringSvg(slices, commas(total / 1e6), "million calories"),
        sub: `A year's food for about ${fed(b)} active adults`,
        legend: slices.map((x) => ({ color: x.color, name: x.name, value: `${millions(x.value)} million · ${pct(x.share)}` })),
      };
    }),
  });

  out.push(h3("Each season, largest share of the calories first (no cutoffs)"));
  out.push({
    t: "table",
    head: ["Season", "Calories", "Order"],
    rows: seasons.map((s, b) => [{ text: s.long, b: true }, caloriesText(seasonTotal(list, "kcal", b)).replace(" calories", ""), rankingText(list, b)]),
    widths: [86, 62, "*"],
    size: "s",
  });

  out.push(h3("Herring: three ways to measure it"));
  out.push(p(HERRING_METHODS.lead));
  out.push({ t: "table", head: ["Method", "Herring in the bay", "How it was made"], rows: HERRING_METHODS.rows.map((r) => [{ text: r[0], b: true }, r[1], r[2]]), widths: [96, 100, "*"], size: "s" });
  out.push({ t: "note", runs: HERRING_METHODS.after });

  const hc = herringCatch();
  out.push(h3("Herring caught in Cobscook, 1947–58"));
  out.push({ t: "table", head: ["Year", "Pounds", "Year", "Pounds"], rows: hc.rows, widths: [50, 80, 50, 80], align: ["left", "right", "left", "right"], size: "s" });
  out.push({ t: "note", runs: `Average ${commas(hc.average)} lb a year. By month: ${hc.months} of the catch. ${HERRING_CATCH_NOTE}` });

  out.push(h3("Species notes"));
  out.push({
    t: "table",
    head: ["Species", "Best season", "Size", "Meat", "Gear", "Rules today", "Notes"],
    rows: list.map((sp) => {
      const pr = PROFILES[sp.id] || {};
      return [{ text: sp.name, b: true }, pr.best || "", pr.size || "", meatText(sp, pr), pr.gear || "", pr.rules || "", pr.safety || ""];
    }),
    widths: [56, 50, 62, 66, 70, 80, "*"],
    size: "xs",
  });

  out.push(h3("Seaweed (not counted above)"));
  out.push({ t: "table", head: ["Seaweed", "Best time to pick", "Use"], rows: SEAWEED.map((r) => [{ text: r[0], b: true }, r[1], r[2]]), widths: [110, 110, "*"], size: "s" });
  out.push({ t: "note", runs: "Seaweed adds iodine, vitamins and minerals, not calories. Cut the fronds and leave the base so it grows back." });

  out.push(h3("How these numbers were made"));
  out.push({ t: "ol", items: METHOD });
  out.push(h3("Sources"));
  out.push({ t: "ul", items: FISH_SOURCES.map(([title, url]) => [{ text: title, link: url }, { text: ` (${url})` }]) });
  return out;
}

// The currents section: the printed map, then typical and fastest current and slack times by place.
export function currentsBlocks(data, image = "", words = CURRENTS) {
  const out = [h3(words.reportHeading), p(words.reportIntro)];
  if (image) out.push({ t: "img", src: image, width: 520, alt: "Map of the strongest tidal currents and the flats that dry at low tide in Cobscook Bay" });
  const short = (pt) => tideLabel(pt, data).replace(/ tide$/, "").replace(/^High$/, "high tide").replace(/^Low$/, "low tide");
  const rows = words.reportAreas
    .map((name) => (data.areas || []).find((a) => a.name === name))
    .filter(Boolean)
    .map((a) => [
      a.name.replace(/: your (.*)$/, " (your $1)").replace(/ \(Cobscook Falls\)/, ""),
      a.typical < 0.1 ? "under 0.1" : a.typical.toFixed(1),
      a.fastest.toFixed(1),
      `${short(a.slack[0])} · ${short(a.slack[1])}`,
    ]);
  out.push({
    t: "table",
    head: ["Place", "Typical peak (knots)", "Fastest spot (knots)", "Slackest (hours from Eastport high or low)"],
    rows,
    widths: ["*", 66, 66, 170],
    align: ["left", "right", "right", "left"],
    size: "s",
  });
  out.push({ t: "note", runs: `Average tide; spring tides run about 15% faster. Typical = the middle value within 1.2 km of the place. ${data.source}.` });
  return out;
}

// The water depth section: the printed depth map, then typical and deepest depth by place.
export function depthBlocks(data, image = "", words = DEPTH) {
  // The map right under the heading, so the two stay on one page.
  const out = [h3(words.reportHeading)];
  if (image) out.push({ t: "img", src: image, width: 500, alt: "Map of water depth at low tide in Cobscook Bay" });
  out.push(p(words.reportIntro));
  const ft = (v) => (v === null || v === undefined ? "dries" : v < 10 ? (Math.round(v * 2) / 2).toString() : Math.round(v).toString());
  const rows = (data.areas || []).map((a) => [
    a.name,
    ft(a.typicalFt),
    ft(a.deepestFt),
    a.driesShare >= 0.05 ? `${Math.round(a.driesShare * 100)}%` : "–",
  ]);
  if (rows.length) {
    out.push({
      t: "table",
      head: ["Place", "Typical depth at low tide (ft)", "Deepest within ½ mile (ft)", "Dries at low tide"],
      rows,
      widths: ["*", 80, 80, 66],
      align: ["left", "right", "right", "right"],
      size: "s",
    });
  }
  const s = data.stats || {};
  const deepest = s.deepestFt ? ` The deepest spot in the bay is about ${Math.round(s.deepestFt)} ft at low tide.` : "";
  out.push({ t: "note", runs: `Within ½ mile of each name on the map. Add about ${Math.round(data.datum.mhwFt)} ft for an average high tide.${deepest} Source: ${data.source} Datum: ${data.datum.name} at ${data.datum.station}.` });
  return out;
}

function backupText(h) {
  const s = h.solar;
  const bits = [];
  if (s?.generator) bits.push(s.generator);
  if (s?.battery) bits.push(s.battery);
  if (!bits.length && h.facts?.length) bits.push(h.facts[0]);
  return bits.join("; ") || "See listing";
}

function houseCard(x, today) {
  const h = x.h, s = h.solar || {};
  const per = POWER.SOLAR_PER_KW;
  const made = s.kw
    ? `About ${(s.kw * per.summer).toFixed(0)} kWh a day in summer, ${(s.kw * per.winter).toFixed(0)} in winter`
    : `Size not listed. Here, each 1 kW of panels makes about ${per.summer.toFixed(1)} kWh a day in summer and ${per.winter.toFixed(1)} in winter.`;
  const notListed = "Not in the listing";
  const rows = [
    ["Where", `${shoreText(x.shore, precisionOf(h))}; ${milesText(x.dennysville)} from Dennysville`],
    ["House", [h.beds != null ? `${h.beds} bed` : null, h.baths != null ? `${h.baths} bath` : null, h.sqft ? `${commas(h.sqft)} sq ft` : null, h.acres ? `${h.acres} acres` : null, h.year ? `built ${h.year}` : null].filter(Boolean).join(" · ")],
    ["Listing", `${listedText(h, today)}${h.mls ? ` · MLS ${h.mls}` : ""}${h.office ? ` · ${h.office}` : ""}`],
    ["Off grid", s.scope || "Yes"],
    ["Solar put in", s.installed ? `${s.installed}${s.installedNote ? `. ${s.installedNote}` : ""}` : s.installedNote || notListed],
    ["Panels", s.panels || notListed],
    ["Power made", made],
    ["Battery", s.battery || notListed],
    ["Inverter", s.inverter || notListed],
    ["Backup", s.generator || notListed],
    ["Heat", h.heat || notListed],
  ];
  if (h.statusNote) rows.push(["Status note", h.statusNote]);
  if (h.history?.length) rows.push(["History", h.history.map(([d, what, pr]) => `${niceDate(d)}: ${what}, ${money(pr)}`).join("; ")]);
  if (h.listing) rows.push(["Listing page", h.listing]);
  return {
    t: "card",
    title: `${x.num}. ${h.address}, ${h.town}`,
    sub: `${money(h.price)} · ${STATUS_LABEL[h.status]} · ${POWER_LABEL[h.power]}`,
    rows,
    bullets: h.facts || [],
    table: {
      head: ["Part", "Lifespan", "Good until"],
      rows: lifespanRows(s, POWER.LIFESPANS).map((r) => [r.part, r.life, r.until]),
      widths: [90, 90, "*"],
      size: "xs",
    },
  };
}

// ---------- HTML for the browser's Print ----------

function runsHtml(runs) {
  if (typeof runs === "string") return esc(runs);
  return runs.map((r) => {
    let s = esc(r.text);
    if (r.b) s = `<b>${s}</b>`;
    if (r.i) s = `<i>${s}</i>`;
    if (r.link) s = `<a href="${esc(r.link)}">${s}</a>`;
    return s;
  }).join("");
}

function cellHtml(c, tag, align) {
  const style = [];
  if (align && align !== "left") style.push(`text-align:${align}`);
  if (c && typeof c === "object") {
    if (c.fill) style.push(`background:${c.fill}`);
    if (c.color) style.push(`color:${c.color}`);
    if (c.b) style.push("font-weight:700");
  }
  const text = c && typeof c === "object" ? c.text : c;
  const sw = c && typeof c === "object" && c.swatch ? `<span class="ltp-sw" style="background:${esc(c.swatch)}"></span>` : "";
  return `<${tag}${style.length ? ` style="${style.join(";")}"` : ""}>${sw}${esc(text ?? "")}</${tag}>`;
}

// Column widths as shares of the page, from the PDF widths (numbers in points, "*" splits the rest).
function colsHtml(widths) {
  if (!widths) return "";
  const fixed = widths.filter((w) => typeof w === "number").reduce((a, b) => a + b, 0);
  const stars = widths.filter((w) => w === "*").length || 1;
  const star = Math.max(40, (532 - fixed) / stars);
  const total = widths.reduce((a, w) => a + (w === "*" ? star : w), 0);
  return `<colgroup>${widths.map((w) => `<col style="width:${(((w === "*" ? star : w) / total) * 100).toFixed(1)}%">`).join("")}</colgroup>`;
}

function tableHtml(tb) {
  const head = tb.head.some((x) => x) ? `<thead><tr>${tb.head.map((x, i) => cellHtml(x, "th", tb.align?.[i])).join("")}</tr></thead>` : "";
  const rows = tb.rows.map((r) => `<tr>${r.map((c, i) => cellHtml(c, "td", tb.align?.[i])).join("")}</tr>`).join("");
  return `<table class="ltp-table ltp-${tb.size || "m"}">${colsHtml(tb.widths)}${head}<tbody>${rows}</tbody></table>`;
}

// A heading followed straight away by a table short enough to fit on one page: keep them together.
export const keepsWithNext = (bk, next) => bk.t === "h3" && ((next?.t === "table" && next.rows.length <= 26) || next?.t === "img");

export function reportHtml(blocks) {
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    if (keepsWithNext(blocks[i], blocks[i + 1])) {
      out.push(`<div class="ltp-keep">${blockHtml(blocks[i])}${blockHtml(blocks[i + 1])}</div>`);
      i += 1;
    } else out.push(blockHtml(blocks[i]));
  }
  return out.join("\n");
}

function blockHtml(bk) {
  {
    switch (bk.t) {
      case "cover":
        return `<header class="ltp-cover"><h2 class="ltp-title">${esc(bk.title)}</h2><p class="ltp-sub">${esc(bk.sub)}</p>${bk.lines.map((l) => `<p>${esc(l)}</p>`).join("")}<h3>Contents</h3><ol>${bk.contents.map((c) => `<li>${esc(c)}</li>`).join("")}</ol></header>`;
      case "part": return `<h2 class="ltp-part">${esc(bk.text)}</h2>`;
      case "h3": return `<h3 class="ltp-h3">${esc(bk.text)}</h3>`;
      case "p": return `<p class="ltp-p">${runsHtml(bk.runs)}</p>`;
      case "note": return `<p class="ltp-note">${runsHtml(bk.runs)}</p>`;
      case "ul": case "ol": return `<${bk.t} class="ltp-list">${bk.items.map((it) => `<li>${runsHtml(it)}</li>`).join("")}</${bk.t}>`;
      case "table": return tableHtml(bk);
      case "svg": return `<figure class="ltp-fig">${bk.svg}${bk.caption ? `<figcaption>${esc(bk.caption)}</figcaption>` : ""}</figure>`;
      case "img": return `<figure class="ltp-fig"><img src="${esc(bk.src)}" alt="${esc(bk.alt || "")}">${bk.caption ? `<figcaption>${esc(bk.caption)}</figcaption>` : ""}</figure>`;
      case "rings": return `<div class="ltp-rings">${bk.items.map((it) => `<div class="ltp-ring"><h4>${esc(it.title)}</h4>${it.svg}<p class="ltp-note">${esc(it.sub)}</p><ul>${it.legend.map((l) => `<li><span class="ltp-sw" style="background:${esc(l.color)}"></span><b>${esc(l.name)}</b> ${esc(l.value)}</li>`).join("")}</ul></div>`).join("")}</div>`;
      case "card":
        return `<section class="ltp-card"><h4>${esc(bk.title)}</h4><p class="ltp-card-sub">${esc(bk.sub)}</p><dl>${bk.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>${bk.bullets.length ? `<ul class="ltp-list">${bk.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${bk.table ? tableHtml(bk.table) : ""}</section>`;
      default: return "";
    }
  }
}
