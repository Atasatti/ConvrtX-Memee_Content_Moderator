/**
 * Composes the finished demo film from the raw capture produced by
 * record-demo.mjs.
 *
 * The product footage is the subject: it sits in a fixed frame and is never
 * panned or Ken-Burnsed, because the motion that matters is the UI responding.
 * Everything this script adds is framing — a backdrop, chapter lower-thirds,
 * a technical chip per chapter, a progress rule, and title cards.
 *
 * Long model waits are time-lapsed rather than cut, so the elapsed-time
 * readouts on screen stay truthful.
 */

import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(here);
const rawDir = join(here, "raw");
const workDir = join(here, "work");
const outputPath = join(here, "aegis-demo.mp4");

/** Change this to taste — it is the only personal detail baked into the film. */
const AUTHOR = "Ata Ul Haq";

const W = 1920;
const H = 1080;
const FPS = 30;

// Window placement. Fixed for the whole film.
const WIN = { x: 176, y: 46, w: 1568, h: 882, r: 20 };

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const MONO = "SF Mono, Menlo, Consolas, monospace";

const INK = "#f6f7fb";
const MUTED = "#9aa0b4";
const BRAND = "#9f93ff";
const ACCENT = "#3ad6bd";

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const svg = (markup) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${markup}</svg>`);

function run(args, label) {
  const result = spawnSync("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
  if (result.status !== 0) {
    console.error(`\nffmpeg failed during ${label}:\n`);
    console.error(result.stderr?.toString().split("\n").slice(-30).join("\n"));
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Timeline: map raw capture time to output time, time-lapsing the long waits.
// ---------------------------------------------------------------------------

const manifest = JSON.parse(await readFile(join(rawDir, "manifest.json"), "utf8"));
const markAt = (name) => manifest.marks.find((m) => m.name === name)?.t ?? 0;

/**
 * The video analyzer runs every sampled frame through the NSFW model and then
 * transcribes the audio, which genuinely takes ~14s. Holding a real-time
 * spinner for that long kills the film, so the middle of the wait is sped up.
 * The head and tail play at 1x so the transition reads as a time-lapse.
 */
const RAMPS = [
  { from: markAt("video-scan-start") + 1.6, to: markAt("video-scan-done") - 1.1, speed: 6 },
];

const speedAt = (t) => RAMPS.find((r) => t >= r.from && t < r.to)?.speed ?? 1;

/**
 * Chromium only emits a screencast frame when something repaints, so a still
 * hold produces one frame with a long gap after it. Mid-capture that resolves
 * itself, but the closing hold on the audit trail has no following frame to
 * measure against — hence an explicit tail.
 */
const TAIL = 2.8;

const frames = manifest.frames;
const lines = [];
let outT = 0;
const rawToOut = [];

for (let i = 0; i < frames.length; i += 1) {
  const rawDur = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : TAIL;
  rawToOut.push({ raw: frames[i].t, out: outT });
  const d = Math.max(rawDur, 0) / speedAt(frames[i].t);
  lines.push(`file '${join(rawDir, frames[i].name)}'`, `duration ${d.toFixed(5)}`);
  outT += d;
}
lines.push(`file '${join(rawDir, frames.at(-1).name)}'`);

/** Output timestamp for a raw capture timestamp. */
function outAt(rawT) {
  let best = rawToOut[0];
  for (const p of rawToOut) {
    if (p.raw <= rawT) best = p;
    else break;
  }
  return best.out;
}

const BODY = outT;
const INTRO = 3.6;
const OUTRO = 5.4;
const XF = 0.6;

await rm(workDir, { recursive: true, force: true });
await mkdir(workDir, { recursive: true });
await writeFile(join(workDir, "frames.txt"), lines.join("\n"));

console.log(`Body: ${BODY.toFixed(1)}s from ${frames.length} frames`);

// ---------------------------------------------------------------------------
// Static plates
// ---------------------------------------------------------------------------

const backdropDefs = `
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#0c0d14"/><stop offset="1" stop-color="#07080c"/>
    </linearGradient>
    <radialGradient id="violet" cx="12%" cy="8%" r="70%">
      <stop offset="0" stop-color="#3a2f7d" stop-opacity=".40"/>
      <stop offset="1" stop-color="#07080d" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="mint" cx="94%" cy="96%" r="62%">
      <stop offset="0" stop-color="#0c5c52" stop-opacity=".26"/>
      <stop offset="1" stop-color="#07080d" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#ffffff" stroke-opacity=".022"/>
    </pattern>
  </defs>`;

await sharp(
  svg(`${backdropDefs}
    <rect width="${W}" height="${H}" fill="url(#base)"/>
    <rect width="${W}" height="${H}" fill="url(#violet)"/>
    <rect width="${W}" height="${H}" fill="url(#mint)"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>
    <rect x="${WIN.x - 22}" y="${WIN.y - 16}" width="${WIN.w + 44}" height="${WIN.h + 46}"
          rx="${WIN.r + 12}" fill="#000" opacity=".38"/>
    <rect x="${WIN.x - 9}" y="${WIN.y - 7}" width="${WIN.w + 18}" height="${WIN.h + 20}"
          rx="${WIN.r + 6}" fill="#0e1017" opacity=".85"/>`),
).png().toFile(join(workDir, "backdrop.png"));

// Grayscale rounded-rect mask that gives the footage its corner radius.
await sharp(
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIN.w}" height="${WIN.h}">
       <rect width="${WIN.w}" height="${WIN.h}" rx="${WIN.r}" fill="#fff"/>
     </svg>`,
  ),
).png().toFile(join(workDir, "mask.png"));

// Hairline that sits above the footage edge.
await sharp(
  svg(`<rect x="${WIN.x + 0.5}" y="${WIN.y + 0.5}" width="${WIN.w - 1}" height="${WIN.h - 1}"
             rx="${WIN.r}" fill="none" stroke="#ffffff" stroke-opacity=".13" stroke-width="1.5"/>`),
).png().toFile(join(workDir, "border.png"));

// ---------------------------------------------------------------------------
// Chapter lower-thirds
// ---------------------------------------------------------------------------

const BAND_Y = 968;

function captionPlate({ eyebrow, title, chip }) {
  return svg(`
    <defs>
      <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="${BRAND}"/><stop offset="1" stop-color="${ACCENT}"/>
      </linearGradient>
    </defs>
    <circle cx="${WIN.x + 5}" cy="${BAND_Y + 4}" r="5" fill="${ACCENT}"/>
    <text x="${WIN.x + 20}" y="${BAND_Y + 10}" fill="${BRAND}" font-family="${FONT}"
          font-size="17" font-weight="700" letter-spacing="2.6">${esc(eyebrow)}</text>
    <text x="${WIN.x}" y="${BAND_Y + 62}" fill="${INK}" font-family="${FONT}"
          font-size="42" font-weight="600" letter-spacing="-0.6">${esc(title)}</text>
    <rect x="${W - WIN.x - 1568}" y="0" width="0" height="0" fill="none"/>
    <text x="${WIN.x + WIN.w}" y="${BAND_Y + 10}" text-anchor="end" fill="${MUTED}"
          font-family="${MONO}" font-size="19" letter-spacing="0.2">${esc(chip)}</text>
    <text x="${WIN.x + WIN.w}" y="${BAND_Y + 60}" text-anchor="end" fill="#6f7488"
          font-family="${FONT}" font-size="17" letter-spacing="1.4">AEGIS</text>`);
}

/**
 * Every number a caption states comes from the records this capture actually
 * produced, formatted the way the product formats them. Nothing is hardcoded,
 * so re-recording can never leave a stale figure on screen.
 */
const facts = manifest.facts ?? {};

const dur = (ms) => (ms == null ? "" : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`);
const fact = (kind, fallback) => facts[kind]?.summary ?? fallback;

/** Chapters are anchored to capture marks, so copy can never drift off its scene. */
const CHAPTERS = [
  {
    at: "dashboard",
    until: "text",
    eyebrow: "01 · OVERVIEW",
    title: "One console for every content type",
    chip: "Next.js 16 · React 19 · MVVM",
  },
  {
    at: "text",
    until: "numbers",
    eyebrow: "02 · TEXT MODERATION",
    title: `${fact("text", "Harassment")} — returned in ${dur(facts.text?.durationMs)}`,
    chip: "POST /text/analyze · omni-moderation-latest",
  },
  {
    at: "numbers",
    until: "image",
    eyebrow: "03 · CONTACT-INFO LEAKS",
    title: `${fact("number", "Phone number found")} inside a normal sentence`,
    chip: "POST /text/check_number · gpt-4",
  },
  {
    at: "image",
    until: "video",
    eyebrow: "04 · IMAGE CLASSIFICATION",
    title: `Explicit imagery flagged in ${dur(facts.image?.durationMs)}`,
    chip: "TensorFlow nsfw.299x299 · EasyOCR",
  },
  {
    at: "video",
    until: "history",
    eyebrow: "05 · VIDEO PIPELINE",
    title: `${fact("video", "Frames scanned")}, plus the audio track`,
    chip: `${dur(facts.video?.durationMs)} end to end · whisper-1`,
  },
  {
    at: "history",
    until: "end",
    eyebrow: "06 · AUDIT TRAIL",
    title: "Every decision persisted and searchable",
    chip: "FastAPI · SQLite",
  },
];

const cues = [];
for (const [i, chapter] of CHAPTERS.entries()) {
  const isLast = i === CHAPTERS.length - 1;
  const start = outAt(markAt(chapter.at)) + 0.35;
  // The closing chapter runs through the tail hold but clears the outro xfade.
  const end = isLast
    ? BODY - XF - 0.25
    : Math.min(outAt(markAt(chapter.until)) - 0.15, BODY - 0.1);
  const file = join(workDir, `cap-${i}.png`);
  await sharp(captionPlate(chapter)).png().toFile(file);
  cues.push({ file, start, dur: Math.max(end - start, 1.2) });
}

// ---------------------------------------------------------------------------
// Title cards
// ---------------------------------------------------------------------------

const logoPng = await sharp(await readFile(join(projectRoot, "frontend", "src", "app", "icon.svg")))
  .resize(150, 150)
  .png()
  .toBuffer();

async function titleCard(file, { title, sub, meta, footer, titleSize = 104 }) {
  const plate = svg(`
    <defs>
      <linearGradient id="word" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="#ffffff"/><stop offset=".6" stop-color="#dcd7ff"/>
        <stop offset="1" stop-color="#7fe8d6"/>
      </linearGradient>
      <linearGradient id="rule2" x1="0" y1="0" x2="1" y2="0">
        <stop stop-color="${BRAND}"/><stop offset="1" stop-color="${ACCENT}"/>
      </linearGradient>
    </defs>
    <text x="${W / 2}" y="638" text-anchor="middle" fill="url(#word)" font-family="${FONT}"
          font-size="${titleSize}" font-weight="700" letter-spacing="-3">${esc(title)}</text>
    <text x="${W / 2}" y="700" text-anchor="middle" fill="${INK}" font-family="${FONT}"
          font-size="30" font-weight="500">${esc(sub)}</text>
    <rect x="${W / 2 - 150}" y="742" width="300" height="3" rx="1.5" fill="url(#rule2)"/>
    <text x="${W / 2}" y="800" text-anchor="middle" fill="${MUTED}" font-family="${MONO}"
          font-size="20" letter-spacing="0.4">${esc(meta)}</text>
    <text x="${W / 2}" y="946" text-anchor="middle" fill="#6f7488" font-family="${FONT}"
          font-size="17" letter-spacing="2.4">${esc(footer)}</text>`);

  await sharp(await sharp(svg(`${backdropDefs}
      <rect width="${W}" height="${H}" fill="url(#base)"/>
      <rect width="${W}" height="${H}" fill="url(#violet)"/>
      <rect width="${W}" height="${H}" fill="url(#mint)"/>
      <rect width="${W}" height="${H}" fill="url(#grid)"/>`)).png().toBuffer())
    .composite([
      { input: logoPng, left: Math.round(W / 2 - 75), top: 386 },
      { input: await sharp(plate).png().toBuffer(), left: 0, top: 0 },
    ])
    .png()
    .toFile(file);
}

await titleCard(join(workDir, "intro.png"), {
  title: "Aegis",
  sub: "Multimodal content moderation console",
  meta: "text · image · audio · video",
  footer: "PRODUCT WALKTHROUGH",
});

await titleCard(join(workDir, "outro.png"), {
  title: "Moderate anything.",
  sub: "One workspace, four analyzers, a full audit trail.",
  meta: "Next.js 16 · FastAPI · TensorFlow · OpenAI · SQLite",
  footer: `BUILT BY ${AUTHOR.toUpperCase()}`,
  titleSize: 88,
});

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

console.log("Pass 1/3 · normalising capture to CFR");
run(
  [
    "-y", "-f", "concat", "-safe", "0", "-i", join(workDir, "frames.txt"),
    "-vsync", "cfr", "-r", String(FPS),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p",
    join(workDir, "screen.mp4"),
  ],
  "pass 1",
);

console.log("Pass 2/3 · framing, chapters, progress rule");

const inputs = [
  "-loop", "1", "-i", join(workDir, "backdrop.png"),
  "-i", join(workDir, "screen.mp4"),
  "-i", join(workDir, "mask.png"),
  "-loop", "1", "-i", join(workDir, "border.png"),
];
for (const cue of cues) inputs.push("-loop", "1", "-t", cue.dur.toFixed(3), "-i", cue.file);

const chain = [
  `[1:v]scale=${WIN.w}:${WIN.h}:flags=lanczos,format=rgba[scr]`,
  `[2:v]format=gray[msk]`,
  `[scr][msk]alphamerge[scrr]`,
  `[0:v]scale=${W}:${H},format=rgba,trim=duration=${BODY.toFixed(3)},setpts=PTS-STARTPTS[bg]`,
  `[bg][scrr]overlay=${WIN.x}:${WIN.y}:eof_action=pass[w0]`,
  `[3:v]format=rgba,trim=duration=${BODY.toFixed(3)},setpts=PTS-STARTPTS[bd]`,
  `[w0][bd]overlay=0:0:eof_action=pass[w1]`,
];

let last = "w1";
cues.forEach((cue, i) => {
  const idx = 4 + i;
  const fadeOut = Math.max(cue.dur - 0.45, 0.05).toFixed(3);
  chain.push(
    `[${idx}:v]format=rgba,fade=t=in:st=0:d=0.42:alpha=1,` +
      `fade=t=out:st=${fadeOut}:d=0.42:alpha=1,setpts=PTS+${cue.start.toFixed(3)}/TB[c${i}]`,
  );
  const next = `w${i + 2}`;
  // Eases in from the left over 0.5s, then locks.
  const x = `'if(lt(t-${cue.start.toFixed(3)},0.5),-24*pow(1-(t-${cue.start.toFixed(3)})/0.5,2),0)'`;
  chain.push(
    `[${last}][c${i}]overlay=x=${x}:y=0:` +
      `enable='between(t,${cue.start.toFixed(3)},${(cue.start + cue.dur).toFixed(3)})':` +
      `eof_action=pass[${next}]`,
  );
  last = next;
});

chain.push(
  `[${last}]drawbox=x=${WIN.x}:y=1062:w=${WIN.w}:h=2:color=0xffffff@0.10:t=fill,` +
    `drawbox=x=${WIN.x}:y=1062:w='(t/${BODY.toFixed(3)})*${WIN.w}':h=2:color=0x9f93ff@0.95:t=fill,` +
    `format=yuv420p[vout]`,
);

run(
  [
    "-y", ...inputs,
    "-filter_complex", chain.join(";"),
    "-map", "[vout]",
    "-t", BODY.toFixed(3),
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(FPS),
    join(workDir, "body.mp4"),
  ],
  "pass 2",
);

for (const [name, seconds] of [["intro", INTRO], ["outro", OUTRO]]) {
  run(
    [
      "-y", "-loop", "1", "-i", join(workDir, `${name}.png`),
      "-t", String(seconds),
      "-vf",
      `zoompan=z='min(1+0.00055*on,1.035)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':` +
        `s=${W}x${H}:fps=${FPS},format=yuv420p`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-r", String(FPS),
      join(workDir, `${name}.mp4`),
    ],
    `${name} card`,
  );
}

console.log("Pass 3/3 · assembling and scoring");

const TOTAL = INTRO + BODY + OUTRO - 2 * XF;

/**
 * A quiet A-minor pad. Generated rather than licensed, kept well under the
 * footage so it reads as room tone instead of a soundtrack.
 */
const pad =
  `aevalsrc=` +
  `0.09*(0.62+0.38*sin(2*PI*0.055*t))*sin(2*PI*110*t)+` +
  `0.055*(0.55+0.45*sin(2*PI*0.041*t+1.1))*sin(2*PI*164.81*t)+` +
  `0.040*(0.5+0.5*sin(2*PI*0.033*t+2.2))*sin(2*PI*220*t)+` +
  `0.022*(0.5+0.5*sin(2*PI*0.027*t+0.7))*sin(2*PI*329.63*t)` +
  `:s=48000:d=${TOTAL.toFixed(2)}`;

run(
  [
    "-y",
    "-i", join(workDir, "intro.mp4"),
    "-i", join(workDir, "body.mp4"),
    "-i", join(workDir, "outro.mp4"),
    "-f", "lavfi", "-i", pad,
    "-filter_complex",
    [
      `[0:v][1:v]xfade=transition=fade:duration=${XF}:offset=${(INTRO - XF).toFixed(3)}[a]`,
      `[a][2:v]xfade=transition=fade:duration=${XF}:offset=${(INTRO + BODY - 2 * XF).toFixed(3)}[v]`,
      // Duplicated to stereo with a Haas delay on the right so the bed has
      // some width instead of sitting as a point source in the centre.
      `[3:a]lowpass=f=900,highpass=f=60,aecho=0.8:0.85:520:0.28,volume=1.6,` +
        `pan=stereo|c0=c0|c1=c0,adelay=0|14,` +
        `afade=t=in:st=0:d=2.2,afade=t=out:st=${(TOTAL - 3).toFixed(2)}:d=3[a1]`,
    ].join(";"),
    "-map", "[v]", "-map", "[a1]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-profile:v", "high", "-level", "4.1",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart",
    "-t", TOTAL.toFixed(2),
    outputPath,
  ],
  "pass 3",
);

console.log(`\nWrote ${outputPath} · ${TOTAL.toFixed(1)}s`);
