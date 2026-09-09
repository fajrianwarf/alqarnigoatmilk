// Pengaturan toko. Nilai null menunggu data final, bukan angka contoh.
const STORE_CONFIG = {
  whatsappNumber: '6285163007381',
  storeName: 'Alqarni Goat Milk',
  sales: {
    // URL File > Bagikan > Publikasikan ke web > tab Statistik > CSV.
    csvUrl: '',
    // Isi dengan { jumlah: 123, satuan: 'kemasan terjual', periode: 'Sejak Januari 2026' }
    // hanya setelah angka penjualan sebenarnya tersedia.
    fallback: null,
    cacheMinutes: 5,
  },
};

const products = [
  { id: 'sachet-250', name: 'Alqarni Box', size: '250 gram / 10 sachet',
    description: 'Sachet praktis untuk menemani rutinitas sehari-hari.',
    price: 85000, badge: 'Sachet', image: 'assets/images/box-250.webp' },
  { id: 'pouch-500', name: 'Alqarni Standing Pouch', size: '500 gram',
    description: 'Pilihan kemasan untuk persediaan susu di rumah.',
    price: 150000, badge: 'Pouch', image: 'assets/images/pouch-500.webp' },
  { id: 'bundle-2box', name: 'Paket 2 Box Alqarni', size: '2 × 250 gram',
    description: 'Dua box sachet untuk dinikmati sendiri atau bersama keluarga.',
    price: 160000, badge: 'Paket keluarga', image: 'assets/images/bundle-2box.webp' },
  { id: 'bundle-2pouch', name: 'Paket 2 Pouch Alqarni', size: '2 × 500 gram',
    description: 'Dua pouch dalam satu pesanan, praktis untuk stok di rumah.',
    price: 255000, badge: 'Paket keluarga', image: 'assets/images/bundle-2pouch.webp' },
  { id: 'bundle-5box', name: 'Paket 5 Box Alqarni', size: '5 × 250 gram',
    description: 'Persediaan sachet untuk keluarga dan orang terdekat.',
    price: 375000, badge: 'Paket bersama', image: 'assets/images/bundle-5box.webp' },
  { id: 'bundle-5pouch', name: 'Paket 5 Pouch Alqarni', size: '5 × 500 gram',
    description: 'Paket pouch untuk kebutuhan bersama dalam satu pemesanan.',
    price: null, badge: 'Paket bersama', image: 'assets/images/bundle-5pouch.webp' },
];

// Hanya ulasan asli Alqarni yang sudah mendapat izin untuk ditampilkan.
// Bentuk: { name: 'Nama tersamarkan', quote: 'Ulasan asli', productId: 'sachet-250', rating: 5 }
// rating boleh dihilangkan jika pelanggan tidak memberikan nilai bintang.
const testimonials = [];
