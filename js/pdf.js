// Builds the full report as a pdfmake document. Pure: takes the household plan, returns a definition.
import { PRICES_CHECKED } from "./data.js";
import {
  money, planSummary, personSummary, statusLine, cardRows, cardEnergy, cardNotes, cookingData, gearItems,
  storeGroups, shoppingLead, compareText, shoppingNotes, COOK_NOTE, WEIGH_INTRO, WEIGH_RULES, WEIGH_KIDS,
  CARE, ABOUT, SOURCES, DISCLAIMER, SITE_URL, VIDEOS, GEAR_INTRO,
} from "./content.js";

const C = { ink: "#1c2a29", ink2: "#4a5957", line: "#c6cfcb", lid: "#1f5f7a", bean: "#8a4632", beanTint: "#f5e8e1", lidTint: "#ddeaf0" };

// Roboto has no glyph for thirds.
const t = (s) => String(s ?? "").replace(/⅓/g, "1/3").replace(/⅔/g, "2/3");

const h2 = (text, opts = {}) => ({ text: t(text), style: "h2", headlineLevel: 1, ...opts });
const para = (text, opts = {}) => ({ text: typeof text === "string" ? t(text) : text, style: "p", ...opts });
const bullets = (items, opts = {}) => ({ ul: items.map((x) => (typeof x === "string" ? t(x) : x)), style: "p", markerColor: C.lid, ...opts });
const leadBullets = (items) => bullets(items.map((it) => ({ text: [{ text: `${t(it.lead)}: `, bold: true }, t(it.text)] })));

const tableLayout = {
  hLineWidth: (i, node) => (i === 0 ? 0 : i === 1 ? 1 : 0.5),
  vLineWidth: () => 0,
  hLineColor: (i) => (i === 1 ? C.ink : C.line),
  paddingLeft: (i) => (i === 0 ? 0 : 5),
  paddingRight: (i, node) => (i === node.table.widths.length - 1 ? 0 : 5),
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

function dataTable(head, rows, widths, opts = {}) {
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths,
      body: [head.map((h, i) => ({ text: t(h), style: "th", alignment: opts.align?.[i] || "left" })),
        ...rows.map((r) => r.map((c, i) => (typeof c === "object" && c !== null ? c : { text: t(c), alignment: opts.align?.[i] || "left" })))],
    },
    layout: tableLayout,
    style: "table",
  };
}

function card(pl, hh) {
  const rows = cardRows(pl).map((r) => [
    { text: [{ text: t(r.label), bold: true }, r.sub ? { text: ` ${t(r.sub)}`, color: C.ink2, fontSize: 7.5 } : ""] },
    { text: t(r.amount) },
  ]);
  const notes = cardNotes(pl, hh);
  const inner = [
    { text: t(pl.person.name), style: "cardName" },
    { text: t(statusLine(pl)), bold: true, color: C.lid, margin: [0, 1, 0, 0] },
    { text: t(personSummary(pl.person)), fontSize: 8, color: C.ink2, margin: [0, 1, 0, 0] },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 241, y2: 0, lineWidth: 1, dash: { length: 3 }, lineColor: C.line }], margin: [0, 5, 0, 4] },
    { text: t(cardEnergy(pl)), fontSize: 8, color: C.ink2, margin: [0, 0, 0, 3] },
    {
      table: { widths: [72, "*"], body: rows },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
        vLineWidth: () => 0, hLineColor: () => C.line,
        paddingLeft: (i) => (i === 0 ? 0 : 4), paddingRight: () => 0, paddingTop: () => 2.5, paddingBottom: () => 2.5,
      },
      fontSize: 9,
    },
  ];
  if (notes.length) inner.push(bullets(notes, { fontSize: 8, margin: [0, 5, 0, 0] }));
  if (pl.warnings.length) {
    inner.push({
      table: { widths: ["*"], body: [[{ ul: pl.warnings.map(t), fontSize: 8, color: C.ink, markerColor: C.bean }]] },
      layout: {
        hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 3 : 0), vLineColor: () => C.bean,
        fillColor: () => C.beanTint, paddingLeft: () => 6, paddingRight: () => 5, paddingTop: () => 4, paddingBottom: () => 4,
      },
      margin: [0, 5, 0, 0],
    });
  }
  return {
    table: { widths: ["*"], body: [[{ stack: inner }]] },
    layout: {
      hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => C.ink, vLineColor: () => C.ink,
      paddingLeft: () => 9, paddingRight: () => 9, paddingTop: () => 8, paddingBottom: () => 9,
    },
  };
}

function cardsGrid(hh) {
  const out = [];
  for (let i = 0; i < hh.plans.length; i += 2) {
    const a = card(hh.plans[i], hh);
    const b = hh.plans[i + 1] ? card(hh.plans[i + 1], hh) : { text: "" };
    out.push({ columns: [a, b], columnGap: 14, margin: [0, 0, 0, 12], unbreakable: true });
  }
  return out;
}

function cooking(hh) {
  const c = cookingData(hh);
  return [
    h2("Cooking for everyone"),
    para([{ text: "Each day, cook " }, { text: t(c.rice), bold: true }, " and ", { text: t(c.beans), bold: true }, ` ${t(c.rest)}`]),
    dataTable(c.head, c.rows.map(([n, ...cells]) => [{ text: t(n), bold: true }, ...cells]), [90, "*", "*", "*"]),
    c.milk ? para(c.milk) : null,
    { text: "Cooking over a fire", style: "h3", margin: [0, 4, 0, 3], headlineLevel: 1 },
    bullets(c.water.map((w) => ({ text: [{ text: `${t(w.label)}: `, bold: true }, t(w.text)] }))),
    { stack: [para(c.waterTotal), para(COOK_NOTE, { color: C.ink2 })], unbreakable: true },
  ].filter(Boolean);
}

function shopping(hh) {
  const out = [
    h2("Shopping list", { pageBreak: "before" }),
    para([`${t(shoppingLead(hh))}: `, { text: money(hh.total), bold: true, fontSize: 13 }], { fontSize: 11 }),
    para(compareText(hh), { color: C.ink2 }),
  ];
  for (const g of storeGroups(hh)) {
    out.push({ columns: [{ text: t(g.title), style: "h3" }, { text: money(g.total), style: "h3", alignment: "right", width: 80 }], margin: [0, 8, 0, 2], headlineLevel: 1 });
    out.push(dataTable(
      ["Item", "Buy", "How many", "Covers", "Cost"],
      g.lines.map((l) => [
        { text: t(l.item), link: l.url, color: C.lid, bold: true, decoration: "underline" },
        { text: t(l.pack), color: C.ink2 },
        { text: String(l.qty), alignment: "right" },
        { text: t(l.amountText) },
        { stack: [{ text: money(l.cost), alignment: "right" }, l.priceNote ? { text: t(l.priceNote), fontSize: 7, color: C.ink2, alignment: "right" } : ""] },
      ]),
      [118, "*", 42, 92, 62],
      { align: ["left", "left", "right", "left", "right"] },
    ));
  }
  out.push(bullets(shoppingNotes(hh), { margin: [0, 8, 0, 0], color: C.ink2 }));
  return out;
}

function gear(hh) {
  const out = [
    h2("Fire and water"),
    para(GEAR_INTRO),
  ];
  for (const it of gearItems(hh)) {
    const block = [
      { text: t(it.title), style: "h3", margin: [0, 8, 0, 2] },
      para(it.buy, { bold: true, color: C.lid }),
      para([it.links.length > 1 ? "On Amazon: " : "", ...it.links.flatMap((l, i) => [
        { text: t(l.label), link: l.url, color: C.lid, decoration: "underline" }, i < it.links.length - 1 ? ", " : "",
      ])]),
      para([{ text: "How long it lasts: ", bold: true }, t(it.lasts)]),
    ];
    if (it.drink) block.push(para([{ text: "How much to drink: ", bold: true }, t(it.drink)]));
    block.push(bullets(it.tips));
    if (it.packs) block.push(para(it.packs, { color: C.ink2, fontSize: 8.5 }));
    out.push({ stack: block, unbreakable: true });
  }
  return out;
}

function weighIn(hh) {
  const hasAdults = hh.plans.some((pl) => !pl.isChild);
  const hasKids = hh.plans.some((pl) => pl.isChild);
  return [
    { stack: [h2("Weekly weigh-in"), para(WEIGH_INTRO)], unbreakable: true },
    hasAdults ? dataTable(["If you're", "And the scale shows", "Do this"], WEIGH_RULES, [90, "*", "*"]) : null,
    hasKids ? para(WEIGH_KIDS) : null,
  ].filter(Boolean);
}

export function buildPdf(hh, { date = "" } = {}) {
  const content = [
    {
      columns: [
        { text: "prep", fontSize: 40, bold: true, color: C.lid, width: "auto", margin: [0, -6, 0, 0] },
        {
          stack: [
            { text: "Food for a long power outage, worked out person by person.", fontSize: 13, bold: true },
            { text: t(`${planSummary(hh)} Made ${date} at ${SITE_URL.replace("https://", "")}. Prices checked ${PRICES_CHECKED}.`), fontSize: 8.5, color: C.ink2, margin: [0, 3, 0, 0] },
          ],
          margin: [16, 4, 0, 0],
        },
      ],
    },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: 532, y2: 0, lineWidth: 2, lineColor: C.ink }], margin: [0, 8, 0, 6] },
    ...VIDEOS.map((v, i) => ({
      text: [{ text: `${v.title}  `, bold: true }, { text: v.linkText, link: v.url, color: C.lid, decoration: "underline" }],
      margin: [0, 0, 0, i === VIDEOS.length - 1 ? 10 : 2],
    })),
    h2("Daily amounts", { margin: [0, 0, 0, 2] }),
    para("Measure dry food with level cups and spoons. Each card shows one person's day.", { color: C.ink2, margin: [0, 0, 0, 8] }),
    ...cardsGrid(hh),
    ...cooking(hh),
    ...shopping(hh),
    ...gear(hh),
    ...weighIn(hh),
    h2("Cooking and storage"),
    leadBullets(CARE),
    h2("How the numbers are worked out"),
    leadBullets(ABOUT),
    para([{ text: "Sources: ", bold: true }, ...SOURCES.flatMap(([label, url], i) => [
      { text: t(label), link: url, color: C.lid, decoration: "underline" }, i < SOURCES.length - 1 ? ", " : ".",
    ])], { fontSize: 8.5 }),
    para(DISCLAIMER, { color: C.ink2, fontSize: 8.5 }),
  ];

  return {
    pageSize: "LETTER",
    // Keep headings with what follows them.
    pageBreakBefore: (node, nodeQueries) => {
      if (node.headlineLevel !== 1) return false;
      const after = nodeQueries.getFollowingNodesOnPage ? nodeQueries.getFollowingNodesOnPage() : node.followingNodesOnPage;
      return !after || after.length === 0 || (node.startPosition && node.startPosition.top > 680);
    },
    pageMargins: [40, 40, 40, 44],
    info: { title: "prep: food plan", author: "prep", subject: t(planSummary(hh)) },
    defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.2, color: C.ink },
    styles: {
      h2: { fontSize: 15, bold: true, margin: [0, 14, 0, 5] },
      h3: { fontSize: 11, bold: true },
      p: { margin: [0, 0, 0, 5] },
      th: { fontSize: 8, color: C.ink2, bold: true },
      table: { margin: [0, 2, 0, 8], fontSize: 8.5 },
      cardName: { fontSize: 18, bold: true, lineHeight: 1 },
    },
    footer: (page, pages) => ({
      columns: [
        { text: SITE_URL.replace("https://", ""), color: C.ink2 },
        { text: `Page ${page} of ${pages}`, alignment: "right", color: C.ink2 },
      ],
      fontSize: 7.5,
      margin: [40, 14, 40, 0],
    }),
    content,
  };
}
