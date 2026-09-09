// Pesan pengguna tetap sederhana; rincian error tersimpan di konsol untuk diagnosis.
function showAppError(message, error) {
  if (error) console.error('Alqarni:', error);
  const display = () => {
    const banner = document.getElementById('appError');
    if (!banner) return;
    try { if (typeof closeCart === 'function') closeCart(); } catch { /* Tetap tampilkan pemulihan. */ }
    document.body.style.overflow = '';
    for (const element of document.body.children) element.inert = false;
    const drawer = document.getElementById('cartDrawer');
    if (drawer) { drawer.classList.remove('open'); drawer.inert = true; drawer.setAttribute('aria-hidden', 'true'); }
    const backdrop = document.getElementById('drawerBackdrop'); if (backdrop) backdrop.hidden = true;
    banner.hidden = false;
    document.getElementById('appErrorText').textContent = message;
    document.querySelectorAll('[data-whatsapp-general],[data-whatsapp-order],[data-whatsapp-shipping],.buy-now,.add-to-cart,#checkoutButton,#cartButton').forEach(button => { button.disabled = true; });
    document.getElementById('reloadPage').onclick = () => location.reload();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', display, { once: true });
  else display();
}
window.addEventListener('error', event => {
  if (event.target?.tagName === 'SCRIPT') {
    showAppError('Sebagian halaman gagal dimuat. Periksa koneksi lalu muat ulang.', event.target.src);
  } else if (event instanceof ErrorEvent) {
    showAppError('Ada kendala pada halaman. Silakan muat ulang.', event.error || event.message);
  }
}, true);
window.addEventListener('unhandledrejection', event => {
  showAppError('Proses halaman belum selesai. Silakan muat ulang.', event.reason);
});
