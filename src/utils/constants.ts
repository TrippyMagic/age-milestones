export const TIME_UNITS   = ["years","months","weeks","days","hours","minutes","seconds"] as const;
export const PRESETS = [1_000,5_000,10_000,20_000,40_000,1_000_000,10_000_000,100_000_000,1_000_000_000];
export const SLIDER  = PRESETS;                       
export type Unit = typeof TIME_UNITS[number];
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

export const landingIntro = `
Age Milestones offers a fresh way to <em>see</em> time not just count it.<br/><br/>

We usually digest time in small, familiar bites: hours, days, birthdays. Stretch those slices across a full-length timeline and the raw numbers become hard to grasp, even a little unsettling.<br/><br/>

This tool flips the view. It turns abstract counts into concrete way-points, showing how far you’ve travelled and how vast the road ahead can be.
You’ll soon be able to drop any span of time onto the same timeline and compare scales at a glance.<br/><br/>

No sugar coating, no melodrama, just a clear shift in perspective and a glimpse into the infinite stream of time that carries us all through our unique journeys.<br/><br/>
A simple, powerful reminder that <span class="quote">“No man ever steps in the same river twice”</span> and <span class="quote">“The road up and the road down are one and the same”</span>, as Heraclitus said, are more than clever catch-phrases: they are ever lasting, enduring truths.
`;

