import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3020';
const email = `browser-e2e-${Date.now()}@bingo.test`;
const password = 'password123';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  console.log('1. Signup...');
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
  const signupForm = page.locator('form');
  await signupForm.locator('input[type="text"]').fill('Organizador Browser');
  await signupForm.locator('input[type="email"]').fill(email);
  await signupForm.locator('input[type="password"]').fill(password);
  await signupForm.getByRole('button', { name: 'Criar Conta' }).click();
  await page.getByText('Meus Bingos').waitFor({ timeout: 20_000 });

  console.log('2. Create event...');
  await page.getByRole('link', { name: /novo bingo/i }).first().click();
  await page.waitForURL(`${BASE}/create`);
  await page.locator('input[type="text"]').first().fill('Bingo Browser E2E');
  await page.locator('input[type="number"]').fill('2');
  await page.getByRole('button', { name: /gerar e finalizar evento/i }).click();
  await page.waitForURL(/\/event\/.+/, { timeout: 15_000 });
  await page.getByRole('heading', { level: 1 }).waitFor();

  console.log('3. Sell card...');
  await page.getByRole('button', { name: 'Registrar Venda' }).first().click();
  await page.getByPlaceholder('Nome Comprador').fill('João Browser');
  await page.getByPlaceholder('Telefone (opcional)').fill('11988887777');
  await page.locator('button.bg-emerald-500').first().click();
  await page.getByText('João Browser').waitFor({ timeout: 10_000 });

  console.log('4. Live draw...');
  await page.getByRole('link', { name: /iniciar sorteio/i }).click();
  await page.waitForURL(/\/live/);
  await page.getByRole('button', { name: /sortear pedra/i }).click();
  await page.waitForTimeout(2000);

  await page.getByText('Sorteio ao Vivo').waitFor();
  const drawnBadge = page.locator('.text-6xl, .text-7xl, .text-8xl').first();
  await drawnBadge.waitFor({ timeout: 10_000 });

  console.log('E2E browser smoke passed');
  console.log(`User: ${email}`);
} catch (error) {
  console.error('E2E browser smoke failed:', error);
  await page.screenshot({ path: 'e2e-failure.png', fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}