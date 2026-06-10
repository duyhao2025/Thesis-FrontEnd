const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.on("response", res => {
    if (res.url().includes("auth/login")) {
      console.log("STATUS:", res.status(), "URL:", res.url());
      res.text().then(body => console.log("BODY:", body.substring(0, 300)));
    }
  });
  page.on("console", msg => {
    if (msg.type() === "error") console.log("BROWSER ERROR:", msg.text());
  });

  await page.goto("http://localhost:3000/login");
  await page.fill('input[type="email"]', "hod@uef.edu.vn");
  await page.fill('input[type="password"]', "Password");
  await page.click("button[type='submit']");
  await new Promise(r => setTimeout(r, 5000));
  console.log("FINAL URL:", page.url());
  const bodyText = await page.locator("body").innerText().catch(() => "");
  console.log("PAGE TEXT:", bodyText.substring(0, 200));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
