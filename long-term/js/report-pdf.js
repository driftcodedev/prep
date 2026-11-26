// Draws the report blocks from js/report.js as a pdfmake document, for Download PDF.
// Pure: blocks in, document definition out. Looks like the Short Term PDF: Roboto, the site's ink and
// blue, thin table rules, a page footer. Each part starts a new page.

import { COLORS, keepsWithNext } from "./report.js";

const C = { ...COLORS, bean: "#8a4632", beanTint: "#f5e8e1" };
const WIDTH = 532; // LETTER (612 pt) less 40 pt margins

// Roboto has no glyph for thirds.
const t = (s) => String(s ?? "").replace(/⅓/g, "1/3").replace(/⅔/g, "2/3");

const SIZES = { xs: 7, s: 8, m: 8.5 };

function runs(r, extra = {}) {
  if (typeof r === "string") return t(r);
  return r.map((x) => {
    const o = { text: t(x.text) };
    if (x.b) o.bold = true;
    if (x.i) o.italics = true;
    if (x.link) Object.assign(o, { link: x.link, color: C.lid, decoration: "underline" });
    return Object.assign(o, extra);
  });
}

const tableLayout = {
  hLineWidth: (i, node) => (i === 0 ? 0 : i === node.table.headerRows ? 1 : 0.5),
  vLineWidth: () => 0,
  hLineColor: (i, node) => (i === node.table.headerRows ? C.ink : C.line),
  paddingLeft: (i) => (i === 0 ? 0 : 4),
  paddingRight: (i, node) => (i === node.table.widths.length - 1 ? 0 : 4),
  paddingTop: () => 2.5,
  paddingBottom: () => 2.5,
};

// Same rules, but cells with a fill get a little room on both sides.
const filledLayout = {
  ...tableLayout,
  paddingLeft: (i) => (i === 0 ? 0 : 3),
  paddingRight: () => 3,
  hLineColor: (i, node) => (i === node.table.headerRows ? C.ink : "#ffffff"),
  hLineWidth: (i, node) => (i === 0 ? 0 : i === node.table.headerRows ? 1 : 1.2),
};

function cell(c, align) {
  const o = c && typeof c === "object" ? c : { text: c };
  const out = { text: t(o.text ?? ""), alignment: align || "left" };
  if (o.fill) out.fillColor = o.fill;
  if (o.color) out.color = o.color;
  if (o.b) out.bold = true;
  return out;
}

function table(tb, extra = {}) {
  const cols = tb.rows[0]?.length || tb.head.length;
  const headed = tb.head.some((x) => x);
  const widths = tb.widths || Array(cols).fill("*");
  const body = tb.rows.map((r) => r.map((c, i) => cell(c, tb.align?.[i])));
  if (headed) body.unshift(tb.head.map((h, i) => ({ text: t(h), bold: true, color: C.ink2, fontSize: (SIZES[tb.size] || 8.5) - 0.5, alignment: tb.align?.[i] || "left" })));
  const filled = tb.rows.some((r) => r.some((c) => c && typeof c === "object" && c.fill));
  return {
    table: { headerRows: headed ? 1 : 0, dontBreakRows: true, widths, body },
    layout: filled ? filledLayout : tableLayout,
    fontSize: SIZES[tb.size] || 8.5,
    margin: [0, 2, 0, 9],
    ...extra,
  };
}

function swatch(color, size = 7) {
  return { canvas: [{ type: "rect", x: 0, y: 1.5, w: size, h: size, r: 1, color }], width: size + 4 };
}

function rings(bk) {
  const col = (it) => ({
    stack: [
      { text: t(it.title), bold: true, fontSize: 11, alignment: "center" },
      { svg: it.svg, width: 112, alignment: "center", margin: [0, 3, 0, 2] },
      { text: t(it.sub), fontSize: 7.5, color: C.ink2, alignment: "center", margin: [0, 0, 0, 4] },
      ...it.legend.map((l) => ({
        columns: [swatch(l.color), { text: [{ text: `${t(l.name)} `, bold: true }, { text: t(l.value), color: C.ink2 }], fontSize: 7.5 }],
        margin: [0, 0, 0, 1.5],
      })),
    ],
  });
  const out = [];
  for (let i = 0; i < bk.items.length; i += 3) {
    out.push({ columns: bk.items.slice(i, i + 3).map(col), columnGap: 18, margin: [0, 4, 0, 14], unbreakable: true });
  }
  return out;
}

function card(bk) {
  const inner = [
    { text: t(bk.title), fontSize: 13, bold: true },
    { text: t(bk.sub), bold: true, color: C.lid, margin: [0, 1, 0, 0] },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: WIDTH - 20, y2: 0, lineWidth: 1, dash: { length: 3 }, lineColor: C.line }], margin: [0, 5, 0, 3] },
    {
      table: { widths: [70, "*"], body: bk.rows.map(([k, v]) => [{ text: t(k), bold: true, color: C.ink2 }, { text: t(v) }]) },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
        vLineWidth: () => 0, hLineColor: () => C.line,
        paddingLeft: (i) => (i === 0 ? 0 : 4), paddingRight: () => 0, paddingTop: () => 2, paddingBottom: () => 2,
      },
      fontSize: 8,
    },
  ];
  if (bk.bullets.length) inner.push({ ul: bk.bullets.map(t), fontSize: 8, markerColor: C.lid, margin: [0, 5, 0, 0] });
  if (bk.table) inner.push({ text: "How long the parts last", bold: true, fontSize: 8.5, margin: [0, 6, 0, 0] }, table(bk.table, { margin: [0, 1, 0, 0] }));
  return {
    table: { widths: ["*"], body: [[{ stack: inner }]] },
    layout: {
      hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => C.ink, vLineColor: () => C.ink,
      paddingLeft: () => 9, paddingRight: () => 9, paddingTop: () => 8, paddingBottom: () => 9,
    },
    margin: [0, 4, 0, 12],
    unbreakable: true,
  };
}

function cover(bk) {
  return [
    {
      columns: [
        { text: "prep", fontSize: 40, bold: true, color: C.lid, width: "auto", margin: [0, -6, 0, 0] },
        {
          stack: [
            { text: t(bk.title), fontSize: 20, bold: true },
            { text: t(bk.sub), fontSize: 12, color: C.ink2, margin: [0, 2, 0, 0] },
          ],
          margin: [16, 2, 0, 0],
        },
      ],
    },
    { canvas: [{ type: "line", x1: 0, y1: 0, x2: WIDTH, y2: 0, lineWidth: 2, lineColor: C.ink }], margin: [0, 8, 0, 10] },
    { text: t(bk.lines[0]), color: C.ink2, margin: [0, 0, 0, 10] },
    {
      table: { widths: ["*"], body: [[{ text: t(bk.lines[1]), bold: true }]] },
      layout: {
        hLineWidth: () => 0, vLineWidth: (i) => (i === 0 ? 3 : 0), vLineColor: () => C.bean,
        fillColor: () => C.beanTint, paddingLeft: () => 8, paddingRight: () => 6, paddingTop: () => 6, paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 18],
    },
    { text: "Contents", fontSize: 15, bold: true, margin: [0, 0, 0, 6] },
    {
      table: {
        widths: [22, "*"],
        body: bk.contents.map((c, i) => [
          { text: String(i + 1), bold: true, color: C.lid, fontSize: 13 },
          { text: t(c), fontSize: 13, linkToDestination: `part-${i + 1}` },
        ]),
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 ? 0 : 0.5), vLineWidth: () => 0, hLineColor: () => C.line,
        paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 5, paddingBottom: () => 5,
      },
    },
  ];
}

export function reportPdf(blocks, { date = "" } = {}) {
  const content = [];
  let partNo = 0;
  let keep = null; // a heading waiting to go on the same page as its short table
  for (const [i, bk] of blocks.entries()) {
    const at = content.length;
    switch (bk.t) {
      case "cover": content.push(...cover(bk)); break;
      case "part":
        partNo += 1;
        content.push(
          { text: `Part ${partNo}`, color: C.lid, bold: true, fontSize: 9, pageBreak: "before", id: `part-${partNo}` },
          { text: t(bk.text), fontSize: 20, bold: true, margin: [0, 1, 0, 0] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: WIDTH, y2: 0, lineWidth: 2, lineColor: C.ink }], margin: [0, 6, 0, 10] },
        );
        break;
      case "h3": content.push({ text: t(bk.text), fontSize: 11.5, bold: true, margin: [0, 8, 0, 3], headlineLevel: 1 }); break;
      case "p": content.push({ text: runs(bk.runs), margin: [0, 0, 0, 6] }); break;
      case "note": content.push({ text: runs(bk.runs), color: C.ink2, fontSize: 8.5, margin: [0, -4, 0, 8] }); break;
      case "ul": content.push({ ul: bk.items.map((it) => ({ text: runs(it) })), markerColor: C.lid, margin: [0, 0, 0, 7] }); break;
      case "ol": content.push({ ol: bk.items.map((it) => ({ text: runs(it) })), markerColor: C.lid, margin: [0, 0, 0, 7] }); break;
      case "table": content.push(table(bk)); break;
      case "svg":
        content.push({ svg: bk.svg, width: bk.width || WIDTH, alignment: "center", margin: [0, 2, 0, 3] });
        if (bk.caption) content.push({ text: t(bk.caption), color: C.ink2, fontSize: 8, alignment: "center", margin: [0, 0, 0, 8] });
        break;
      case "rings": content.push(...rings(bk)); break;
      case "card": content.push(card(bk)); break;
      default: break;
    }
    if (keep !== null) {
      const parts = content.splice(keep);
      parts[0] = { ...parts[0], headlineLevel: undefined };
      content.push({ stack: parts, unbreakable: true });
      keep = null;
    } else if (keepsWithNext(bk, blocks[i + 1])) keep = at;
  }

  return {
    pageSize: "LETTER",
    // Keep headings with what follows them.
    pageBreakBefore: (node, nodeQueries) => {
      if (node.headlineLevel !== 1) return false;
      const after = nodeQueries.getFollowingNodesOnPage ? nodeQueries.getFollowingNodesOnPage() : node.followingNodesOnPage;
      return !after || after.length === 0 || (node.startPosition && node.startPosition.top > 680);
    },
    pageMargins: [40, 40, 40, 44],
    info: { title: "prep: the long-term plan", author: "prep", subject: `Cobscook Bay, Maine. Made ${date}.` },
    defaultStyle: { font: "Roboto", fontSize: 9.5, lineHeight: 1.2, color: C.ink },
    footer: (page, pages) => (page === 1 ? null : {
      columns: [
        { text: `prep · The long-term plan · ${t(date)}`, color: C.ink2 },
        { text: `Page ${page} of ${pages}`, alignment: "right", color: C.ink2 },
      ],
      fontSize: 7.5,
      margin: [40, 14, 40, 0],
    }),
    content,
  };
}
