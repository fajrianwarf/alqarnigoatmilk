function buildSingleOrderMessage(product) {
  return [
    `Halo, saya ingin pesan ${product.name} (${product.size}) sebanyak 1.`, '',
    hasPrice(product)
      ? `Harga yang tercantum di katalog ${priceText(product)}. Apakah stoknya tersedia?`
      : 'Apakah stoknya tersedia? Saya juga ingin tahu harganya.',
    '', 'Alamat pengiriman:', '',
    'Sekalian informasikan total beserta ongkirnya, terima kasih.',
  ].join('\n');
}
function buildCartOrderMessage(items) {
  let subtotal = 0;
  let missingPrice = false;
  const lines = items.map(({ product, quantity }, index) => {
    let total = 'mohon info harga';
    if (hasPrice(product)) {
      const amount = product.price * quantity;
      subtotal += amount;
      total = currencyFormatter.format(amount);
    } else missingPrice = true;
    return `${index + 1}. ${product.name} (${product.size})\n   ${quantity} × ${hasPrice(product) ? priceText(product) : 'harga belum tersedia'} — ${total}`;
  });
  return [
    'Halo, saya ingin pesan produk berikut:', '', ...lines, '',
    missingPrice
      ? `Subtotal produk yang sudah tercantum harganya: ${currencyFormatter.format(subtotal)}. Mohon info harga untuk produk lainnya.`
      : `Subtotal yang tercantum di katalog ${currencyFormatter.format(subtotal)}.`,
    'Apakah semua pilihannya tersedia?', '',
    'Nama penerima:', 'Alamat pengiriman:', 'Kecamatan/kota:', 'Kode pos:', '',
    'Sekalian informasikan total beserta ongkirnya, terima kasih.',
  ].join('\n');
}
