/**
 * Seeds the history database with a believable moderation backlog so the
 * dashboard and audit trail look like a system that has been in use.
 *
 * Every subject here is deliberately mild: the audit trail is on screen in the
 * demo video, so nothing in it should be unpleasant to read.
 */

const API = process.env.AEGIS_API ?? "http://127.0.0.1:8000";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** [kind, subject, flagged, risk, summary, durationMs, minutesAgo] */
const SEED = [
  ["image", "community-post-4471.jpg", false, "safe", "Neutral 91.4%", 2480, 34],
  ["text", "Great breakdown, this helped me ship the fix today.", false, "safe", "No policy match", 1210, 47],
  ["audio", "voice-note-2208.mp3", false, "safe", "No policy match", 4870, 58],
  ["text", "Anyone else getting a 502 on the upload endpoint?", false, "safe", "No policy match", 980, 72],
  ["number", "Ping me at +1 415 555 0134 for the invoice.", true, "elevated", "1 number detected", 1640, 95],
  ["image", "listing-photo-1180.jpg", false, "safe", "Neutral 88.2%", 2310, 121],
  ["video", "clip-preview-0917.mov", false, "safe", "31 frames scanned", 24800, 143],
  ["text", "You are completely useless and nobody wants you here.", true, "high", "Harassment 87.4%", 1520, 168],
  ["image-text", "promo-banner-3390.png", true, "elevated", "Illicit 41.9%", 3020, 195],
  ["text", "Shipping took a while but the product is solid.", false, "safe", "No policy match", 1090, 224],
  ["audio", "support-call-0442.mp3", false, "safe", "No policy match", 6210, 259],
  ["image", "avatar-upload-7761.jpg", true, "critical", "Porn 96.8%", 2760, 288],
  ["text", "Can a mod pin the migration guide please?", false, "safe", "No policy match", 870, 316],
  ["number", "Reach me on WhatsApp 07700 900312 anytime.", true, "elevated", "1 number detected", 1380, 353],
  ["video", "highlight-reel-2041.mp4", false, "safe", "44 frames scanned", 31200, 402],
  ["text", "Thanks for the quick turnaround on the review.", false, "safe", "No policy match", 940, 468],
  ["image", "thumbnail-5523.jpg", false, "safe", "Neutral 93.1%", 2190, 531],
  ["audio", "podcast-excerpt-118.mp3", false, "safe", "Violence 2.1%", 7440, 604],
  ["text", "This is the third time support has ignored me.", false, "low", "Harassment 12.6%", 1150, 688],
  ["image", "product-shot-9012.jpg", false, "safe", "Neutral 95.7%", 2050, 795],
  ["video", "user-clip-3378.mp4", true, "high", "6 of 38 frames flagged", 28700, 902],
  ["text", "Loving the new dashboard, way faster than before.", false, "safe", "No policy match", 1020, 1044],
  ["image-text", "screenshot-6650.png", false, "safe", "No policy match", 2640, 1187],
  ["audio", "interview-cut-0071.mp3", false, "safe", "No policy match", 5980, 1320],
];

const now = Date.now();

const records = SEED.map(
  ([kind, subject, flagged, risk, summary, durationMs, minutesAgo], index) => ({
    id: `seed-${String(index).padStart(3, "0")}-${Math.random().toString(36).slice(2, 10)}`,
    kind,
    subject,
    createdAt: new Date(now - minutesAgo * MINUTE).toISOString(),
    flagged,
    risk,
    summary,
    durationMs,
  }),
);

const clear = await fetch(`${API}/history`, { method: "DELETE" });
if (!clear.ok) {
  console.error(`Failed to clear history: HTTP ${clear.status}`);
  process.exit(1);
}

const response = await fetch(`${API}/history/import`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ records }),
});

if (!response.ok) {
  console.error(`Failed to import history: HTTP ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const result = await response.json();
const flaggedCount = records.filter((record) => record.flagged).length;
console.log(
  `Seeded ${result.imported ?? records.length} records ` +
    `(${flaggedCount} flagged) spanning ${(SEED.at(-1)[6] / 60).toFixed(0)}h.`,
);
