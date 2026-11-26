// HTML for a house's popup on the map and its card in the list. Pure functions: data in, HTML out.

import {
  esc, money, shortMoney, niceDate, daysBetween, durationText, milesText, shoreText, precisionOf,
  STATUS_LABEL, POWER_LABEL, lifespanRows, tileView,
} from "./geo.js";

const fill = (url, t) => url.replace("{z}", t.z).replace("{x}", t.x).replace("{y}", t.y);

// The satellite picture: tiles laid out so the house is in the middle. Closer zoom when the pin is exact.
export function photoHtml(house, tileUrl) {
  const w = 264, h = 150;
  const z = house.approx ? 14 : house.lonRounded ? 15 : 17;
  const tiles = tileView(house.lat, house.lon, z, w, h)
    .map((t) => `<img src="${esc(fill(tileUrl, t))}" alt="" loading="lazy" style="left:${t.left}px;top:${t.top}px">`)
    .join("");
  const caption = house.approx
    ? "Satellite view of the area. The pin is approximate."
    : house.lonRounded
      ? "Satellite view of the area. The pin can be a few hundred meters off."
      : "Satellite view of the spot. Not a listing photo.";
  const mark = house.approx || house.lonRounded ? "ltm-photo-ring" : "ltm-photo-dot";
  return `<figure class="ltm-photo"><div class="ltm-photo-box" role="img" aria-label="Satellite view"><div class="ltm-photo-tiles">${tiles}</div><span class="${mark}"></span></div><figcaption>${esc(caption)}</figcaption></figure>`;
}

function factsRow(h) {
  const bits = [];
  if (h.beds) bits.push(`${h.beds} bed`);
  if (h.baths) bits.push(`${h.baths} bath`);
  if (h.sqft) bits.push(`${h.sqft.toLocaleString("en-US")} sq ft`);
  if (h.acres) bits.push(`${h.acres} acre${h.acres === 1 ? "" : "s"}`);
  if (h.year && h.year < 2100) bits.push(`built ${h.year}`);
  return bits.join(" · ");
}

export function listedText(h, today) {
  if (!h.listed) return "List date not checked";
  const days = daysBetween(h.listed, today);
  if (h.status === "expired") {
    const end = h.history?.at(-1)?.[0];
    return `Listed ${niceDate(h.listed)}${end ? `; expired ${niceDate(end)} after ${durationText(daysBetween(h.listed, end))}` : ""}`;
  }
  return `Listed ${niceDate(h.listed)} · on the market ${durationText(days)}`;
}

function solarHtml(h, power) {
  const s = h.solar;
  const notListed = '<span class="ltm-na">Not in the listing</span>';
  const per = power.SOLAR_PER_KW;
  const made = s.kw
    ? `About ${(s.kw * per.summer).toFixed(0)} kWh a day in summer, ${(s.kw * per.winter).toFixed(0)} in winter`
    : `Size not listed. Here, each 1 kW of panels makes about ${per.summer.toFixed(1)} kWh a day in summer and ${per.winter.toFixed(1)} in winter.`;
  const rows = lifespanRows(s, power.LIFESPANS)
    .map((r) => `<tr><th scope="row">${esc(r.part)}</th><td>${esc(r.life)}</td><td>${esc(r.until)}</td></tr>`)
    .join("");
  return `
    <div class="ltm-solar">
      <h4>Solar system</h4>
      <dl class="ltm-dl">
        <dt>Off grid</dt><dd>${s.scope ? esc(s.scope) : "Yes"}</dd>
        <dt>Panels</dt><dd>${s.panels ? esc(s.panels) : notListed}</dd>
        <dt>Power made</dt><dd>${esc(made)}</dd>
        <dt>Battery</dt><dd>${s.battery ? esc(s.battery) : notListed}</dd>
        <dt>Inverter</dt><dd>${s.inverter ? esc(s.inverter) : notListed}</dd>
        <dt>Backup</dt><dd>${s.generator ? esc(s.generator) : notListed}</dd>
        <dt>Installed</dt><dd>${esc(s.installedNote || (s.installed ? String(s.installed) : "Not in the listing"))}</dd>
      </dl>
      <table class="ltm-life"><caption>How long it lasts (typical)</caption>
        <thead><tr><th scope="col">Part</th><th scope="col">Lifespan</th><th scope="col">Good until</th></tr></thead>
        <tbody>${rows}</tbody></table>
      <details class="ltm-ask"><summary>Ask the agent</summary><ul>${power.ASK_THE_AGENT.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></details>
    </div>`;
}

// Popup on the map. info: { shore, dennysville }. power: the data/power.js module.
export function popupHtml(h, info, ctx) {
  const facts = (h.facts || []).map((f) => `<li>${esc(f)}</li>`).join("");
  const history = (h.history || []).map(([d, what, p]) => `<li>${esc(niceDate(d))}: ${esc(what)}, ${esc(money(p))}</li>`).join("");
  const about = h.approx ? "about " : "";
  return `
    <article class="ltm-pop">
      ${photoHtml(h, ctx.tileUrl)}
      <p class="ltm-pop-kicker"><span class="ltm-badge ltm-badge-${esc(h.power)}">${esc(POWER_LABEL[h.power])}</span> <span class="ltm-status ltm-status-${esc(h.status)}">${esc(STATUS_LABEL[h.status])}</span></p>
      <h3 class="ltm-pop-title">${esc(h.address)}, ${esc(h.town)}</h3>
      <p class="ltm-pop-price">${esc(money(h.price))}</p>
      <p class="ltm-pop-facts">${esc(factsRow(h))}</p>
      <p class="ltm-pop-dist">${esc(shoreText(info.shore, precisionOf(h)))} · ${esc(about + milesText(info.dennysville))} from Dennysville</p>
      ${h.approx ? `<p class="ltm-pop-approx">Pin is approximate: placed at ${esc(h.approx)}.</p>` : ""}
      ${h.statusNote ? `<p class="ltm-pop-note">${esc(h.statusNote)}</p>` : ""}
      <p class="ltm-pop-listed">${esc(listedText(h, ctx.today))}</p>
      ${history ? `<ul class="ltm-history">${history}</ul>` : ""}
      ${facts ? `<ul class="ltm-facts">${facts}</ul>` : ""}
      ${h.heat ? `<p class="ltm-pop-heat"><strong>Heat:</strong> ${esc(h.heat)}</p>` : ""}
      ${h.power === "offgrid-solar" && h.solar ? solarHtml(h, ctx.power) : ""}
      <p class="ltm-pop-links">
        <a class="btn ltm-btn-small" href="${esc(h.listing)}" target="_blank" rel="noopener">Listing and photos</a>
        ${h.compass && h.compass !== h.listing ? `<a class="ltm-link" href="${esc(h.compass)}" target="_blank" rel="noopener">More details</a>` : ""}
      </p>
      <p class="ltm-pop-meta">MLS ${esc(h.mls)} · ${esc(h.office)}</p>
    </article>`;
}

// Card in the list under the map.
export function cardHtml(h, info, today) {
  const about = h.approx ? "about " : "";
  return `
    <li class="ltm-card ltm-card-${esc(h.power)}" data-id="${esc(h.id)}">
      <div class="ltm-card-top">
        <span class="ltm-card-price">${esc(shortMoney(h.price))}</span>
        <span class="ltm-badge ltm-badge-${esc(h.power)}">${esc(POWER_LABEL[h.power])}</span>
      </div>
      <h4 class="ltm-card-title">${esc(h.address)}, ${esc(h.town)}</h4>
      <p class="ltm-card-facts">${esc(factsRow(h))}</p>
      <p class="ltm-card-dist">${esc(shoreText(info.shore, precisionOf(h), "the bay"))} · ${esc(about + milesText(info.dennysville))} from Dennysville</p>
      <p class="ltm-card-listed"><span class="ltm-status ltm-status-${esc(h.status)}">${esc(STATUS_LABEL[h.status])}</span> ${esc(listedText(h, today))}</p>
      <div class="ltm-card-actions">
        <button type="button" class="btn btn-quiet ltm-btn-small" data-show="${esc(h.id)}">Show on map</button>
        <a class="ltm-link" href="${esc(h.listing)}" target="_blank" rel="noopener">Listing</a>
      </div>
    </li>`;
}
