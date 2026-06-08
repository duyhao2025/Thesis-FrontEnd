const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const PWD = 'Password123!';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function login(page, email) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('domcontentloaded');
  await sleep(800);
  try { await page.evaluate(() => { localStorage.clear(); }); } catch(e) {}
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PWD);
  await page.click('button[type="submit"]');
  await sleep(4000);
  return page.url();
}

async function main() {
  const browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const t = msg.text();
    if (msg.type() === 'error' && !t.includes('Failed to load resource')) {
      console.log('  [Error]', t.substring(0, 120));
    }
  });

  let pass = 0, fail = 0;
  const result = (name, ok) => {
    console.log('  ' + name + ': ' + (ok ? 'PASS' : 'FAIL'));
    if (ok) pass++; else fail++;
  };

  // TEST 1: LOGIN
  console.log('\n[TEST 1] Login Lecturer');
  let url = await login(page, 'lecturer1@uef.edu.vn');
  result('Login', url.includes('/lecturer/') || url.includes('/dashboard'));

  // TEST 2: DASHBOARD
  console.log('\n[TEST 2] Lecturer Dashboard');
  await page.goto(BASE + '/lecturer/dashboard');
  await page.waitForLoadState('networkidle');
  await sleep(1500);
  const h1 = await page.textContent('h1').catch(() => '');
  result('Dashboard loads', h1.includes('Xin chào'));

  // TEST 3: TOPICS PAGE
  console.log('\n[TEST 3] Topics Page');
  await page.goto(BASE + '/lecturer/topics');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const topH1 = await page.textContent('h1').catch(() => '');
  result('Topics page loads', topH1.includes('Quản lý đề tài'));
  const createBtn = page.locator('button').filter({ hasText: /Tạo đề tài/ }).first();
  result('Create button visible', await createBtn.isVisible().catch(() => false));

  // TEST 4: CREATE TOPIC
  console.log('\n[TEST 4] Create Topic');
  await createBtn.click();
  await sleep(1000);
  const textboxes = page.getByRole('textbox');
  await textboxes.nth(0).fill('Đề tài Auto Test 2026');
  await textboxes.nth(1).fill('Mô tả chi tiết đề tài auto test được tạo tự động bởi script kiểm tra hệ thống quản lý luận văn UEF.');
  await textboxes.nth(2).fill('Nghiên cứu và phát triển module theo dõi tiến độ luận văn');
  await textboxes.nth(3).fill('Tập trung vào giai đoạn thực hiện và báo cáo định kỳ');
  await page.locator('input[type="number"]').fill('3');
  await page.getByLabel(/Danh mục/i).selectOption({ index: 1 });
  await page.getByLabel(/Bộ môn/i).selectOption({ index: 1 });
  await page.getByLabel(/Ngành/i).selectOption({ index: 1 });
  await page.locator('button').filter({ hasText: /Tạo đề tài$/ }).last().click();
  await sleep(3000);
  const rowsAfter = await page.locator('tbody tr').count();
  result('Topic created (row in table)', rowsAfter > 0);

  // TEST 5: PROGRESS PLANS
  console.log('\n[TEST 5] Progress Plans');
  await page.goto(BASE + '/lecturer/progress-plans');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const ppH1 = await page.textContent('h1').catch(() => '');
  result('Progress Plans page loads', ppH1.includes('Kế hoạch tiến độ'));
  const topicCol = await page.locator('th').filter({ hasText: /đề tài/i }).isVisible().catch(() => false);
  result('TopicTitle column visible', topicCol);

  // TEST 6: TOPIC PROPOSALS
  console.log('\n[TEST 6] Topic Proposals (Lecturer)');
  await page.goto(BASE + '/lecturer/topic-proposals');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const tpH1 = await page.textContent('h1').catch(() => '');
  result('Proposals page loads', tpH1.includes('Duyệt đề xuất'));

  // TEST 7: STUDENT LOGIN
  console.log('\n[TEST 7] Login Student');
  url = await login(page, '2251010001@uef.edu.vn');
  result('Student Login', url.includes('/student/') || url.includes('/dashboard'));

  // TEST 8: STUDENT DASHBOARD
  console.log('\n[TEST 8] Student Dashboard');
  await page.goto(BASE + '/student/dashboard');
  await page.waitForLoadState('networkidle');
  await sleep(1500);
  const stuH1 = await page.textContent('h1').catch(() => '');
  result('Student Dashboard loads', stuH1.includes('Xin chào'));

  // TEST 9: TOPIC REGISTRATION
  console.log('\n[TEST 9] Topic Registration');
  await page.goto(BASE + '/student/topic-registrations');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const regH1 = await page.textContent('h1').catch(() => '');
  result('Registration page loads', regH1.includes('Đăng ký đề tài'));

  // TEST 10: STUDENT TOPIC PROPOSALS
  console.log('\n[TEST 10] Student Topic Proposals');
  await page.goto(BASE + '/student/topic-proposals');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const propH1 = await page.textContent('h1').catch(() => '');
  result('Proposals page loads', propH1.includes('Đề xuất đề tài'));

  // TEST 11: PROPOSAL VALIDATION
  console.log('\n[TEST 11] Proposal Validation');
  const addBtn = page.locator('button').filter({ hasText: /Đề xuất/ }).first();
  if (await addBtn.isVisible()) {
    await addBtn.click();
    await sleep(500);
    await page.locator('button').filter({ hasText: /Gửi/ }).first().click();
    await sleep(1500);
    const valToast = await page.$('[role="alert"]');
    const valText = valToast ? (await valToast.textContent() || '').trim() : '';
    result('Validation message shown', valText.length > 0);
    await page.keyboard.press('Escape');
    await sleep(300);
  } else {
    result('Validation message shown', false);
  }

  // TEST 12: CREATE PROPOSAL
  console.log('\n[TEST 12] Create Topic Proposal');
  const addBtn2 = page.locator('button').filter({ hasText: /Đề xuất/ }).first();
  if (await addBtn2.isVisible()) {
    await addBtn2.click();
    await sleep(500);
    await page.getByRole('textbox').first().fill('Đề xuất: Hệ thống AI gợi ý đề tài luận văn');
    const tAs = await page.locator('textarea').all();
    if (tAs.length >= 1) await tAs[0].fill('Hệ thống sử dụng trí tuệ nhân tạo để phân tích năng lực sinh viên và gợi ý đề tài luận văn phù hợp nhất dựa trên lịch sử học tập.');
    if (tAs.length >= 2) await tAs[1].fill('Xây dựng module thu thập dữ liệu sinh viên và gợi ý đề tài dựa trên AI');
    if (tAs.length >= 3) await tAs[2].fill('Tập trung vào ngành Công nghệ thông tin và Khoa học máy tính tại UEF');
    await sleep(300);
    await page.locator('button').filter({ hasText: /Gửi/ }).first().click();
    await sleep(3000);
    const propToast = await page.$('[role="alert"]');
    const propText = propToast ? (await propToast.textContent() || '').trim() : '';
    result('Proposal created', propText.length > 0);
  } else {
    result('Proposal created', false);
  }

  // TEST 13: MY TOPIC
  console.log('\n[TEST 13] My Topic Page');
  await page.goto(BASE + '/student/my-topic');
  await page.waitForLoadState('networkidle');
  await sleep(2000);
  const myH1 = await page.textContent('h1').catch(() => '');
  result('My Topic page loads', myH1.length > 0);

  // TEST 14: FACULTY STAFF
  console.log('\n[TEST 14] FacultyStaff Login');
  url = await login(page, 'staff@uef.edu.vn');
  result('FacultyStaff Login', url.includes('/faculty-staff/') || url.includes('/dashboard'));

  console.log('\n========== RESULTS ==========');
  console.log('PASSED: ' + pass + '/' + (pass + fail));
  console.log('FAILED: ' + fail + '/' + (pass + fail));
  console.log('==============================');

  await sleep(2000);
  await browser.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
