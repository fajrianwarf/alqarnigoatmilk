# Alqarni Goat Milk

Katalog statis HTML, CSS, dan JavaScript dengan pemesanan WhatsApp. Tidak memerlukan server aplikasi atau instalasi package untuk menjalankan website.

## Pratinjau lokal

Dari folder proyek, jalankan `python -m http.server 4173 --bind 127.0.0.1`, lalu buka http://127.0.0.1:4173. Live Server juga dapat digunakan. HTTP lokal disarankan agar ikon SVG dan koneksi Sheets bekerja seperti saat hosting.

## Mengubah produk dan harga

Pengaturan toko, produk, statistik, dan testimoni berada di `config.js`.

- Nomor WhatsApp: `6285163007381`.
- Harga berupa angka rupiah tanpa pemisah ribuan.
- `price: null` menampilkan “Tanya harga”. Produk tetap bisa dipesan; keranjang dengan harga belum tersedia tidak menampilkan subtotal sebagai total lengkap.
- Setiap produk memakai ID tetap agar keranjang tersimpan tetap cocok setelah harga diperbarui.
- Stok saat ini dikonfirmasi admin. Screenshot harga memuat listing aktif dan habis yang tampak duplikat, sehingga belum menjadi sumber stok langsung.

Acuan harga: screenshot yang diberikan pemilik pada 8 September 2026.

| Produk | Harga acuan |
| --- | ---: |
| Box 250 gram / 10 sachet | Rp85.000 |
| Pouch 500 gram | Rp150.000 |
| 2 box | Rp160.000 |
| 2 pouch | Rp255.000 |
| 5 box | Rp375.000 |
| 5 pouch | Belum tersedia |

## Angka penjualan dari Google Sheets

Tidak perlu akses edit, akun layanan, API key, atau backend. Jalur ini menggunakan satu tab publik khusus statistik, tanpa data pelanggan.

1. Buat spreadsheet terpisah dengan tab `Statistik`.
2. Isi A1:C1 dengan `jumlah`, `satuan`, `periode`.
3. Isi tepat satu baris data di A2:C2: angka penjualan nyata; satuan seperti `kemasan terjual`; periode seperti `Sejak Januari 2026`.
4. Kolom jumlah harus berupa bilangan bulat tanpa pemisah ribuan: `1250`, bukan `1.250`. Jangan menambahkan tanda `+`. Angka contoh ini tidak otomatis dipakai website.
5. Pilih **File > Bagikan > Publikasikan ke web**. Pilih hanya tab `Statistik`, format **Comma-separated values (.csv)**, lalu publikasikan.
6. Salin tautan hasil publikasi ke `STORE_CONFIG.sales.csvUrl` di `config.js`. Tautan publikasi CSV berbeda dari tautan edit/share spreadsheet biasa.
7. Biarkan publikasi ulang otomatis aktif. Perubahan Google dapat membutuhkan beberapa menit sebelum terlihat.

Setelah URL tersedia, uji koneksi langsung di browser. Jika kebijakan akun Google membatasi publikasi atau browser tidak dapat membaca URL, koneksi perlu disesuaikan; belum ada sheet asli yang dihubungkan pada checkpoint ini.

`fallback` boleh diisi objek dengan `jumlah`, `satuan`, `periode` yang sama menggunakan angka nyata yang sudah dikonfirmasi. Tanpa data valid, bagian statistik disembunyikan.

Perilaku:

- Dibaca satu kali saat halaman dibuka, memakai cache browser lima menit per URL.
- Tidak polling terus menerus. Muat ulang halaman setelah masa cache habis untuk mengambil pembaruan.
- Jika Sheets gagal: gunakan data terakhir yang valid atau fallback. Jika keduanya tidak ada, sembunyikan angka.
- Angka dihitung secara visual selama 1,3 detik, sekali saat terlihat. Pengaturan perangkat untuk mengurangi animasi dihormati.
- Statistik bukan hitungan klik WhatsApp. Penjualan berhasil direkap pemilik toko.

Panduan resmi: https://support.google.com/docs/answer/183965

## Testimoni

Bagian testimoni sudah memiliki kartu responsif: grid pada laptop dan daftar yang dapat digeser pada ponsel. Bagian ini disembunyikan selama array `testimonials` kosong.

Tambahkan hanya ulasan asli Alqarni yang mendapat izin untuk ditampilkan. Setiap entri berisi `name`, `quote`, dan opsional `productId` serta `rating` (bilangan bulat 1–5). Jika pelanggan tidak memberi bintang, hilangkan `rating`.

Referensi screenshot Etawaku digunakan untuk pola layout, bukan sumber kutipan atau rating Alqarni. Teks ulasan dan statistik selalu dimasukkan sebagai teks biasa, bukan HTML.

## Gambar dan ikon

- File sumber di `foto-produk` dipertahankan utuh.
- Website memakai WebP di `assets/images`: foto katalog lebar 800 px, hero 1200 px dan alternatif mobile 640 px, logo 400 px.
- Logo dan hero dimuat langsung. Foto katalog, keunggulan, dan testimoni memakai lazy loading serta ukuran eksplisit agar layout stabil.
- Ikon SVG lokal dari Lucide 0.468.0 berada di `assets/icons.svg`; lisensi disertakan di `assets/LUCIDE-LICENSE`. Tidak bergantung pada CDN ikon.
- Foto promosi bukan bukti komposisi atau izin edar. Gunakan label resmi yang terbaca untuk memfinalkan informasi tersebut.

## Konten yang masih menunggu pemilik

- Harga paket 5 pouch dan konfirmasi harga lainnya.
- Cakupan gratis ongkir, minimum pembelian, serta batas subsidi bila ada.
- Angka penjualan nyata, satuan/periode, dan URL publikasi Sheets.
- Testimoni asli dan izin penayangan.
- Foto label resmi: komposisi, kandungan gizi, petunjuk seduh/takaran air, izin edar, dan sertifikat halal bila ingin ditampilkan.

Aturan minum 2 kali sehari, 25 gram per gelas berasal dari instruksi pemilik; takaran air belum diberikan. Konten menggunakan bahasa pelengkap nutrisi sesuai usulan diskusi. Klaim terapi nyeri sendi/pernapasan, persentase kandungan, dan nomor izin dari template tidak diteruskan tanpa sumber resmi yang sesuai.

Deployment ditunda sesuai permintaan pemilik.

## Pemeriksaan

- `node --test tests/sales.test.cjs`: format CSV, data tidak valid, cache, gangguan jaringan, penyimpanan ditolak, dan fallback.
- `node tests/browser.cjs`: membutuhkan Playwright dan Chrome serta server lokal port 4173. Dapat memilih Edge dengan variabel `BROWSER_CHANNEL=msedge`.
- Pemeriksaan browser mencakup lebar 320, 375, 390, 768, 1024, 1366, dan 1920 px, gambar, harga dan nomor WA, keranjang termasuk harga belum diketahui, persistensi, fokus keyboard, serta fixture statistik dan testimoni.
- Screenshot uji berada di `.test-artifacts/` (diabaikan Git). Data uji disuntikkan saat pengujian saja dan tidak disimpan dalam konfigurasi toko.
- Koneksi Sheets asli baru bisa diperiksa setelah tautan CSV diberikan. Pengujian tombol WhatsApp memeriksa tautan/pesan tanpa mengirim pesan.
