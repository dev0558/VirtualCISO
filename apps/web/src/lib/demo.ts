/** Public read-only demo. The API enforces it (DEMO_READ_ONLY); this only adjusts the UI to match. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
export const CONTACT_HREF = process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : "/#demo";
