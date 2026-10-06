// End-to-end smoke test: opens the real app in a phone-sized browser and checks the main Loopy Search paths.
// Run: node tests/e2e/smoke.mjs   (needs Playwright; set CHROMIUM=/path/to/chromium if it is not found automatically)
import http from "node:http"; import { readFileSync, existsSync } from "node:fs"; import { extname, join } from "node:path";
const DOCS = new URL("../../docs/", import.meta.url).pathname, TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };
const srv = http.createServer((q, r) => { const p = join(DOCS, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html")); if (!p.startsWith(DOCS) || !existsSync(p)) { r.statusCode = 404; return r.end(); } r.setHeader("content-type", TYPES[extname(p)] || "application/octet-stream"); r.end(readFileSync(p)); });
await new Promise(res => srv.listen(0, res)); const base = "http://localhost:" + srv.address().port;
let pw; try { pw = await import("playwright"); } catch (_) { pw = await import("/opt/node22/lib/node_modules/playwright/index.mjs"); }
const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) });
const pg = await (await b.newContext({ viewport: { width: 412, height: 860 } })).newPage(), errs = [], fails = [];
pg.on("pageerror", e => errs.push(e.message));
await pg.route(/firebase|gstatic|googleapis|dicebear|wikipedia|wikimedia|openalex|sketchfab|wiktionary/, r => r.abort());
await pg.route(/app\.js/, r => r.fulfill({ contentType: "text/javascript", body: readFileSync(DOCS + "app.js", "utf8") + "\nwindow.__t={state,showPanel};" }));
await pg.addInitScript(() => { localStorage.setItem("dd-welcome-done", "1"); sessionStorage.setItem("dd-splash", "1"); sessionStorage.setItem("dd-ob-shown", "1"); localStorage.setItem("dd-name", "Tester"); });
const clean = () => pg.evaluate(() => document.querySelectorAll("#rgElig,#giftModal,.ss-back,.welcome,.cr,[role=dialog]:not(#bsFull),[aria-modal=true]:not(#bsFull)").forEach(x => x.remove()));
const check = (name, ok, info) => { console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  -> " + JSON.stringify(info))); if (!ok) fails.push(name); };
await pg.goto(base + "/index.html?c=rgukt"); await pg.waitForTimeout(1200); await clean();
check("app loads", await pg.evaluate(() => !!window.__t), null);
await pg.evaluate(() => window.__t.showPanel("ai")); await pg.waitForTimeout(700); await clean();
check("Loopy Search home shows the brand mark and composer", await pg.evaluate(() => !!document.querySelector(".bsc-brand") && !!document.querySelector(".bs-comp .bs-in") && document.querySelectorAll(".bs-engb").length === 4), null);
async function ask(q) { await pg.evaluate(() => window.__t.showPanel("ai")); await pg.waitForTimeout(400); await clean(); await pg.fill(".bs-in", q); await pg.keyboard.press("Enter"); await pg.waitForTimeout(700);
  await pg.evaluate(() => { const x = [...document.querySelectorAll(".bsr-size")].find(e => /Standard/.test(e.textContent)); x && x.click(); }); await pg.waitForTimeout(3200); await clean();
  return pg.evaluate(() => ({ hero: document.querySelector(".pk-hero h2")?.textContent || "", diagrams: document.querySelectorAll(".dg-card").length, learn: document.querySelectorAll(".pk-learn .tp-sub").length })); }
let r = await ask("logic gare"); check("typo 'logic gare' opens Logic gates with diagrams", r.hero === "Logic gates" && r.diagrams >= 2, r);
r = await ask("Digital Logic Design"); check("subject name opens the DLD overview", /Digital Logic Design/.test(r.hero) && r.learn > 30, r);
r = await ask("implement using only nand gates"); check("NAND-only question opens its pack", /NAND or only NOR/.test(r.hero), r);
r = await ask("half adder"); check("half adder pack has its circuit", /adder/i.test(r.hero) && r.diagrams >= 1, r);
check("no page errors", errs.length === 0, errs.slice(0, 3));
await b.close(); srv.close();
if (fails.length) { console.error("\n" + fails.length + " check(s) failed"); process.exit(1); } console.log("\nAll smoke checks passed");
