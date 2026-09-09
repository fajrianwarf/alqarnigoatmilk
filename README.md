# Alqarni Goat Milk

Katalog statis HTML, CSS, dan JavaScript. Data toko dibaca langsung dari Google Sheets publik saat halaman dibuka atau dimuat ulang.

## Sumber data

Alamat publikasi dan ID tab berada di `config.js`. Tidak ada daftar produk, harga, nomor WhatsApp, gambar katalog, maupun angka penjualan cadangan di kode. Tidak ada cache data toko di localStorage. Google dapat membutuhkan beberapa menit untuk memperbarui hasil publikasinya.

### Tab list-harga

Kolom wajib: `produk`, `jenis`, `satuan`, `harga`, `deskripsi`, `gambar`.

- `produk`: nama produk.
- `jenis`: label pada kartu produk.
- `satuan`: ukuran atau isi paket.
- `harga`: rupiah bulat, mendukung angka biasa atau format mata uang dengan pemisah ribuan titik/koma. Kosong menampilkan “Tanya harga”.
- `deskripsi`: deskripsi produk.
- `gambar`: URL HTTPS gambar. Tautan berbagi file Google Drive diterjemahkan menjadi URL thumbnail. File harus dapat dibaca publik. Jika gambar gagal dimuat, ditampilkan “Foto belum tersedia”, bukan foto cadangan lokal.
- `id` (opsional): ID unik yang tetap. Tanpa kolom ini, identitas keranjang berasal dari nama + satuan; perubahan nama/satuan membuat item lama tidak lagi cocok. Perubahan urutan baris tidak memengaruhi kecocokan.

Tambah atau hapus baris untuk mengubah katalog. Semua nilai dari Sheets dirender sebagai teks biasa, bukan HTML.

### Tab terjual

Dua baris pasangan nama pengaturan dan nilai:

- Kolom A: `banyak terjual`; kolom B: jumlah bulat tanpa pemisah ribuan.
- Kolom A: `nomor whatsapp`; kolom B: nomor WhatsApp internasional. Format +62 atau nomor lokal diawali 0 juga dinormalisasi.

Jumlah terjual dianimasikan dari 0 ke nilai sumber selama 1,3 detik, sekali ketika terlihat. Perangkat dengan preferensi mengurangi animasi langsung menampilkan nilai akhir.

Nomor WhatsApp digunakan oleh semua tombol pemesanan, pertanyaan admin, cek ongkir, keranjang, dan tautan kontak footer.

## Saat sumber tidak tersedia

Website membatasi waktu permintaan Sheets menjadi 10 detik dan mencoba ulang satu kali untuk gangguan jaringan/server. Akses ditolak tidak diulang otomatis. Jika tetap gagal, tersedia pesan dan tombol coba lagi. Jika nomor kontak belum tersedia, pemesanan dinonaktifkan. Tidak ada harga atau nomor lama yang digunakan sebagai cadangan. Keranjang pilihan pengguna tetap disimpan terpisah; harga dihitung dari katalog yang berhasil dimuat pada kunjungan berikutnya.

Kegagalan testimoni tidak mematikan katalog/WhatsApp. Angka penjualan dan nomor WhatsApp divalidasi terpisah. Baris produk dengan nama/harga/ID tidak valid dilewati dengan pemberitahuan, sementara produk valid tetap tampil. Gambar tidak valid menampilkan keterangan pengganti tanpa menghapus produknya. Detail diagnostik tersedia di konsol browser.

`errors.js` menangani error JavaScript yang tidak tertangkap, promise gagal, serta file script gagal dimuat dengan pesan pemulihan dan tombol muat ulang. Ini bukan jaminan mencegah semua bug; masalah yang tetap terjadi setelah muat ulang perlu diperbaiki dari penyebabnya.

## Tab testimoni

Tab publik `testimoni` memakai kolom `nama`, `ulasan`, `produk`, `rating`. Rating boleh kosong atau bilangan bulat 1–5. Kolom `produk` dicocokkan dengan nama produk katalog untuk menampilkan gambar. Jika tidak cocok atau katalog gagal, ulasan tetap tampil dengan nama produk sebagai teks.

Kolom opsional `tampilkan`: bila kolom ini ada, hanya baris bernilai `ya` yang tampil. Bila kolom tidak ada, seluruh baris valid tampil sesuai struktur sheet saat ini. Kolom opsional `sumber` ditampilkan sebagai keterangan asal ulasan. Teks ulasan dimasukkan sebagai teks biasa, bukan HTML. Ulasan yang tidak valid dilewati dan diberi pemberitahuan; daftar kosong disembunyikan. Tombol muat ulang ulasan hanya mengambil tab testimoni.

## Aset dan konten halaman

Gambar katalog dan gambar produk pada bagian keunggulan memakai URL dari Sheets. Gambar keunggulan mengikuti produk pertama pada daftar. Foto produk lokal tidak lagi dipakai katalog.

Logo, favicon, dan foto hero masih lokal karena sumber untuk ketiganya belum tersedia di Sheets. Teks hero, keunggulan, FAQ, promo ongkir, serta label antarmuka masih berada di `index.html`/`script.js`. Sheets saat ini baru menyediakan data katalog, penjualan, dan nomor kontak.

Ikon SVG lokal menggunakan Lucide; lisensi berada di `assets/LUCIDE-LICENSE`. Gambar di bawah layar pertama memakai lazy loading. Testimoni tampil sebagai grid pada laptop dan kartu yang dapat digeser di ponsel.

## Pratinjau

Jalankan `python -m http.server 4173 --bind 127.0.0.1`, lalu buka http://127.0.0.1:4173. Live Server juga dapat digunakan. Gunakan HTTP lokal agar pembacaan Sheets dan SVG bekerja seperti saat hosting.

Tidak diperlukan package tambahan untuk menjalankan website. Tidak ada perubahan deployment pada pekerjaan ini.

## Pemeriksaan seperlunya

`node --test tests/data.test.cjs` menjalankan lima pengujian terarah tanpa package tambahan: CSV dengan kutipan, baris produk/gambar tidak valid, penjualan dan kontak terpisah, filter/rating testimoni, serta retry jaringan dan akses ditolak. Pemeriksaan browser langsung mencakup pemuatan empat ulasan, kegagalan akses tab testimoni tanpa mematikan katalog/kontak, dan pemulihan melalui tombol coba lagi.
