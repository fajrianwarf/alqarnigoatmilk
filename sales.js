let salesObserver = null;
let salesFrame = null;
function resetSales() {
  salesObserver?.disconnect();
  if (salesFrame !== null) cancelAnimationFrame(salesFrame);
  salesObserver = null; salesFrame = null;
  document.getElementById('salesCounter').hidden = true;
}
function initSales(sold) {
  resetSales();
  const data = { jumlah: sold, satuan: 'Terjual', periode: '' };
  const section = document.getElementById('salesCounter');
  const number = document.getElementById('salesNumber');
  const formatter = new Intl.NumberFormat('id-ID');
  document.getElementById('salesLabel').textContent = data.satuan;
  document.getElementById('salesPeriod').textContent = data.periode;
  document.getElementById('salesPeriod').hidden = !data.periode;
  document.getElementById('salesAccessible').textContent = `${formatter.format(data.jumlah)} ${data.satuan}${data.periode ? `. ${data.periode}` : ''}.`;
  const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window;
  number.textContent = animate ? '0' : formatter.format(data.jumlah);
  section.hidden = false;
  if (!animate) return;
  salesObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    salesObserver.disconnect();
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / 1300, 1);
      number.textContent = formatter.format(Math.round(data.jumlah * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) salesFrame = requestAnimationFrame(frame);
    }
    salesFrame = requestAnimationFrame(frame);
  }, { threshold: 0.5 });
  salesObserver.observe(section);
}
