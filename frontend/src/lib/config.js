export const APP_NAME = "DropSeal";
export const APP_TAGLINE = "Open a folder. Set a deadline. It seals itself.";

// Deadline urgency thresholds, used by the Stamp/Timer component to
// shift color as time runs out.
export const URGENT_THRESHOLD_RATIO = 0.25; // last 25% of the window
export const CRITICAL_THRESHOLD_SECONDS = 5 * 60; // last 5 minutes
