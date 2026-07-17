const STORE_CONFIG = {
  // Ganti dengan nomor WhatsApp toko, format internasional tanpa tanda +, spasi, atau strip.
  whatsappNumber: '6281234567890',
  storeName: 'Alqarni Goat Milk',
};

const products = [
  {
    id: 'sachet-250',
    name: 'Alqarni Susu Kambing Premium Sachet',
    size: '250 gram / 10 sachet',
    description: 'Kemasan praktis untuk mencoba atau dibawa bepergian.',
    price: 75000,
    stockText: 'Ready stock',
    badge: 'Terlaris',
    image: 'assets/images/product-250g.svg',
  },
  {
    id: 'pouch-500',
    name: 'Alqarni Susu Kambing Standing Pouch',
    size: '500 gram',
    description: 'Kemasan lebih besar untuk penggunaan rutin di rumah.',
    price: 135000,
    stockText: 'Ready stock',
    badge: 'Hemat',
    image: 'assets/images/product-500g.svg',
  },
  {
    id: 'bundle-2box',
    name: 'Paket 2 Box Alqarni Susu Kambing',
    size: '2 box sachet',
    description: 'Paket pilihan untuk stok keluarga atau berbagi.',
    price: 140000,
    stockText: 'Stok terbatas',
    badge: 'Paket',
    image: 'assets/images/product-2box.svg',
  },
  {
    id: 'bundle-2pouch',
    name: 'Paket 2 Pouch Alqarni Goat Milk',
    size: '2 × 500 gram',
    description: 'Pilihan ekonomis dengan total isi satu kilogram.',
    price: 219300,
    stockText: 'Ready stock',
    badge: 'Best value',
    image: 'assets/images/product-2pouch.svg',
  },
];

let cart = loadCart();

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

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

function loadCart() {
  try {
    const storedCart = localStorage.getItem('alqarni-cart');
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (error) {
    console.warn('Keranjang tidak dapat dibaca:', error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem('alqarni-cart', JSON.stringify(cart));
}

function renderProducts() {
  productGrid.innerHTML = '';

  products.forEach((product) => {
    const node = productTemplate.content.cloneNode(true);
    const card = node.querySelector('.product-card');
    const image = node.querySelector('.product-image');

    card.dataset.productId = product.id;
    image.src = product.image;
    image.alt = `Foto ${product.name}`;
    node.querySelector('.product-badge').textContent = product.badge;
    node.querySelector('.product-size').textContent = product.size;
    node.querySelector('.product-name').textContent = product.name;
    node.querySelector('.product-description').textContent = product.description;
    node.querySelector('.product-price').textContent = currencyFormatter.format(product.price);
    node.querySelector('.product-stock').textContent = product.stockText;

    node.querySelector('.add-to-cart').addEventListener('click', () => addToCart(product.id));
    node.querySelector('.buy-now').addEventListener('click', () => orderSingleProduct(product.id));

    productGrid.appendChild(node);
  });
}

function addToCart(productId) {
  const existingItem = cart.find((item) => item.productId === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function updateQuantity(productId, change) {
  const item = cart.find((cartItem) => cartItem.productId === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((cartItem) => cartItem.productId !== productId);
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.productId !== productId);
  saveCart();
  renderCart();
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);

  cartCount.textContent = totalItems;
  cartSubtotal.textContent = currencyFormatter.format(subtotal);
  checkoutButton.disabled = cart.length === 0;
  checkoutButton.style.opacity = cart.length === 0 ? '0.55' : '1';

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Keranjang masih kosong. Pilih produk terlebih dahulu.</p>';
    return;
  }

  cartItems.innerHTML = '';

  cart.forEach((item) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    if (!product) return;

    const element = document.createElement('article');
    element.className = 'cart-item';
    element.innerHTML = `
      <img src="${product.image}" alt="Foto ${product.name}" />
      <div>
        <h3>${product.name}</h3>
        <p>${currencyFormatter.format(product.price)}</p>
        <div class="quantity-control" aria-label="Ubah jumlah ${product.name}">
          <button type="button" data-action="decrease" aria-label="Kurangi jumlah">−</button>
          <strong>${item.quantity}</strong>
          <button type="button" data-action="increase" aria-label="Tambah jumlah">+</button>
        </div>
      </div>
      <button class="remove-item" type="button">Hapus</button>
    `;

    element.querySelector('[data-action="decrease"]').addEventListener('click', () => updateQuantity(product.id, -1));
    element.querySelector('[data-action="increase"]').addEventListener('click', () => updateQuantity(product.id, 1));
    element.querySelector('.remove-item').addEventListener('click', () => removeFromCart(product.id));
    cartItems.appendChild(element);
  });
}

function openCart() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  drawerBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.hidden = true;
  document.body.style.overflow = '';
}

function openWhatsApp(message) {
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function orderSingleProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  openWhatsApp([
    `Halo ${STORE_CONFIG.storeName}, saya ingin memesan:`,
    '',
    `• ${product.name}`,
    `• Varian: ${product.size}`,
    `• Jumlah: 1`,
    `• Harga produk: ${currencyFormatter.format(product.price)}`,
    '',
    'Mohon konfirmasi stok, ongkir, total pembayaran, dan opsi COD jika tersedia.',
  ].join('\n'));
}

function checkoutCart() {
  if (cart.length === 0) return;

  let subtotal = 0;
  const productLines = cart.map((item, index) => {
    const product = products.find((productItem) => productItem.id === item.productId);
    if (!product) return '';

    const lineTotal = product.price * item.quantity;
    subtotal += lineTotal;
    return `${index + 1}. ${product.name}\n   ${product.size} × ${item.quantity} = ${currencyFormatter.format(lineTotal)}`;
  }).filter(Boolean);

  openWhatsApp([
    `Halo ${STORE_CONFIG.storeName}, saya ingin memesan produk berikut:`,
    '',
    ...productLines,
    '',
    `Subtotal produk: ${currencyFormatter.format(subtotal)}`,
    '',
    'Nama penerima:',
    'Alamat lengkap:',
    'Kecamatan/kota:',
    'Kode pos:',
    '',
    'Mohon konfirmasi stok, ongkir, total pembayaran, dan opsi COD jika tersedia.',
  ].join('\n'));
}

function sendGeneralQuestion() {
  openWhatsApp(`Halo ${STORE_CONFIG.storeName}, saya ingin bertanya mengenai produk susu kambing Alqarni.`);
}

cartButton.addEventListener('click', openCart);
closeCartButton.addEventListener('click', closeCart);
drawerBackdrop.addEventListener('click', closeCart);
checkoutButton.addEventListener('click', checkoutCart);

document.querySelectorAll('[data-whatsapp-general]').forEach((button) => {
  button.addEventListener('click', sendGeneralQuestion);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCart();
});

document.getElementById('currentYear').textContent = new Date().getFullYear();

renderProducts();
renderCart();
