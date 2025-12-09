const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const path = require("path");

(async () => {
  try {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const indexPath = path.resolve(__dirname, "..", "index.html");
    const url = "file://" + indexPath;
    console.log("Loading:", url);

    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(800);

    console.log("Running axe-core scan...");
    const results = await new AxePuppeteer(page).analyze();

    const fs = require("fs");
    const outPath = path.resolve(__dirname, "axe-report.json");
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");

    console.log("\nAxe scan complete. Results saved to tests/axe-report.json");
    console.log(`Violations found: ${results.violations.length}`);
    results.violations.forEach((v, i) => {
      console.log(`\n${i + 1}. ${v.id} - ${v.impact} - ${v.help}`);
      console.log(`   Affected nodes: ${v.nodes.length}`);
    });

    await browser.close();
  } catch (err) {
    console.error("Error running axe scan:", err);
    process.exit(1);
  }
})();
