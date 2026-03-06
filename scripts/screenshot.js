/**
 * Visual Regression Screenshot Tool
 * Usage: node scripts/screenshot.js [url] [pageName]
 * Example: node scripts/screenshot.js http://localhost:3000 homepage
 *
 * Takes screenshots at 3 breakpoints:
 *   - Mobile:  375px  (iPhone SE)
 *   - Tablet:  768px  (iPad)
 *   - Desktop: 1440px (standard desktop)
 *
 * Output: screenshots/<pageName>-<breakpoint>.png
 */

const { chromium } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

async function takeScreenshots(url = "http://localhost:3000", pageName = "page") {
  const outputDir = path.join(__dirname, "..", "screenshots");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    console.log(`📸 Capturing ${viewport.name} (${viewport.width}px)...`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Wait a moment for animations to settle
    await page.waitForTimeout(500);

    const filename = `${pageName}-${viewport.name}.png`;
    const filepath = path.join(outputDir, filename);
    await page.screenshot({ path: filepath, fullPage: true });

    results.push({ viewport: viewport.name, width: viewport.width, path: filepath });
    console.log(`   Saved: screenshots/${filename}`);

    await context.close();
  }

  await browser.close();

  console.log("\n✅ Done! Screenshots saved:");
  results.forEach((r) => console.log(`   ${r.viewport} (${r.width}px): ${r.path}`));
  return results;
}

const [, , url, pageName] = process.argv;
takeScreenshots(url, pageName).catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
