// CSV Google Sheets dibaca sebagai teks, tidak pernah dimasukkan sebagai HTML.
function parseSalesCsv(csv) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const input = csv.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (quoted) return null;
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  const nonempty = rows.filter(values => values.some(value => value.trim()));
  if (nonempty.length !== 2) return null;
  const keys = nonempty[0].map(value => value.trim().toLowerCase());
  if (new Set(keys).size !== keys.length) return null;
  const data = Object.fromEntries(keys.map((key, index) => [key, nonempty[1][index]?.trim()]));
  if (!/^\d+$/.test(data.jumlah || '')) return null;
  return validSales({ ...data, jumlah: Number(data.jumlah) });
}

function validSales(data) {
  if (!data || !Number.isSafeInteger(data.jumlah) || data.jumlah < 0 ||
      typeof data.satuan !== 'string' || !data.satuan.trim() || data.satuan.length > 80 ||
      typeof data.periode !== 'string' || !data.periode.trim() || data.periode.length > 120) return null;
  return { jumlah: data.jumlah, satuan: data.satuan.trim(), periode: data.periode.trim() };
}

async function loadSales(config) {
  const fallback = validSales(config.fallback);
  if (!config.csvUrl) return fallback;
  // Cache terpisah untuk setiap URL supaya pergantian sheet tidak membawa angka lama.
  const key = `alqarni-sales:${config.csvUrl}`;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(key)); } catch { /* Penyimpanan opsional. */ }
  const cacheData = validSales(cached?.data);
  const age = Date.now() - cached?.savedAt;
  if (cacheData && age >= 0 && age < config.cacheMinutes * 60000) return cacheData;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(config.csvUrl, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('Sumber angka tidak tersedia');
    const csv = await response.text();
    if (csv.length > 10000) throw new Error('Ukuran CSV tidak sesuai');
    const data = parseSalesCsv(csv);
    if (!data) throw new Error('Format statistik tidak sesuai');
    try { localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data })); } catch { /* Tetap tampil tanpa cache. */ }
    return data;
  } catch {
    return cacheData || fallback;
  } finally { clearTimeout(timeout); }
}

async function initSales() {
  const data = await loadSales(STORE_CONFIG.sales);
  if (!data) return;
  const section = document.getElementById('salesCounter');
  const number = document.getElementById('salesNumber');
  const formatter = new Intl.NumberFormat('id-ID');
  document.getElementById('salesLabel').textContent = data.satuan;
  document.getElementById('salesPeriod').textContent = data.periode;
  document.getElementById('salesAccessible').textContent = `${formatter.format(data.jumlah)} ${data.satuan}. ${data.periode}.`;
  number.textContent = formatter.format(data.jumlah);
  section.hidden = false;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / 1300, 1);
      number.textContent = formatter.format(Math.round(data.jumlah * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, { threshold: 0.5 });
  observer.observe(section);
}
