const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const context = vm.createContext({ currencyFormatter,
  hasPrice: product => Number.isFinite(product.price) && product.price >= 0,
  priceText: product => currencyFormatter.format(product.price) });
vm.runInContext(fs.readFileSync('whatsapp.js', 'utf8'), context);
test('Pesan personal mempertahankan nama, ukuran, dan harga dari katalog', () => {
  const message = context.buildSingleOrderMessage({ name: 'Pilihan A', size: '250 gram', price: 85000 });
  assert.match(message, /Pilihan A \(250 gram\)/);
  assert.match(message, /85\.000/);
  assert.match(message, /Apakah stoknya tersedia/);
  assert.match(message, /Alamat pengiriman:/);
});
test('Pesanan beberapa produk menghitung jumlah dan subtotal', () => {
  const message = context.buildCartOrderMessage([
    { product: { name: 'A', size: '250 gram', price: 85000 }, quantity: 2 },
    { product: { name: 'B', size: '500 gram', price: 150000 }, quantity: 1 },
  ]);
  assert.match(message, /170\.000/);
  assert.match(message, /320\.000/);
});
test('Harga kosong tetap diminta ke admin dan tidak dianggap nol', () => {
  const product = { name: 'A', size: '250 gram', price: null };
  assert.match(context.buildSingleOrderMessage(product), /ingin tahu harganya/);
  const message = context.buildCartOrderMessage([{ product, quantity: 1 }]);
  assert.match(message, /Mohon info harga untuk produk lainnya/);
  assert.doesNotMatch(message, /Subtotal yang tercantum di katalog/);
});
