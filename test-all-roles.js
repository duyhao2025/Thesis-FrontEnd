const { chromium } = require("playwright");
const path = require("path");

const PASSWORD = "Password";
const SCREENSHOT_DIR = path.join(__dirname, "test-screenshots");

const TEST_ACCOUNTS = [
  { email: "hod@uef.edu.vn", role: "HeadOfDepartment" },
  { email: "lecturer1@uef.edu.vn", role: "Lecturer" },
  { email: "staff@uef.edu.vn", role: "FacultyStaff" },
  { email: "2251010001@uef.edu.vn", role: "Student" },
];

const ROLE_ROUTES = {
  HeadOfDepartment: ["/lecturer/dashboard"],
  Lecturer: ["/lecturer/dashboard", "/lecturer/topics"],
  FacultyStaff: ["/faculty-staff/dashboard", "/faculty-staff/registration-periods"],
  Student: ["/student/dashboard", "/student/topic-registrations"],
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function saveScreenshot(page, name) {
  const fs = require("fs");
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
    console.log(`  [Screenshot: ${name}.png]`);
  } catch (e) {
    console.log(`  [Screenshot error: ${e.message}]`);
  }
}

async function checkPageErrors(page) {
  const text = await page.locator("body").innerText().catch(() => "");
  const patterns = [
    /401 Unauthorized/i,
    /403 Forbidden/i,
    /404 Not Found/i,
    /500 Internal Server Error/i,
    /Network request failed/i,
    /ERR_CONNECTION_REFUSED/i,
    /Error:/i,
  ];
  for (const p of patterns) {
    if (p.test(text)) return text.substring(0, 150);
  }
  return null;
}

async function login(page, email) {
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 15000 });
  await sleep(1000);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await sleep(3000);

  const url = page.url();
  console.log(`  -> URL after login: ${url}`);

  if (url.includes("change-password")) {
    console.log("  -> Password change required, setting password...");
    await page.fill('input[name="currentPassword"]', PASSWORD);
    await page.fill('input[name="newPassword"]', PASSWORD);
    await page.fill('input[name="confirmPassword"]', PASSWORD);
    await page.click('button[type="submit"]');
    await sleep(3000);
    console.log(`  -> URL after password change: ${page.url()}`);
  }

  const err = await checkPageErrors(page);
  if (err) {
    console.log(`  LOGIN ERROR: ${err}`);
    await saveScreenshot(page, `login_error_${email.replace("@", "_at_")}`);
    return false;
  }
  return true;
}

async function testRoute(page, route) {
  console.log(`  Testing route: ${route}`);
  try {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await sleep(2000);

    if (page.url().includes("/login")) {
      console.log(`  FAIL: Redirected to login`);
      await saveScreenshot(page, `fail_${route.replace(/\//g, "_")}`);
      return "REDIRECT_TO_LOGIN";
    }

    const err = await checkPageErrors(page);
    if (err) {
      console.log(`  ERROR: ${err.substring(0, 100)}`);
      await saveScreenshot(page, `error_${route.replace(/\//g, "_")}`);
      return "ERROR";
    }

    console.log(`  OK`);
    return "OK";
  } catch (e) {
    console.log(`  EXCEPTION: ${e.message}`);
    await saveScreenshot(page, `except_${route.replace(/\//g, "_")}`);
    return "EXCEPTION";
  }
}

async function logout(page) {
  try {
    await page.evaluate(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    });
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.log("  Logout error:", e.message);
  }
}

async function main() {
  const fs = require("fs");
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  console.log("Starting Playwright browser...");
  const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {};

  for (const account of TEST_ACCOUNTS) {
    console.log(`\n========== ${account.email} (${account.role}) ==========`);
    const ok = await login(page, account.email);
    if (!ok) {
      results[account.email] = "LOGIN_FAILED";
      continue;
    }

    const routes = ROLE_ROUTES[account.role] || [];
    const routeResults = [];
    for (const route of routes) {
      const res = await testRoute(page, route);
      routeResults.push({ route, result: res });
    }

    results[account.email] = routeResults;
    await logout(page);
  }

  console.log("\n\n========== TEST SUMMARY ==========");
  for (const [email, data] of Object.entries(results)) {
    if (typeof data === "string") {
      console.log(`  ${email}: ${data}`);
    } else {
      console.log(`  ${email}:`);
      for (const r of data) {
        console.log(`    ${r.route}: ${r.result}`);
      }
    }
  }

  await browser.close();
  console.log("\nDone.");
}

main().catch(e => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
