const { chromium } = require("playwright");
const path = require("path");
const SHOT_DIR = "C:\\Users\\IOM\\AppData\\Local\\Temp\\claude\\C--Users-IOM-Desktop-Sacco\\47a835ae-f8cd-455b-b5f1-8b1f6e20ce00\\scratchpad";
const BASE_URL = "https://edulaepe.vercel.app";
function shotPath(name) { return path.join(SHOT_DIR, `${name}.png`); }

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const overflowing = [];
    if (docWidth > winWidth + 2) {
      document.querySelectorAll("*").forEach((el) => {
        if (el.scrollWidth > winWidth + 5) {
          overflowing.push({
            tag: el.tagName,
            cls: (el.className || "").toString().slice(0, 80),
            width: el.scrollWidth,
          });
        }
      });
    }
    return { docWidth, winWidth, overflowCount: overflowing.length, samples: overflowing.slice(0, 5) };
  });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } }); // iPhone-ish

  // Landing page (logged out)
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: shotPath("m01-landing"), fullPage: true });
  console.log("landing overflow:", JSON.stringify(await checkOverflow(page)));

  // Login
  await page.getByLabel("National ID / registration number").fill("00000000");
  await page.getByLabel("Password", { exact: true }).fill("ChangeMe123");
  await page.locator('button[type="submit"]', { hasText: "Sign in" }).click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: shotPath("m02-dashboard"), fullPage: true });
  console.log("dashboard overflow:", JSON.stringify(await checkOverflow(page)));

  const pages = [
    ["m03-members", "/admin/members"],
    ["m04-loans", "/admin/loans"],
    ["m05-projects", "/admin/projects"],
    ["m06-settings", "/admin/settings"],
    ["m07-reports", "/admin/reports"],
  ];
  for (const [name, path_] of pages) {
    await page.goto(`${BASE_URL}${path_}`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: shotPath(name), fullPage: true });
    console.log(`${name} overflow:`, JSON.stringify(await checkOverflow(page)));
  }

  await browser.close();
}
main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
