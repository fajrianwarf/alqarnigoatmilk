// Jalankan server lokal port 4173 dahulu. Memerlukan Playwright dan Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    fs.mkdirSync('.test-artifacts', { recursive: true });
    for (const width of [320,375,390,768,1024,1366,1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://127.0.0.1:4173');
      assert.equal(await page.locator('.product-card').count(), 6);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}px`);
      if ([390,1366].includes(width)) {
        await page.evaluate(async () => {
          for (const image of document.querySelectorAll('img')) {
            image.scrollIntoView({ behavior: 'instant' });
            await image.decode();
          }
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        await page.screenshot({ path: `.test-artifacts/home-${width}.png`, fullPage: true });
        await page.screenshot({ path: `.test-artifacts/hero-${width}.png` });
      }
    }
    assert.equal(await page.locator('#salesCounter').isVisible(), false);
    assert.equal(await page.locator('#testimoni').isVisible(), false);
    // Semua gambar produk yang dimuat benar-benar tersedia.
    await page.locator('#produk').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('.product-image')].slice(0,3).every(image => image.complete && image.naturalWidth > 0));
    await page.evaluate(() => { window.open = url => { window.lastWhatsApp = url; }; });
    await page.locator('[data-product-id="sachet-250"] .buy-now').click();
    let message = await page.evaluate(() => window.lastWhatsApp);
    assert.match(message, /^https:\/\/wa.me\/6285163007381\?text=/);
    assert.match(decodeURIComponent(message), /85\.000/);
    assert.doesNotMatch(decodeURIComponent(message), /COD/);
    await page.locator('[data-product-id="sachet-250"] .add-to-cart').click();
    assert.equal(await page.locator('#cartDrawer').getAttribute('aria-hidden'), 'false');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'checkoutButton');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#cartDrawer').getAttribute('aria-hidden'), 'true');
    await page.locator('[data-product-id="bundle-5pouch"] .add-to-cart').click();
    assert.equal(await page.locator('#cartSubtotal').textContent(), 'Dikonfirmasi admin');
    await page.locator('#checkoutButton').click();
    message = decodeURIComponent(await page.evaluate(() => window.lastWhatsApp));
    assert.match(message, /belum termasuk produk/);
    assert.match(message, /Paket 5 Pouch/);
    await page.keyboard.press('Escape');
    await page.reload();
    assert.equal(await page.locator('#cartCount').textContent(), '2');
    await page.evaluate(() => localStorage.setItem('alqarni-cart', '{"not":"array"}'));
    await page.reload();
    assert.equal(await page.locator('#cartCount').textContent(), '0');
    // Fixtures hanya disuntikkan saat tes, tidak disimpan sebagai ulasan/penjualan toko.
    await page.route('**/config.js', async route => {
      const body = fs.readFileSync('config.js','utf8') + '\nSTORE_CONFIG.sales.fallback = {jumlah:1250,satuan:"kemasan terjual",periode:"Data uji"};\ntestimonials.push({name:"Pelanggan uji",quote:"<b>Ulasan uji</b>",productId:"sachet-250",rating:5});';
      await route.fulfill({ contentType: 'text/javascript', body });
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width:390, height:844 });
    await page.reload();
    assert.equal(await page.locator('#salesNumber').textContent(), '1.250');
    assert.equal(await page.locator('.testimonial-card blockquote').textContent(), '<b>Ulasan uji</b>');
    assert.equal(await page.locator('.testimonial-card blockquote b').count(), 0);
    await page.locator('#testimoni').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.test-artifacts/testimonial-mobile-fixture.png' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    console.log('Passed: 7 viewport widths, product rendering, WA prices/number, cart totals/persistence, keyboard focus, hidden missing data, statistic and testimonial fixtures.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
