import {ScaleKind} from "../components/scaleOverlay.tsx";

type AnchorUnit = { label: string; value: number };
type Scales = Record<string, { anchors: AnchorUnit[] }>;

export const SCALES: Scales = {
  count: { anchors: [
    { label: "scatola uova", value: 12 },
    { label: "pacco carte", value: 52 },
    { label: "stadio pieno", value: 50000 },
  ]},
  volume_L: { anchors: [
    { label: "cucchiaino", value: 0.005 },
    { label: "bottiglia",  value: 0.5 },
    { label: "secchio",    value: 10 },
    { label: "vasca da bagno", value: 150 },
    { label: "autobotte",  value: 30000 },
    { label: "piscina olimpionica", value: 2_500_000 },
  ]},
  mass_kg: { anchors: [
    { label: "graffetta", value: 0.001 },
    { label: "mela",      value: 0.2 },
    { label: "persona",   value: 70 },
    { label: "auto",      value: 1500 },
    { label: "elefante",  value: 6000 },
    { label: "locomotiva",value: 120000 },
  ]},
  distance_m: { anchors: [
    { label: "campo da calcio", value: 105 },
    { label: "Monte Bianco",    value: 4807 },
    { label: "maratona",        value: 42195 },
    { label: "Terra–Luna",      value: 384_400_000 },
  ]},
  time_s: { anchors: [
    { label: "battito", value: 0.8 },
    { label: "giorno",  value: 86_400 },
    { label: "anno",    value: 31_557_600 },
  ]},
  money_eur: { anchors: [
    { label: "espresso",  value: 1.2 },
    { label: "pizza",     value: 8 },
    { label: "scarpe",    value: 80 },
    { label: "portatile", value: 2000 },
    { label: "auto",      value: 20000 },
  ]},
};

export const pickStep = (value: number, target = 260) => {
  if (value <= target) return 1;
  const exp = Math.floor(Math.log10(value / target));
  const base = Math.pow(10, exp);
  for (const m of [1, 2, 5]) {
    const step = m * base;
    if (value / step <= target) return step;
  }
  return 10 * base;
};

export const buildEquivalents = (value: number, kind: keyof typeof SCALES) => {
  const anchors = SCALES[kind]?.anchors ?? [];
  return anchors
    .map(a => ({ label: a.label, n: value / a.value }))
    .filter(x => x.n >= 0.1)
    .sort((a, b) => Math.abs(Math.log10(a.n)) - Math.abs(Math.log10(b.n)))
    .slice(0, 5)
    .map(x => ({
      label: x.label,
      approx: x.n >= 1 ? Math.round(x.n * 10) / 10 : Math.round(x.n * 100) / 100,
    }));
};


export type KindUnit = {
  kind: ScaleKind;
  unit?: string;
  factor?: number;
  disableOverlay?: boolean;
};

const R = (k: KindUnit) => k;

export const KIND_BY_LABEL: Array<{ test: RegExp; k: KindUnit }> = [
  { test:/^(Years|Months|Weeks|Days|Hours|Minutes|Seconds)$/i, k:R({ kind:"time_s", unit:"s" }) },

  // --- Biological ---
  { test:/^Breaths$/i,                        k:R({ kind:"count" }) },
  { test:/^Air inhaled \(Liters\)$/i,         k:R({ kind:"volume_L", unit:"L" }) },
  { test:/^Blinks$/i,                         k:R({ kind:"count" }) },
  { test:/^Heartbeats$/i,                     k:R({ kind:"count" }) },
  { test:/^Blood pumped \(Liters\)$/i,        k:R({ kind:"volume_L", unit:"L" }) },
  { test:/^Dead and replaced cells$/i,        k:R({ kind:"count" }) },
  { test:/^Liquid drank \(Liters\)$/i,        k:R({ kind:"volume_L", unit:"L" }) },
  { test:/^Food eaten \(kilograms\)$/i,       k:R({ kind:"mass_kg",  unit:"kg" }) },
  { test:/^Calories burned \(kcal\)$/i,       k:R({ kind:"count",    unit:"kcal" }) },
  { test:/^Hair grown \(cm\)$/i,              k:R({ kind:"distance_m", unit:"m", factor:0.01 }) },
  { test:/^Nail grown \(cm\)$/i,              k:R({ kind:"distance_m", unit:"m", factor:0.01 }) },
  { test:/^Toilet visits$/i,                  k:R({ kind:"count" }) },
  { test:/^Dog years$/i,                      k:R({ kind:"count", disableOverlay:true }) },

  // --- Everyday ---
  { test:/^Steps$/i,                          k:R({ kind:"count" }) },
  { test:/^Km walked$/i,                      k:R({ kind:"distance_m", unit:"m", factor:1000 }) },
  { test:/^Showers$/i,                        k:R({ kind:"count" }) },
  { test:/^Songs played$/i,                   k:R({ kind:"count" }) },
  { test:/^Words spoken$/i,                   k:R({ kind:"count" }) },
  { test:/^Curses spoken$/i,                  k:R({ kind:"count" }) },
  { test:/^Laughs$/i,                         k:R({ kind:"count" }) },
  { test:/^Sneezes$/i,                        k:R({ kind:"count" }) },
  { test:/^Yawns$/i,                          k:R({ kind:"count" }) },

  // --- Nerdy ---
  { test:/^Smartphone unlocks$/i,             k:R({ kind:"count" }) },
  { test:/^Photos taken$/i,                   k:R({ kind:"count" }) },
  { test:/^Videos taken$/i,                   k:R({ kind:"count" }) },
  { test:/^Keystrokes$/i,                     k:R({ kind:"count" }) },
  { test:/^Mouse clicks$/i,                   k:R({ kind:"count" }) },
  { test:/^Notifications$/i,                  k:R({ kind:"count" }) },
  { test:/^Terabytes downloaded$/i,           k:R({ kind:"count", unit:"TB" }) },
  { test:/^Terabytes uploaded$/i,             k:R({ kind:"count", unit:"TB" }) },
  { test:/^Mined Bitcoin blocks$/i,           k:R({ kind:"count" }) },
  { test:/^Chained Ethereum blocks$/i,        k:R({ kind:"count" }) },
  { test:/^Eye processed frames$/i,           k:R({ kind:"count" }) },

  // --- Cosmic ---
  { test:/^Sun equatorial rotations$/i,       k:R({ kind:"count" }) },
  { test:/^Lunar cycles$/i,                   k:R({ kind:"count" }) },
  { test:/^Venus days$/i,                     k:R({ kind:"count" }) },
  { test:/^Venus years$/i,                    k:R({ kind:"count" }) },
  { test:/^Martian days$/i,                   k:R({ kind:"count" }) },
  { test:/^Martian years$/i,                  k:R({ kind:"count" }) },
  { test:/^Jovian days$/i,                    k:R({ kind:"count" }) },
  { test:/^Jovian years$/i,                   k:R({ kind:"count" }) },
  { test:/^Halley comet orbits$/i,            k:R({ kind:"count" }) },
  { test:/^Km in solar orbit$/i,              k:R({ kind:"distance_m", unit:"m", factor:1000 }) },
  { test:/^Km in galactic orbit$/i,           k:R({ kind:"distance_m", unit:"m", factor:1000 }) },

  { test:/^Universe age portion$/i,           k:R({ kind:"count" }) },
  { test:/^Earth age portion$/i,              k:R({ kind:"count" }) },
  { test:/^Life on Earth portion$/i,          k:R({ kind:"count" }) },
  { test:/^Complex life portion$/i,           k:R({ kind:"count" }) },
  { test:/^Galactic year portion$/i,          k:R({ kind:"count" }) },
  { test:/^Fire controlled portion$/i,        k:R({ kind:"count" }) },
  { test:/^Homo sapiens portion$/i,           k:R({ kind:"count" }) },
  { test:/^Written history portion$/i,        k:R({ kind:"count" }) },
];

export const inferKindUnit = (label: string): KindUnit => {
  for (const r of KIND_BY_LABEL) {
    if (r.test.test(label)) return r.k;
  }
  return { kind: "count" };
};
