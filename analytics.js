// Semua event bersifat anonim dan tidak boleh memuat alamat, nomor pengunjung, atau isi pesan.
window.trackAnalyticsEvent = function trackAnalyticsEvent(name, parameters = {}) {
  if (typeof window.gtag !== 'function') return;
  const cleanParameters = Object.fromEntries(
    Object.entries(parameters).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
  window.gtag('event', name, cleanParameters);
};
