export const TIME_UNITS   = ["years","months","weeks","days","hours","minutes","seconds"] as const;
export const PRESETS = [1_000,5_000,10_000,20_000,40_000,1_000_000,10_000_000,100_000_000,1_000_000_000];
export const SLIDER  = PRESETS;                       
export type Unit = typeof TIME_UNITS[number];

export const landingIntro = `
Age Milestones offers a fresh way to <em>interpret</em> time not just count it.<br/><br/>

We usually digest time in small, familiar bites: hours, days, birthdays. Stretch those slices across a full-length timeline and the raw numbers become hard to grasp, even a little unsettling.<br/><br/>

This tool flips the view. It turns abstract counts into concrete way-points, showing how far you’ve travelled and how vast the road ahead can be.
You’ll soon be able to drop any span of time onto the same timeline and compare scales at a glance.<br/><br/>

No sugar coating, no melodrama, just a clear shift in perspective and a glimpse into the infinite stream of time that carries us all through our unique journeys.<br/><br/>
A simple, powerful reminder that <span class="quote">“No man ever steps in the same river twice”</span> and <span class="quote">“The road up and the road down are one and the same”</span>, as Heraclitus said, are more than clever catch-phrases: they are everlasting, enduring truths.
`;

