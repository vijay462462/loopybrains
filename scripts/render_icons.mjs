// Renders the PNG icons from the SVG files. Usage: node scripts/render_icons.mjs
// (Needs Playwright with a Chromium; set CHROMIUM_PATH if it is not at /opt/pw-browsers/chromium.)
import { createRequire } from "module"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const require = createRequire(import.meta.url), here = path.dirname(fileURLToPath(import.meta.url)), docs = path.join(here, "..", "docs");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright");
const jobs = [["icon.svg", "icon-192.png", 192], ["icon.svg", "icon-512.png", 512], ["brand/maskable.svg", "icon-maskable-512.png", 512], ["icon.svg", "apple-touch-icon.png", 180], ["icon.svg", "favicon-32.png", 32], ["icon.svg", "brand/the-campus-loop-icon-1024.png", 1024]];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
for (const [src, out, n] of jobs) {
  const svg = fs.readFileSync(path.join(docs, src), "utf8").replace(/width="1024" height="1024"/, `width="${n}" height="${n}"`);
  const p = await b.newPage({ viewport: { width: n, height: n } });
  await p.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  await p.screenshot({ path: path.join(docs, out), omitBackground: true, clip: { x: 0, y: 0, width: n, height: n } });
  await p.close(); console.log("wrote", out);
}
await b.close();
