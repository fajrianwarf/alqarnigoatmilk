const currencyFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const hasPrice = product => Number.isFinite(product?.price) && product.price >= 0;
const priceText = product => hasPrice(product) ? currencyFormatter.format(product.price) : 'Tanya harga';
const productGrid = document.getElementById('productGrid');
const productTemplate = document.getElementById('productCardTemplate');
const cartButton = document.getElementById('cartButton');
const cartDrawer = document.getElementById('cartDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const closeCartButton = document.getElementById('closeCartButton');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const checkoutButton = document.getElementById('checkoutButton');
let cart = [];
let previousFocus = null;
let backgroundElements = [];

function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem('alqarni-cart') || '[]');
    if (!Array.isArray(stored)) return [];
    const seen = new Set();
    return stored.filter(item => {
      if (!item || seen.has(item.productId) || !products.some(product => product.id === item.productId) ||
          !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) return false;
      seen.add(item.productId);
      return true;
    }).map(({ productId, quantity }) => ({ productId, quantity }));
  } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem('alqarni-cart', JSON.stringify(cart)); } catch { /* Keranjang tetap berfungsi selama halaman terbuka. */ }
}
function renderProducts() {
  productGrid.replaceChildren();
  products.forEach(product => {
    const node = productTemplate.content.cloneNode(true);
    node.querySelector('.product-card').dataset.productId = product.id;
    configureProductImage(node.querySelector('.product-image'), product);
    node.querySelector('.product-badge').textContent = product.badge;
    node.querySelector('.product-size').textContent = product.size;
    node.querySelector('.product-name').textContent = product.name;
    node.querySelector('.product-description').textContent = product.description;
    node.querySelector('.product-price').textContent = priceText(product);
    const addButton = node.querySelector('.add-to-cart');
    const buyButton = node.querySelector('.buy-now');
    addButton.setAttribute('aria-label', `Tambahkan ${product.name} ke keranjang`);
    buyButton.setAttribute('aria-label', `Pesan ${product.name} melalui WhatsApp`);
    addButton.addEventListener('click', () => addToCart(product.id));
    buyButton.disabled = !STORE_CONFIG.whatsappNumber;
    buyButton.addEventListener('click', () => orderSingleProduct(product.id));
    productGrid.append(node);
  });
}
function addToCart(productId) {
  if (storeLoading || !products.some(product => product.id === productId)) return;
  const existing = cart.find(item => item.productId === productId);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, 999);
  else cart.push({ productId, quantity: 1 });
  saveCart(); renderCart(); openCart();
}
function updateQuantity(productId, change) {
  const item = cart.find(item => item.productId === productId);
  if (!item) return;
  item.quantity = Math.min(item.quantity + change, 999);
  if (item.quantity <= 0) cart = cart.filter(item => item.productId !== productId);
  saveCart(); renderCart();
  const target = cartItems.querySelector(`[data-product-id="${CSS.escape(productId)}"] [data-action="${change > 0 ? 'increase' : 'decrease'}"]`);
  (target || closeCartButton).focus();
}
function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(product => product.id === item.productId);
    return sum + (hasPrice(product) ? product.price * item.quantity : 0);
  }, 0);
  const missingPrice = cart.some(item => !hasPrice(products.find(product => product.id === item.productId)));
  cartCount.textContent = totalItems;
  cartButton.setAttribute('aria-label', `Buka keranjang, ${totalItems} produk`);
  cartSubtotal.textContent = missingPrice ? 'Dikonfirmasi admin' : currencyFormatter.format(subtotal);
  document.getElementById('cartNote').textContent = missingPrice
    ? 'Ada produk yang harganya perlu dikonfirmasi. Admin akan memberikan total lengkap beserta ongkir.'
    : 'Stok, ongkir, dan total akhir dikonfirmasi admin.';
  checkoutButton.disabled = cart.length === 0 || !STORE_CONFIG.whatsappNumber;
  cartItems.replaceChildren();
  if (!cart.length) {
    const message = document.createElement('p');
    message.className = 'empty-cart';
    message.textContent = 'Keranjang masih kosong. Pilih produk untuk mulai memesan.';
    cartItems.append(message);
    return;
  }
  cart.forEach(item => {
    const product = products.find(product => product.id === item.productId);
    const element = document.createElement('article');
    element.className = 'cart-item';
    element.dataset.productId = product.id;
    element.innerHTML = '<div class="cart-image"><img width="64" height="64" /></div><div><h3></h3><p></p><div class="quantity-control"><button type="button" data-action="decrease">−</button><strong></strong><button type="button" data-action="increase">+</button></div></div><button class="remove-item" type="button">Hapus</button>';
    configureProductImage(element.querySelector('img'), product);
    element.querySelector('h3').textContent = product.name;
    element.querySelector('p').textContent = product.size + ' · ' + priceText(product);
    element.querySelector('.quantity-control').setAttribute('aria-label', 'Jumlah ' + product.name);
    element.querySelector('.quantity-control strong').textContent = item.quantity;
    element.querySelector('[data-action="decrease"]').setAttribute('aria-label', 'Kurangi ' + product.name);
    element.querySelector('[data-action="increase"]').setAttribute('aria-label', 'Tambah ' + product.name);
    element.querySelector('[data-action="increase"]').disabled = item.quantity === 999;
    element.querySelector('.remove-item').setAttribute('aria-label', 'Hapus ' + product.name);
    element.querySelector('[data-action="decrease"]').addEventListener('click', () => updateQuantity(product.id, -1));
    element.querySelector('[data-action="increase"]').addEventListener('click', () => updateQuantity(product.id, 1));
    element.querySelector('.remove-item').addEventListener('click', () => {
      cart = cart.filter(item => item.productId !== product.id);
      saveCart(); renderCart(); closeCartButton.focus();
    });
    cartItems.append(element);
  });
}
function openCart() {
  if (cartDrawer.classList.contains('open')) return;
  previousFocus = document.activeElement;
  backgroundElements = [...document.body.children].filter(element =>
    ![cartDrawer, drawerBackdrop].includes(element) && !['SCRIPT','TEMPLATE'].includes(element.tagName) && !element.inert);
  backgroundElements.forEach(element => { element.inert = true; });
  cartDrawer.inert = false;
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartButton.setAttribute('aria-expanded', 'true');
  drawerBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  closeCartButton.focus();
}
function closeCart() {
  if (!cartDrawer.classList.contains('open')) return;
  backgroundElements.forEach(element => { element.inert = false; });
  (previousFocus?.isConnected ? previousFocus : cartButton).focus();
  cartDrawer.inert = true;
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartButton.setAttribute('aria-expanded', 'false');
  drawerBackdrop.hidden = true;
  document.body.style.overflow = '';
}
function openWhatsApp(message) {
  if (storeLoading) return;
  if (!STORE_CONFIG.whatsappNumber) return;
  window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}
const orderConfirmation = 'Mohon konfirmasi stok, total pembayaran, serta ongkir. Apakah alamat saya termasuk gratis ongkir Jogja dan sekitarnya via Wahana Express?';
function orderSingleProduct(productId) {
  const product = products.find(product => product.id === productId);
  if (!product) return;
  openWhatsApp([
    `Halo Admin, saya ingin memesan:`, '',
    `• ${product.name}`, `• Varian: ${product.size}`, '• Jumlah: 1',
    `• Harga produk: ${hasPrice(product) ? priceText(product) : 'Mohon info harga'}`, '',
    'Alamat tujuan:', '', orderConfirmation,
  ].join('\n'));
}
function checkoutCart() {
  if (!cart.length) return;
  let subtotal = 0;
  let missingPrice = false;
  const lines = cart.map((item,index) => {
    const product = products.find(product => product.id === item.productId);
    let total = 'Harga dikonfirmasi admin';
    if (hasPrice(product)) {
      subtotal += product.price * item.quantity;
      total = currencyFormatter.format(product.price * item.quantity);
    } else missingPrice = true;
    return `${index + 1}. ${product.name}\n   ${product.size} × ${item.quantity} = ${total}`;
  });
  openWhatsApp([
    `Halo Admin, saya ingin memesan:`, '', ...lines, '',
    missingPrice ? `Subtotal produk dengan harga tersedia: ${currencyFormatter.format(subtotal)} (belum termasuk produk yang perlu konfirmasi harga).`
      : `Subtotal produk: ${currencyFormatter.format(subtotal)}`,
    '', 'Nama penerima:', 'Alamat lengkap:', 'Kecamatan/kota:', 'Kode pos:', '', orderConfirmation,
  ].join('\n'));
}
cartButton.addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);
drawerBackdrop.addEventListener('click', closeCart);
checkoutButton.addEventListener('click', checkoutCart);
document.querySelectorAll('[data-whatsapp-general]').forEach(button => button.addEventListener('click', () => openWhatsApp(`Halo Admin, saya ingin bertanya mengenai produk Alqarni.`)));
document.querySelectorAll('[data-whatsapp-order]').forEach(button => button.addEventListener('click', () => openWhatsApp(`Halo Admin, saya ingin memesan susu kambing Alqarni. Mohon info pilihan kemasan, harga, dan stok yang tersedia.`)));
document.querySelectorAll('[data-whatsapp-shipping]').forEach(button => button.addEventListener('click', () => openWhatsApp(`Halo Admin, apakah alamat berikut termasuk gratis ongkir via Wahana Express?\n\nAlamat:\nKecamatan/kota:\nKode pos:`)));
document.addEventListener('keydown', event => {
  if (!cartDrawer.classList.contains('open')) return;
  if (event.key === 'Escape') closeCart();
  if (event.key === 'Tab') {
    const buttons = [...cartDrawer.querySelectorAll('button:not(:disabled), a[href]')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.getElementById('currentYear').textContent = new Date().getFullYear();
document.getElementById('retryCatalog').addEventListener('click', loadStore);
document.getElementById('retryTestimonials').addEventListener('click', reloadTestimonials);
renderCart();
loadStore();
