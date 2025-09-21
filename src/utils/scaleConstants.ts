import {ScaleKind} from "../components/scaleOverlay.tsx";

type AnchorUnit = { label: string; value: number };
type Scales = Record<string, { anchors: AnchorUnit[] }>;
// { label: "", value: 0 },

export const SCALES: Scales = {
  count: { anchors: [
    { label: "Card decks", value: 54 },
    { label: "Roman legions", value: 6000 },
    { label: "Full Camp Nou stadiums", value: 105000 },
    { label: "Londons worth of people", value: 14000000 },
    { label: "Brains worth of neurons", value: 86000000000 },
    { label: "Humans worth of cells", value: 30_000_000_000_000 },
    { label: "Earths worth of ants", value: 9_000_000_000_000_000}
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
  // --- Classic (voci separate + unit) ---
  { test:/^Years$/i,        k:R({ kind:"count", unit:"years"  }) },
  { test:/^Months$/i,       k:R({ kind:"count", unit:"months"  }) },
  { test:/^Weeks$/i,        k:R({ kind:"count", unit:"weeks"  }) },
  { test:/^Days$/i,         k:R({ kind:"count", unit:"days"   }) },
  { test:/^Hours$/i,        k:R({ kind:"count", unit:"hours"   }) },
  { test:/^Minutes$/i,      k:R({ kind:"count", unit:"min" }) },
  { test:/^Seconds$/i,      k:R({ kind:"count", unit:"sec"   }) },
  { test:/^Nanoseconds$/i,  k:R({ kind:"count", unit:"ns"  }) },

  // --- Biological ---
  { test:/^Breaths$/i,                        k:R({ kind:"count" }) },
  { test:/^Air inhaled \(Liters\)$/i,         k:R({ kind:"count", unit:"L" }) },
  { test:/^Blinks$/i,                         k:R({ kind:"count" }) },
  { test:/^Heartbeats$/i,                     k:R({ kind:"count" }) },
  { test:/^Blood pumped \(Liters\)$/i,        k:R({ kind:"count", unit:"L" }) },
  { test:/^Dead and replaced cells$/i,        k:R({ kind:"count" }) },
  { test:/^Liquid drank \(Liters\)$/i,        k:R({ kind:"count", unit:"L" }) },
  { test:/^Food eaten \(kilograms\)$/i,       k:R({ kind:"count", unit:"kg" }) },
  { test:/^Calories burned \(kcal\)$/i,       k:R({ kind:"count", unit:"kcal" }) },
  { test:/^Hair grown \(cm\)$/i,              k:R({ kind:"count", unit:"cm" }) },
  { test:/^Nail grown \(cm\)$/i,              k:R({ kind:"count", unit:"cm" }) },
  { test:/^Toilet visits$/i,                  k:R({ kind:"count" }) },
  { test:/^Dog years$/i,                      k:R({ kind:"count", disableOverlay:true }) },

  // --- Everyday ---
  { test:/^Steps taken$/i,                    k:R({ kind:"count" }) },
  { test:/^Kilometers walked$/i,              k:R({ kind:"count", unit:"km" }) },
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
  { test:/^Gigabytes downloaded$/i,           k:R({ kind:"count", unit:"GB" }) },
  { test:/^Gigabytes uploaded$/i,             k:R({ kind:"count", unit:"GB" }) },
  { test:/^Mined Bitcoin blocks$/i,           k:R({ kind:"count", unit:"Blocks" }) },
  { test:/^Chained Ethereum blocks$/i,        k:R({ kind:"count", unit:"Blocks" })},
  { test:/^Eye processed frames$/i,           k:R({ kind:"count", unit:"Frames" }) },

  // --- Cosmic ---
  { test:/^Sun equatorial rotations$/i,       k:R({ kind:"count" }) },
  { test:/^Lunar cycles$/i,                   k:R({ kind:"count" }) },
  { test:/^Venus days$/i,                     k:R({ kind:"count", unit:"days"}) },
  { test:/^Venus years$/i,                    k:R({ kind:"count", unit:"years" }) },
  { test:/^Martian days$/i,                   k:R({ kind:"count", unit:"days" }) },
  { test:/^Martian years$/i,                  k:R({ kind:"count", unit:"years" }) },
  { test:/^Jovian days$/i,                    k:R({ kind:"count", unit:"days" }) },
  { test:/^Jovian years$/i,                   k:R({ kind:"count", unit:"years" }) },
  { test:/^Halley comet orbits$/i,            k:R({ kind:"count" }) },
  { test:/^Kms in equatorial rotations$/i,    k:R({ kind:"count", unit:"km" }) },
  { test:/^Kms in solar orbit$/i,             k:R({ kind:"count", unit:"km" }) },
  { test:/^Kms in galactic motion$/i,         k:R({ kind:"count", unit:"km" }) },
  { test:/^Kms in Local Group motion\s*$/i,   k:R({ kind:"count", unit:"km" }) },

  // --- Eons ---
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
    if (r.test.test(label)) {
      const result: KindUnit = { ...r.k };
      if (result.kind !== "count") {
        result.disableOverlay = true;
      }
      return result;
    }
  }
  return { kind: "count" };
};
