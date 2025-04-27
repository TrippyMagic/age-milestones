export const TIME_UNITS   = ["years","months","weeks","days","hours","minutes","seconds"] as const;
export const FUNKY_TIME_UNITS = ["We'll see"] as const; 
export const PRESETS = [1_000,5_000,10_000,20_000,40_000,1_000_000,10_000_000,100_000_000,1_000_000_000];
export const SLIDER  = PRESETS;                       
export type Unit = typeof TIME_UNITS[number];
export type FunkyUnit = typeof FUNKY_TIME_UNITS[number];
export const timezones = [
    { off: -12, city: "Baker Island" },
    { off: -11, city: "Pago Pago" },
    { off: -10, city: "Honolulu" },
    { off: -9,  city: "Anchorage" },
    { off: -8,  city: "Los Angeles" },
    { off: -7,  city: "Denver" },
    { off: -6,  city: "Chicago" },
    { off: -5,  city: "New York" },
    { off: -4,  city: "Santiago" },
    { off: -3,  city: "Buenos Aires" },
    { off: -2,  city: "South Georgia" },
    { off: -1,  city: "Azores" },
    { off: 0,   city: "London" },
    { off: 1,   city: "Rome" },
    { off: 2,   city: "Cairo" },
    { off: 3,   city: "Moscow" },
    { off: 4,   city: "Dubai" },
    { off: 5,   city: "Karachi" },
    { off: 6,   city: "Dhaka" },
    { off: 7,   city: "Bangkok" },
    { off: 8,   city: "Beijing" },
    { off: 9,   city: "Tokyo" },
    { off: 10,  city: "Sydney" },
    { off: 11,  city: "Nouméa" },
    { off: 12,  city: "Auckland" },
    { off: 13,  city: "Apia" },
    { off: 14,  city: "Kiritimati" },
];