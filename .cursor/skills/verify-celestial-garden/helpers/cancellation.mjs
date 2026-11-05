import puppeteer from "puppeteer-core";
import { fileURLToPath } from "node:url";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root =
    process.env.RIPPLE_ROOT ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.."),
  out = path.resolve(process.argv[2] || ".verification-evidence/cancellation");
fs.mkdirSync(out, { recursive: true });
let browser, failure;
const server = http.createServer((req, res) => {
  let f = path.join(root, new URL(req.url, "http://localhost").pathname);
  if (f === root + "/") f += "index.html";
  if (!f.startsWith(root + "/") || !fs.existsSync(f)) {
    res.writeHead(404);
    return res.end();
  }
  res.setHeader(
    "Content-Type",
    f.endsWith(".js") ? "text/javascript" : "text/html",
  );
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
const results = [];
try {
  browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  for (const width of [390, 1365])
    for (const input of ["mouse", "touch"])
      for (const event of [
        "blur",
        "touchcancel",
        "pointercancel",
        "visibilitychange",
      ]) {
        const context = await browser.createBrowserContext(),
          page = await context.newPage();
        await page.setViewport({ width, height: 844, hasTouch: true });
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        await page.setRequestInterception(true);
        page.on("request", (r) =>
          r.url().startsWith(base) ? r.continue() : r.abort(),
        );
        await page.goto(base);
        const cdp = await page.createCDPSession();
        const read = () =>
          page.evaluate(async () => {
            const { state: s } = await import("/js/state.js");
            return {
              charging: s.isCharging,
              pointerDown: s.isPointerDown,
              chargeStartTime: s.chargeStartTime,
              ripples: s.ripples.length,
              initialized: s.isInitialized,
              paused: s.isPaused,
              lastTap: { ...s.lastTap },
              lastSoundTime: s.lastSoundTime,
            };
          });
        if (input === "mouse") {
          await page.mouse.move(180, 350);
          await page.mouse.down();
        } else
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: 180, y: 350 }],
          });
        const before = await read();
        await new Promise((r) => setTimeout(r, 650));
        await page.evaluate((event) => {
          if (event === "visibilitychange") {
            Object.defineProperty(document, "visibilityState", {
              configurable: true,
              value: "hidden",
            });
            document.dispatchEvent(new Event(event));
          } else window.dispatchEvent(new Event(event));
        }, event);
        const cancelled = await read();
        if (width === 390 && input === "mouse" && event === "blur")
          await page.screenshot({ path: path.join(out, "390-cancelled.png") });
        if (event === "visibilitychange")
          await page.evaluate(() => {
            Object.defineProperty(document, "visibilityState", {
              configurable: true,
              value: "visible",
            });
            document.dispatchEvent(new Event("visibilitychange"));
          });
        const preRelease = await read();
        if (input === "mouse") await page.mouse.up();
        else
          await cdp.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
        const after = await read();
        await page.mouse.click(180, 350);
        const fresh = await read();
        const ok =
          before.charging &&
          before.pointerDown &&
          !cancelled.charging &&
          !cancelled.pointerDown &&
          cancelled.chargeStartTime === 0 &&
          after.ripples === preRelease.ripples &&
          !after.initialized &&
          fresh.initialized &&
          fresh.ripples > 0 &&
          !errors.length;
        results.push({
          width,
          input,
          event,
          before,
          cancelled,
          preRelease,
          after,
          fresh,
          errors,
          ok,
        }); // Repeated interruption after initialization must discard each charge and recover.
        for (let cycle = 0; cycle < 4; cycle++) {
          await page.mouse.move(140, 300);
          await page.mouse.down();
          await page.evaluate(() => window.dispatchEvent(new Event("blur")));
          const cancelledAgain = await read();
          const count = cancelledAgain.ripples;
          await page.mouse.up();
          const releasedAgain = await read();
          if (
            cancelledAgain.charging ||
            cancelledAgain.pointerDown ||
            releasedAgain.ripples > count ||
            JSON.stringify(releasedAgain.lastTap) !==
              JSON.stringify(cancelledAgain.lastTap)
          )
            throw Error(
              "Rapid interruption leaked release " +
                JSON.stringify({
                  width,
                  input,
                  event,
                  cycle,
                  cancelledAgain,
                  releasedAgain,
                }),
            );
        }
        await page.mouse.move(180, 350);
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 650));
        await page.mouse.up();
        const held = await page.evaluate(async () => {
          const { state } = await import("/js/state.js");
          return state.ripples.some((r) => r.isPulse === "super");
        });
        if (!held) throw Error("Fresh hold did not recover");
        results[results.length - 1].rapidInterruptionCycles = 4;
        results[results.length - 1].freshLongHold = true;
        if (input === "mouse" && event === "visibilitychange")
          await page.screenshot({
            path: path.join(out, width + "-fresh-tap.png"),
          });
        await context.close();
      }
} catch (error) {
  failure = String(error);
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}
const result = {
  scope:
    "Real browser mouse and CDP-emulated touch starts/releases; interruption events simulated, not physical OS lifecycle. App module read-only observations.",
  ok: !failure && results.length === 16 && results.every((r) => r.ok),
  failure,
  results,
};
fs.writeFileSync(
  path.join(out, "result.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      ok: result.ok,
      cases: results.length,
      failed: results
        .filter((r) => !r.ok)
        .map(({ width, input, event, cancelled, after }) => ({
          width,
          input,
          event,
          cancelled,
          after,
        })),
    },
    null,
    2,
  ),
);
process.exitCode = result.ok ? 0 : 1;
