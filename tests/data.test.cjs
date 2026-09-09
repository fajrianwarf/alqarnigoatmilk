const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function loader(fetch) {
  const context = vm.createContext({ URL, AbortController, console, fetch,
    setTimeout: (fn, ms) => ms === 700 ? setTimeout(fn, 0) : 0, clearTimeout });
  vm.runInContext(fs.readFileSync('config.js', 'utf8'), context);
  return context;
}
test('CSV mempertahankan koma dan tanda kutip di ulasan', () => {
  const data = loader();
  const rows = data.parseCsv('nama,ulasan,produk,rating\r\nA,"Enak, katanya ""hangat""",Box,5');
  assert.equal(rows[1][1], 'Enak, katanya "hangat"');
  assert.throws(() => data.parseCsv('nama\n"belum selesai'));
});
test('Baris produk rusak tidak menggagalkan produk valid; gambar rusak tidak menghapus produk', () => {
  const data = loader();
  const result = data.readProducts(data.parseCsv('produk,jenis,satuan,harga,deskripsi,gambar\nA,box,250 g,"Rp85,000",Deskripsi,https://example.com/a.jpg\nB,box,250 g,bukan harga,Deskripsi,\nC,box,500 g,150000,Deskripsi,javascript:alert(1)'));
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].price, 85000);
  assert.equal(result.items[1].image, '');
  assert.equal(result.issues.length, 2);
});
test('Penjualan dan nomor WhatsApp divalidasi terpisah', () => {
  const data = loader();
  const settings = data.readSettings([['nomor whatsapp', '+62 812-3456-7890'], ['banyak terjual', 'salah']]);
  assert.equal(settings.phone, '6281234567890');
  assert.equal(settings.sold, null);
  const other = data.readSettings([['nomor whatsapp', 'salah'], ['banyak terjual', '0']]);
  assert.equal(other.phone, '');
  assert.equal(other.sold, 0);
});
test('Testimoni mendukung tabel saat ini serta filter tampilkan dan rating kosong', () => {
  const data = loader();
  const current = data.readTestimonials(data.parseCsv('nama,ulasan,produk,rating\nA,Ulasan,Box,5'));
  assert.equal(current.items.length, 1);
  const filtered = data.readTestimonials(data.parseCsv('nama,ulasan,produk,rating,tampilkan\nA,Ulasan,Box,5,tidak\nB,Ulasan,Box,,ya\nC,Ulasan,Box,9,ya'));
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].rating, null);
  assert.equal(filtered.issues.length, 1);
});
test('Gangguan jaringan dicoba ulang sekali, akses ditolak tidak diulang', async () => {
  let calls = 0;
  const data = loader(async () => {
    calls++;
    if (calls === 1) throw new Error('Offline');
    return { ok: true, text: async () => 'nama,ulasan\nA,Enak' };
  });
  assert.equal((await data.fetchSheet('1'))[1][0], 'A');
  assert.equal(calls, 2);
  calls = 0;
  data.fetch = async () => { calls++; return { ok: false, status: 403 }; };
  await assert.rejects(data.fetchSheet('1'), /403/);
  assert.equal(calls, 1);
});
