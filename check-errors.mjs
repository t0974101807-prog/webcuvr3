import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on("console", (msg) => {
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });
  
  page.on("pageerror", (err) => {
    console.log(`[Browser Error] ${err.message}`);
  });

  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
