/**
 * Records raw demo footage by driving the real Aegis UI in Chromium.
 *
 * Nothing here is mocked: the frontend talks to the live backend and the
 * verdicts on screen are whatever the models actually return. The only things
 * this script adds are presentation-layer conveniences that never change what
 * the product does — a synthetic cursor, and a blur over the uploaded image
 * preview so the recording is safe to publish.
 *
 * Output: raw/frame-*.jpg plus raw/manifest.json (frame timings + scene marks),
 * which build-video.mjs turns into the finished film.
 */

import { chromium } from "playwright";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(here);
const rawDir = join(here, "raw");
const assetDir = join(here, "demo-assets");

const APP = process.env.AEGIS_APP ?? "http://localhost:3000";
const WIDTH = 1920;
const HEIGHT = 1080;

const TEST_DATA = join(projectRoot, "backend", "Data for testing apis");

/**
 * The uploads are copied to neutral filenames first. The originals are named
 * after what they contain, and that name would otherwise show up in the file
 * chip, the dashboard activity list, and the audit trail.
 */
const UPLOADS = {
  image: {
    from: join(TEST_DATA, "Images_for_testing", "porn_image_for_testing_nsfw_model.jpg"),
    to: join(assetDir, "ugc-upload-8842.jpg"),
  },
  video: {
    from: join(TEST_DATA, "Videos_For_testing", "file_example_MOV_1920_2_2MB.mov"),
    to: join(assetDir, "clip-preview-0917.mov"),
  },
};

/** Presentation-only CSS. Injected before any app code runs. */
const DEMO_CSS = `
  /*
   * Publish safety: the uploaded image preview is never shown in the clear.
   * Three stacked defences, because this footage goes on a public feed —
   * a heavy blur, a darkening scrim over the whole plate, and a label so a
   * viewer understands the obscuring is deliberate rather than a render bug.
   */
  img[alt="Selected image preview"] {
    filter: blur(58px) saturate(0.35) brightness(0.7) contrast(0.85) !important;
    transform: scale(1.35);
  }
  div:has(> img[alt="Selected image preview"]) { position: relative; }
  div:has(> img[alt="Selected image preview"])::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background: rgba(11,12,18,.46);
    pointer-events: none;
  }
  div:has(> img[alt="Selected image preview"])::after {
    content: "SENSITIVE PREVIEW BLURRED";
    position: absolute;
    inset: auto 0 0 0;
    z-index: 2;
    padding: 10px 14px;
    font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    letter-spacing: 0.14em;
    color: #cbd0e0;
    background: linear-gradient(to top, rgba(9,10,15,.94), rgba(9,10,15,0));
    text-align: center;
    pointer-events: none;
  }

  /* Next.js dev affordances must not appear in the film. */
  nextjs-portal { display: none !important; }

  /* Scrollbars read as chrome, not product. */
  ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
  * { scrollbar-width: none !important; }

  /* A blinking caret strobes badly once the footage is re-timed. */
  textarea, input { caret-color: transparent !important; }

  #aegis-cursor {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
    width: 26px;
    height: 26px;
    will-change: transform;
    transform: translate3d(-100px, -100px, 0);
  }
  #aegis-cursor svg { display: block; filter: drop-shadow(0 3px 7px rgba(0,0,0,.65)); }
  #aegis-ripple {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483646;
    pointer-events: none;
    width: 46px;
    height: 46px;
    margin: -23px 0 0 -23px;
    border-radius: 999px;
    opacity: 0;
    background: radial-gradient(circle, rgba(159,147,255,.55) 0%, rgba(159,147,255,0) 70%);
  }
  @keyframes aegis-ping {
    0%   { opacity: .95; transform: translate3d(var(--x), var(--y), 0) scale(.3); }
    100% { opacity: 0;   transform: translate3d(var(--x), var(--y), 0) scale(1.5); }
  }
`;

const CURSOR_SCRIPT = `
  (() => {
    const install = () => {
      if (document.getElementById("aegis-cursor")) return;
      const cursor = document.createElement("div");
      cursor.id = "aegis-cursor";
      cursor.innerHTML =
        '<svg viewBox="0 0 26 26" width="26" height="26" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M4 2 L4 20 L9 15.4 L12.2 22.4 L15.6 20.8 L12.5 14.1 L19 14 Z" ' +
        'fill="#fdfdff" stroke="#0b0c12" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      const ripple = document.createElement("div");
      ripple.id = "aegis-ripple";
      document.body.append(cursor, ripple);

      window.__aegisCursor = {
        move(x, y, ms) {
          cursor.style.transition = "transform " + ms + "ms cubic-bezier(.33,0,.16,1)";
          cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        },
        place(x, y) {
          cursor.style.transition = "none";
          cursor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        },
        press(x, y) {
          ripple.style.setProperty("--x", x + "px");
          ripple.style.setProperty("--y", y + "px");
          ripple.style.animation = "none";
          void ripple.offsetWidth;
          ripple.style.animation = "aegis-ping 520ms ease-out";
          cursor.animate(
            [{ scale: 1 }, { scale: 0.82 }, { scale: 1 }],
            { duration: 200, easing: "ease-out" },
          );
        },
      };
    };
    if (document.body) install();
    else document.addEventListener("DOMContentLoaded", install);
  })();
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function main() {
  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });

  const { copyFile } = await import("node:fs/promises");
  for (const { from, to } of Object.values(UPLOADS)) await copyFile(from, to);

  const browser = await chromium.launch({
    args: ["--force-device-scale-factor=1", "--hide-scrollbars", "--force-color-profile=srgb"],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "no-preference",
  });

  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();
  await page.addStyleTag({ content: DEMO_CSS }).catch(() => {});

  // The stylesheet has to survive client-side navigations too.
  page.on("load", () => void page.addStyleTag({ content: DEMO_CSS }).catch(() => {}));

  const marks = [];
  let frameCount = 0;
  let firstTimestamp = null;
  const frames = [];
  const writes = [];
  let recording = false;

  const client = await context.newCDPSession(page);
  client.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
    client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
    if (!recording) return;
    if (firstTimestamp === null) firstTimestamp = metadata.timestamp;
    const index = frameCount++;
    const name = `frame-${String(index).padStart(5, "0")}.jpg`;
    frames.push({ name, t: +(metadata.timestamp - firstTimestamp).toFixed(4) });
    writes.push(writeFile(join(rawDir, name), Buffer.from(data, "base64")));
  });

  const mark = (name) => {
    const t = frames.length ? frames.at(-1).t : 0;
    marks.push({ name, t });
    console.log(`  mark ${name} @ ${t.toFixed(2)}s`);
  };

  /** Moves the synthetic cursor and the real pointer together, so hover states fire. */
  async function moveTo(target, { ms = 780, offset = {} } = {}) {
    const box =
      typeof target === "object" && "x" in target
        ? { x: target.x, y: target.y, width: 0, height: 0 }
        : await target.boundingBox();
    if (!box) throw new Error("moveTo: target has no bounding box");

    const x = Math.round(box.x + box.width / 2 + (offset.x ?? 0));
    const y = Math.round(box.y + box.height / 2 + (offset.y ?? 0));

    const from = await page.evaluate(() => window.__aegisPointer ?? { x: 960, y: 900 });
    await page.evaluate(({ x, y, ms }) => window.__aegisCursor.move(x, y, ms), { x, y, ms });

    const steps = Math.max(8, Math.round(ms / 26));
    for (let i = 1; i <= steps; i += 1) {
      const p = easeInOut(i / steps);
      await page.mouse.move(from.x + (x - from.x) * p, from.y + (y - from.y) * p);
      await sleep(ms / steps);
    }
    await page.evaluate(({ x, y }) => (window.__aegisPointer = { x, y }), { x, y });
    return { x, y };
  }

  async function clickAt(target, options) {
    const { x, y } = await moveTo(target, options);
    await sleep(150);
    await page.evaluate(({ x, y }) => window.__aegisCursor.press(x, y), { x, y });
    await sleep(110);
    await page.mouse.click(x, y);
    return { x, y };
  }

  async function goto(path, label) {
    const link = page.locator(`nav a[href="${path}"]`).first();
    await clickAt(link);
    await page.waitForURL(`**${path}`, { timeout: 15000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    mark(label);
  }

  console.log("Loading app...");
  await page.goto(APP, { waitUntil: "networkidle" });
  await page.evaluate(() => window.__aegisCursor?.place(1180, 980));
  await page.evaluate(() => (window.__aegisPointer = { x: 1180, y: 980 }));
  await sleep(700);

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1,
  });
  recording = true;
  await sleep(300);

  // ---- Scene 1: dashboard ------------------------------------------------
  mark("dashboard");
  await moveTo({ x: 1500, y: 420 }, { ms: 1100 });
  await sleep(1500);

  // ---- Scene 2: text moderation -----------------------------------------
  await goto("/text", "text");
  await sleep(600);

  const textarea = page.locator("textarea").first();
  await clickAt(textarea, { offset: { y: -60 } });
  await sleep(250);
  mark("text-typing");
  await page.keyboard.type("You are completely worthless and everyone despises you.", {
    delay: 42,
  });
  await sleep(500);

  const runText = page.getByRole("button", { name: /run scan/i }).first();
  await clickAt(runText);
  mark("text-scan-start");
  await page.waitForSelector("text=/flagged|clean/i", { timeout: 60000 });
  mark("text-scan-done");
  await sleep(2600);

  // ---- Scene 3: phone-number detection ----------------------------------
  const numbersTab = page.getByRole("radio", { name: /^numbers$/i }).first();
  await clickAt(numbersTab);
  mark("numbers");
  await sleep(500);

  const contactSample = page.getByRole("button", { name: /contact info/i }).first();
  await clickAt(contactSample);
  await sleep(700);

  const runNumbers = page.getByRole("button", { name: /run scan/i }).first();
  await clickAt(runNumbers);
  mark("numbers-scan-start");
  await page.waitForSelector("text=/phone numbers? detected/i", { timeout: 60000 });
  mark("numbers-scan-done");
  await sleep(2400);

  // ---- Scene 4: image NSFW classification --------------------------------
  await goto("/image", "image");
  await sleep(500);

  const dropzone = page.getByRole("button", { name: /drop an image/i }).first();
  await moveTo(dropzone, { ms: 700 });
  const dropBox = await dropzone.boundingBox();
  await page.evaluate(
    ({ x, y }) => window.__aegisCursor.press(x, y),
    { x: dropBox.x + dropBox.width / 2, y: dropBox.y + dropBox.height / 2 },
  );
  await page.locator('input[type="file"]').first().setInputFiles(UPLOADS.image.to);
  mark("image-selected");
  await page.waitForSelector('img[alt="Selected image preview"]', { timeout: 15000 });
  await sleep(1500);

  const runImage = page.getByRole("button", { name: /run scan/i }).first();
  await clickAt(runImage);
  mark("image-scan-start");
  await page.waitForSelector("text=/flagged|critical|porn/i", { timeout: 180000 });
  mark("image-scan-done");
  await sleep(1200);
  await page.mouse.wheel(0, 260);
  await sleep(2600);

  // ---- Scene 5: video frame sampling -------------------------------------
  await goto("/video", "video");
  await sleep(500);

  const videoDrop = page.getByRole("button", { name: /drop a video/i }).first();
  await moveTo(videoDrop, { ms: 700 });
  const videoBox = await videoDrop.boundingBox();
  await page.evaluate(
    ({ x, y }) => window.__aegisCursor.press(x, y),
    { x: videoBox.x + videoBox.width / 2, y: videoBox.y + videoBox.height / 2 },
  );
  await page.locator('input[type="file"]').first().setInputFiles(UPLOADS.video.to);
  mark("video-selected");
  await sleep(1600);

  const runVideo = page.getByRole("button", { name: /run scan/i }).first();
  await clickAt(runVideo);
  mark("video-scan-start");
  await page.waitForSelector("text=/frame timeline/i", { timeout: 900000 });
  mark("video-scan-done");
  await sleep(1400);
  await page.mouse.wheel(0, 300);
  await sleep(2800);

  // ---- Scene 6: audit trail ----------------------------------------------
  await goto("/history", "history");
  await sleep(1200);
  await page.mouse.wheel(0, 220);
  await sleep(2600);
  mark("end");

  recording = false;
  await client.send("Page.stopScreencast").catch(() => {});
  await Promise.all(writes);

  /**
   * The captions quote real numbers, so they are read back from the records the
   * app just wrote rather than hardcoded. Model latency varies run to run, and
   * a stale figure burned into the film would be a lie about the product.
   */
  const facts = {};
  try {
    const api = process.env.AEGIS_API ?? "http://127.0.0.1:8000";
    const history = await (await fetch(`${api}/history`)).json();
    for (const kind of ["text", "number", "image", "video"]) {
      const record = history.find((r) => r.kind === kind);
      if (record) {
        facts[kind] = {
          summary: record.summary,
          durationMs: record.durationMs,
          risk: record.risk,
        };
      }
    }
    console.log("\nCaptured facts:");
    for (const [kind, f] of Object.entries(facts)) {
      console.log(`  ${kind}: ${f.summary} (${Math.round(f.durationMs)}ms, ${f.risk})`);
    }
  } catch (error) {
    console.warn(`Could not read history facts: ${error.message}`);
  }

  await writeFile(
    join(rawDir, "manifest.json"),
    JSON.stringify({ width: WIDTH, height: HEIGHT, frames, marks, facts }, null, 2),
  );

  const duration = frames.at(-1)?.t ?? 0;
  console.log(
    `\nCaptured ${frames.length} frames over ${duration.toFixed(1)}s ` +
      `(~${(frames.length / duration).toFixed(1)} fps)`,
  );

  await context.close();
  await browser.close();
}

main().catch(async (error) => {
  console.error("\nRecording failed:", error.message);
  process.exit(1);
});
