// Solar facts used to explain each off-grid house's power. Words and numbers only.

// Average power made per 1 kW of solar panels in Perry, on Cobscook Bay, in kWh per day.
// Source: profileSOLAR (NASA POWER data), checked Nov 26, 2026.
export const SOLAR_PER_KW = {
  place: "Perry, Maine",
  summer: 5.96,
  spring: 5.45,
  autumn: 3.27,
  winter: 1.99,
  source: "https://profilesolar.com/locations/United-States/Perry/",
};

// What a few everyday loads use, in kWh per day, to make the numbers above mean something.
export const DAILY_LOADS = [
  { name: "LED lights, phone and radio", kwh: 0.5 },
  { name: "Efficient fridge", kwh: 1.2 },
  { name: "Chest freezer", kwh: 1 },
  { name: "Well pump", kwh: 1 },
];

// How long each part usually lasts. Ranges, not promises: heat, cold and care change them.
export const LIFESPANS = {
  panels: { years: [25, 30], note: "They keep working past this, making about 0.5% less power each year." },
  lfp: { label: "Lithium iron phosphate (LFP) battery", years: [10, 15], note: "About 3,000 to 5,000 full cycles." },
  nmc: { label: "Other lithium (NMC) battery", years: [7, 10] },
  leadAcid: { label: "Lead-acid battery", years: [3, 5] },
  inverter: { label: "Inverter (string or hybrid)", years: [10, 15] },
  micro: { label: "Microinverters", years: [20, 25], note: "Newer, so less proven." },
};

// What to ask the listing agent when the listing leaves it out.
export const ASK_THE_AGENT = [
  "How many panels, and how many watts each (or the system size in kW)?",
  "What battery: brand, size in kWh, and type (LFP or lead-acid)? What year?",
  "What inverter or charge controller: brand and model?",
  "What year did the system go in, and who installed or serviced it?",
  "Does it run without internet or an app?",
  "Is the solar owned outright, or leased or financed?",
];
