// Cobscook Bay map: places, names and map settings. Words and numbers only; ../js/ draws them.
//
// Populations: 2020 US census (Wikipedia, citypopulation.de), 2021 Canadian census for the islands.
// Bay names and spots: USGS place names (GNIS), via topoquest.com. Checked Nov 26, 2026.

export const MAP_CHECKED = "2026-11-26";

// Where the map opens, and how far it can be panned.
export const MAP_VIEW = {
  center: [44.905, -67.12],
  zoom: 10,
  minZoom: 8,
  maxZoom: 18,
  bounds: [[44.45, -67.85], [45.35, -66.45]],
};

// The reference point for "miles from Dennysville": the village center.
export const DENNYSVILLE = { name: "Dennysville", lat: 44.9037, lon: -67.2286 };

// One color per 1-mile ring, nearest first. When rings are picked, each ring takes the color of the
// smallest picked distance that reaches it, so "1 mi + 5 mi" shows 0–1 mi in teal and 1–5 mi in orange.
export const RING_COLORS = [
  "#0f8b7d", // 1 mi  teal
  "#4caf50", // 2 mi  green
  "#9ccc3c", // 3 mi  lime
  "#e0b100", // 4 mi  gold
  "#f59e2a", // 5 mi  orange
  "#ef6a32", // 6 mi  red-orange
  "#d6413b", // 7 mi  red
  "#c2307a", // 8 mi  magenta
  "#8e3fa8", // 9 mi  purple
  "#5b3a8c", // 10 mi deep violet
];
export const DEFAULT_RINGS = [1, 5, 10];

// Towns and villages. pop: people counted; popNote says which count. kind "town" gets a bold label,
// "village" a small one. Unorganized townships are counted together by the census.
export const TOWNS = [
  { name: "Dennysville", lat: 44.9037, lon: -67.2286, pop: 300, popNote: "2020 census", kind: "town" },
  { name: "Pembroke", lat: 44.9537, lon: -67.1619, pop: 788, popNote: "2020 census", kind: "town" },
  { name: "Perry", lat: 44.9723, lon: -67.0752, pop: 802, popNote: "2020 census", kind: "town" },
  { name: "Eastport", lat: 44.9062, lon: -66.9900, pop: 1288, popNote: "2020 census", kind: "town" },
  { name: "Lubec", lat: 44.8606, lon: -66.9842, pop: 1237, popNote: "2020 census", kind: "town" },
  { name: "Whiting", lat: 44.7909, lon: -67.1755, pop: 482, popNote: "2020 census", kind: "town" },
  { name: "Charlotte", lat: 45.0128, lon: -67.2550, pop: 337, popNote: "2020 census", kind: "town" },
  { name: "Robbinston", lat: 45.0670, lon: -67.1050, pop: 541, popNote: "2020 census", kind: "town" },
  { name: "Sipayik (Pleasant Point)", lat: 44.9573, lon: -67.0422, pop: 692, popNote: "2020 census, Passamaquoddy reservation", kind: "town" },
  { name: "Edmunds Twp", lat: 44.8720, lon: -67.1642, pop: null, popNote: "Counted with 5 other townships: 724 people in all (2020 census)", kind: "town" },
  { name: "Trescott Twp", lat: 44.7985, lon: -67.0905, pop: null, popNote: "Counted with 5 other townships: 724 people in all (2020 census)", kind: "town" },
  { name: "Meddybemps", lat: 45.0386, lon: -67.3544, pop: 139, popNote: "2020 census", kind: "town" },
  { name: "Cutler", lat: 44.6733, lon: -67.2394, pop: 524, popNote: "2020 census", kind: "town" },
  { name: "Campobello Island (Canada)", lat: 44.8830, lon: -66.9330, pop: 949, popNote: "2021 Canadian census", kind: "town" },
  { name: "Deer Island (Canada)", lat: 44.9680, lon: -66.9550, pop: 718, popNote: "2021 Canadian census (West Isles)", kind: "town" },
  { name: "West Pembroke", lat: 44.9476, lon: -67.1780, kind: "village" },
  { name: "North Trescott", lat: 44.8595, lon: -67.1317, kind: "village" },
  { name: "West Lubec", lat: 44.8148, lon: -67.0700, kind: "village" },
  { name: "North Lubec", lat: 44.8684, lon: -67.0178, kind: "village" },
  { name: "South Lubec", lat: 44.8242, lon: -66.9928, kind: "village" },
  { name: "Lower Dennysville", lat: 44.9298, lon: -67.2269, kind: "village" },
];

// Named parts of the water. tier 1 shows from zoom 10, tier 2 from zoom 12 (it gets crowded).
// Label spots sit on the water of the coastline used for the rings, so a few are nudged from the USGS point.
export const WATER_NAMES = [
  { name: "Cobscook Bay", lat: 44.9002, lon: -67.0636, tier: 0 },
  { name: "Dennys Bay", lat: 44.8876, lon: -67.1592, tier: 1 },
  { name: "Whiting Bay", lat: 44.8338, lon: -67.1458, tier: 1 },
  { name: "South Bay", lat: 44.8603, lon: -67.0517, tier: 1 },
  { name: "East Bay", lat: 44.9348, lon: -67.1072, tier: 1 },
  { name: "Pennamaquan River", lat: 44.9167, lon: -67.1117, tier: 1 },
  { name: "Johnson Bay", lat: 44.8615, lon: -67.0016, tier: 1 },
  { name: "Straight Bay", lat: 44.8573, lon: -67.1142, tier: 1 },
  { name: "Passamaquoddy Bay", lat: 45.0300, lon: -67.0200, tier: 1, outside: true },
  { name: "Sipp Bay", lat: 44.9394, lon: -67.1196, tier: 2 },
  { name: "Broad Cove", lat: 44.8987, lon: -67.0080, tier: 2 },
  { name: "Hardscrabble River", lat: 44.9038, lon: -67.1757, tier: 2 },
  { name: "Dennys River", lat: 44.9113, lon: -67.1973, tier: 2 },
  { name: "Duck Harbor", lat: 44.8909, lon: -67.1796, tier: 2 },
  { name: "Ox Cove", lat: 44.9109, lon: -67.1792, tier: 2 },
  { name: "Morrison Cove", lat: 44.8673, lon: -67.0914, tier: 2 },
  { name: "Carrying Place Cove", lat: 44.8355, lon: -67.1376, tier: 2 },
  { name: "Lubec Narrows", lat: 44.8570, lon: -66.9810, tier: 2, outside: true },
];

// Spots worth a pin. kind "danger" is drawn in red.
export const SPOTS = [
  { name: "Reversing Falls (Cobscook Falls)", lat: 44.8837, lon: -67.1272, kind: "danger",
    note: "Tide rips through this narrow gap at several knots. Stay out of it in a canoe or kayak." },
  { name: "Cobscook Bay State Park", lat: 44.8415, lon: -67.1503, kind: "park",
    note: "Campground on Whiting Bay, off South Edmunds Road." },
  { name: "Dennysville: your fishing base", lat: 44.9037, lon: -67.2286, kind: "plan",
    note: "Head of tide on the Dennys River, from the long-term plan." },
  { name: "Edmunds shore: your home zone", lat: 44.8884, lon: -67.1964, kind: "plan",
    note: "Between Dennysville and the Hobart Stream mouth, from the long-term plan." },
];

// Base maps. All are free to view with credit shown on the map.
export const BASE_MAPS = [
  { name: "Map", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    subdomains: "abcd", maxZoom: 19,
    credit: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' },
  { name: "Satellite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19, credit: "Imagery &copy; Esri, Maxar, Earthstar Geographics" },
  { name: "Terrain", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    maxZoom: 19, credit: "&copy; Esri, HERE, Garmin, USGS, NGA" },
];

// The satellite picture in each house's popup uses this tile service.
export const PHOTO_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
