// Sumber publik toko. Data produk, gambar, penjualan, dan WhatsApp dibaca dari Sheets.
const SHEET_SOURCE = {
  url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2Iws2YZSl3en6EuEptAxi9G3XM6lFP2T83vbUujgI35OiimPmei0S1Y6QNKBFuexvpHxQR6k_rprH/pub',
  productsTab: '0',
  settingsTab: '2003694343',
  testimonialsTab: '1724827681',
};
let products = [];
const STORE_CONFIG = { whatsappNumber: '' };

function parseCsv(csv) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const input = csv.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) throw new Error('Format CSV tidak lengkap');
  row.push(cell.trim()); rows.push(row);
  return rows.filter(values => values.some(Boolean));
}

async function fetchSheet(gid) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(SHEET_SOURCE.url + '?gid=' + gid + '&single=true&output=csv', {
        signal: controller.signal, credentials: 'omit', cache: 'no-store',
      });
      if (!response.ok) {
        const error = new Error('Google Sheets HTTP ' + response.status);
        error.permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
        throw error;
      }
      const text = await response.text();
      if (text.length > 1000000 || /^\s*</.test(text)) {
        const error = new Error('Respons bukan data CSV yang diharapkan'); error.permanent = true; throw error;
      }
      return parseCsv(text);
    } catch (error) {
      if (attempt === 1 || error.permanent) throw error;
    } finally { clearTimeout(timer); }
    await new Promise(resolve => setTimeout(resolve, 700));
  }
}
function sheetRecords(rows, required) {
  if (!rows.length) throw new Error('Sheet kosong');
  const headers = rows[0].map(value => value.toLowerCase().trim());
  if (new Set(headers).size !== headers.length || required.some(key => !headers.includes(key))) {
    throw new Error('Kolom sheet tidak lengkap atau duplikat');
  }
  return rows.slice(1).map(values => Object.fromEntries(headers.map((key,index) => [key, values[index] || ''])));
}

function parsePrice(value) {
  if (!value) return null;
  // CSV mengikuti format tampilan Sheets: Rp85,000, Rp85.000, atau 85000.
  const amount = value.replace(/^Rp\s*/i, '').trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?:\.\d{3})+)$/.test(amount)) throw new Error('Format harga tidak valid');
  const number = Number(amount.replace(/[.,]/g, ''));
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Harga tidak valid');
  return number;
}

function productImage(value) {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('Tautan gambar tidak valid'); }
  if (url.protocol !== 'https:') throw new Error('Gambar harus memakai tautan HTTPS');
  if (url.hostname === 'drive.google.com') {
    const id = url.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id');
    if (!id || !/^[\w-]+$/.test(id)) throw new Error('Tautan gambar Drive tidak valid');
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`;
  }
  return url.href;
}

function readProducts(rows) {
  const records = sheetRecords(rows, ['produk','jenis','satuan','harga','deskripsi','gambar']);
  const items = [], issues = [], seen = new Set();
  const ids = records.map(data => data.id || data.produk + '|' + data.satuan);
  records.forEach((data,index) => {
    try {
      if (!data.produk || !data.satuan) throw new Error('Nama atau satuan kosong');
      const id = ids[index];
      if (seen.has(id) || ids.indexOf(id) !== ids.lastIndexOf(id)) throw new Error('ID produk duplikat');
      seen.add(id);
      let image = '';
      try { image = productImage(data.gambar); }
      catch (error) { issues.push('Baris ' + (index + 2) + ': ' + error.message); }
      items.push({ id, name: data.produk, size: data.satuan, price: parsePrice(data.harga),
        badge: data.jenis, description: data.deskripsi, image });
    } catch (error) { issues.push('Baris ' + (index + 2) + ': ' + error.message); }
  });
  return { items, issues };
}
function readSettings(rows) {
  const fields = new Map();
  for (const row of rows) {
    const key = row[0].toLowerCase().trim();
    if (fields.has(key)) fields.set(key, '');
    else fields.set(key, row[1] || '');
  }
  let phone = (fields.get('nomor whatsapp') || '').replace(/[\s()+-]/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  if (!/^[1-9]\d{7,14}$/.test(phone)) phone = '';
  const value = fields.get('banyak terjual') || '';
  const sold = /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
  return { phone, sold };
}
function readTestimonials(rows) {
  const records = sheetRecords(rows, ['nama','ulasan','produk','rating']);
  const items = [], issues = [];
  records.forEach((row,index) => {
    // Kolom tampilkan opsional. Jika ada, hanya nilai ya yang dipublikasikan.
    if ('tampilkan' in row && row.tampilkan.toLowerCase() !== 'ya') return;
    if (!row.nama || !row.ulasan || (row.rating && !/^[1-5]$/.test(row.rating))) {
      issues.push('Baris ' + (index + 2) + ': nama, ulasan, atau rating tidak valid'); return;
    }
    items.push({ name: row.nama, quote: row.ulasan, product: row.produk,
      rating: row.rating ? Number(row.rating) : null, source: row.sumber || '' });
  });
  return { items, issues };
}

function configureProductImage(image, product) {
  const wrap = image.parentElement;
  function showUnavailable() {
    image.hidden = true;
    const note = document.createElement('span');
    note.className = 'image-unavailable';
    note.textContent = 'Foto belum tersedia';
    if (!wrap.querySelector('.image-unavailable')) wrap.append(note);
  }
  wrap.querySelector('.image-unavailable')?.remove();
  image.hidden = false;
  image.removeAttribute('src');
  image.onerror = showUnavailable;
  image.alt = `${product.name}, ${product.size}`;
  image.referrerPolicy = 'no-referrer';
  if (product.image) image.src = product.image;
  else showUnavailable();
}

function setContactReady(ready) {
  if (!ready) STORE_CONFIG.whatsappNumber = '';
  document.querySelectorAll('[data-whatsapp-general], [data-whatsapp-order], [data-whatsapp-shipping]').forEach(button => {
    button.disabled = !ready;
    button.title = ready ? '' : 'Informasi kontak sedang dimuat';
  });
  const link = document.getElementById('whatsappContact');
  if (ready) {
    link.href = `https://wa.me/${STORE_CONFIG.whatsappNumber}`;
    link.textContent = `+${STORE_CONFIG.whatsappNumber}`;
  } else { link.removeAttribute('href'); link.textContent = 'Kontak sedang dimuat…'; }
}

let storeLoading = false;
async function loadStore() {
  if (storeLoading) return;
  storeLoading = true;
  const status = document.getElementById('catalogStatus');
  const retry = document.getElementById('retryCatalog');
  const reviewsStatus = document.getElementById('testimonialStatus');
  try {
    retry.hidden = true;
    status.textContent = 'Memuat katalog…'; status.hidden = false;
    reviewsStatus.textContent = 'Memuat ulasan…'; reviewsStatus.hidden = false;
    document.getElementById('retryTestimonials').hidden = true;
    document.getElementById('testimonialGrid').replaceChildren();
    document.getElementById('testimoni').hidden = false;
    setContactReady(false);
    checkoutButton.disabled = true;
    cartButton.disabled = true;
    productGrid.replaceChildren();
    document.getElementById('featureProductImage').hidden = true;
    resetSales();
    const outcomes = await Promise.allSettled([
      fetchSheet(SHEET_SOURCE.productsTab).then(readProducts),
      fetchSheet(SHEET_SOURCE.settingsTab).then(readSettings),
      fetchSheet(SHEET_SOURCE.testimonialsTab).then(readTestimonials),
    ]);
    const [catalog, settings, reviews] = outcomes;
    const problems = [];
    if (settings.status === 'fulfilled') {
      STORE_CONFIG.whatsappNumber = settings.value.phone;
      setContactReady(Boolean(settings.value.phone));
      if (!settings.value.phone) problems.push('Kontak pemesanan belum tersedia.');
      if (settings.value.sold !== null) initSales(settings.value.sold);
      else problems.push('Angka penjualan belum dapat dimuat.');
    } else {
      console.error('Pengaturan Sheets:', settings.reason);
      problems.push('Kontak dan angka penjualan belum dapat dimuat.');
    }
    if (!STORE_CONFIG.whatsappNumber) document.getElementById('whatsappContact').textContent = 'Kontak belum dapat dimuat';
    products = catalog.status === 'fulfilled' ? catalog.value.items : [];
    if (catalog.status === 'fulfilled') {
      if (catalog.value.issues.length) {
        console.warn('Data katalog:', catalog.value.issues);
        problems.push('Sebagian data produk belum dapat ditampilkan lengkap.');
      }
      if (products.length) configureProductImage(document.getElementById('featureProductImage'), products[0]);
      cart = loadCart();
    } else {
      console.error('Katalog Sheets:', catalog.reason);
      // Jangan menghapus keranjang tersimpan ketika sumber sedang gagal.
      cart = [];
      problems.push('Katalog belum dapat dimuat.');
    }
    renderProducts(); renderCart();
    cartButton.disabled = !products.length;
    if (reviews.status === 'fulfilled') {
      renderTestimonials(reviews.value.items);
      if (reviews.value.issues.length) {
        console.warn('Data testimoni:', reviews.value.issues);
        reviewsStatus.textContent = 'Sebagian ulasan belum dapat ditampilkan.';
        reviewsStatus.hidden = false;
        document.getElementById('testimoni').hidden = false;
        document.getElementById('retryTestimonials').hidden = false;
      }
    } else {
      console.error('Testimoni Sheets:', reviews.reason);
      reviewsStatus.textContent = 'Ulasan belum dapat dimuat. Silakan coba lagi.';
      document.getElementById('retryTestimonials').hidden = false;
    }
    status.textContent = problems.length ? problems.join(' ') : products.length ? '' : 'Belum ada produk yang tersedia.';
    status.hidden = !status.textContent;
    retry.hidden = !problems.length;
  } catch (error) {
    showAppError('Ada kendala saat menampilkan halaman. Silakan muat ulang.', error);
  } finally {
    storeLoading = false;
  }
}
