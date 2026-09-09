const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('sales.js', 'utf8');
function context(fetch, storage = new Map()) {
  const ctx = vm.createContext({ fetch, setTimeout, clearTimeout, AbortController,
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key,value) } });
  vm.runInContext(source, ctx);
  return ctx;
}
const sample = 'jumlah,satuan,periode\r\n1250,kemasan terjual,Sejak Januari 2026\r\n';
test('CSV accepts quoted labels, BOM and CRLF; rejects missing and ambiguous numbers', () => {
  const ctx = context();
  assert.equal(ctx.parseSalesCsv(sample).jumlah, 1250);
  assert.equal(ctx.parseSalesCsv('\ufeffjumlah,satuan,periode\r\n1250,"kemasan, terjual","Sejak ""Januari"" 2026"').satuan, 'kemasan, terjual');
  for (const invalid of ['<html>Sign in</html>', 'jumlah,satuan,periode\n,box,2026',
    'jumlah,satuan,periode\n1.250,box,2026', 'jumlah,satuan,periode\n-1,box,2026',
    'jumlah,satuan,periode\n1,box,2026\n2,box,2026', 'jumlah,satuan,periode\n1,box,"2026',
    'jumlah,satuan,periode\n9007199254740992,box,2026']) assert.equal(ctx.parseSalesCsv(invalid), null);
  assert.equal(ctx.parseSalesCsv('jumlah,satuan,periode\n0,kemasan terjual,2026').jumlah, 0);
});
test('No URL hides unset statistic without making a request', async () => {
  const ctx = context(() => { throw new Error('Should not fetch'); });
  assert.equal(await ctx.loadSales({ csvUrl: '', fallback: null }), null);
});
test('Successful fetch caches data, reuses fresh cache, then falls back on outage', async () => {
  let requests = 0;
  const ctx = context(async () => { requests++; return { ok: true, text: async () => sample }; });
  const config = { csvUrl: 'https://example.test/sales.csv', fallback: null, cacheMinutes: 5 };
  assert.equal((await ctx.loadSales(config)).jumlah, 1250);
  assert.equal((await ctx.loadSales(config)).jumlah, 1250);
  assert.equal(requests, 1);
  ctx.fetch = async () => { throw new Error('Offline'); };
  assert.equal((await ctx.loadSales({ ...config, cacheMinutes: 0 })).jumlah, 1250);
  assert.equal(await ctx.loadSales({ ...config, csvUrl: 'https://example.test/other.csv' }), null);
});
test('Storage failure and invalid network data preserve configured fallback', async () => {
  const ctx = context(async () => ({ ok: true, text: async () => '<html>Login</html>' }));
  ctx.localStorage = { getItem: () => { throw new Error('Denied'); } };
  const config = { csvUrl: 'https://example.test/sales.csv', cacheMinutes: 5,
    fallback: { jumlah: 99, satuan: 'kemasan terjual', periode: '2026' } };
  assert.equal((await ctx.loadSales(config)).jumlah, 99);
});
