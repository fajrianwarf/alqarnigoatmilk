# Alqarni Goat Milk — Katalog WhatsApp

Template katalog produk statis menggunakan HTML, CSS, dan JavaScript murni. Tidak membutuhkan instalasi package.

## Menjalankan

Buka `index.html` langsung di browser, atau gunakan VS Code Live Server.

## Pengaturan wajib

Buka `script.js`, lalu ubah:

```js
whatsappNumber: '6281234567890'
```

Gunakan format internasional tanpa karakter `+`, spasi, atau tanda hubung. Contoh nomor Indonesia `0812-3456-7890` menjadi `6281234567890`.

## Mengubah produk dan harga

Semua produk terdapat pada array `products` di `script.js`. Anda dapat mengubah:

- `name`
- `size`
- `description`
- `price`
- `stockText`
- `badge`
- `image`

## Gambar yang perlu disiapkan

### 1. Logo toko

Saat ini logo menggunakan lingkaran teks `AG`. Ganti bagian `.brand-mark` di `index.html` dengan gambar logo.

- Format: SVG atau PNG transparan
- Ukuran minimum: 400 × 400 px
- Komposisi: logo berada di tengah dan memiliki ruang kosong di sekelilingnya

### 2. Gambar hero utama

Tempatnya berada di sisi kanan bagian paling atas.

- Format: PNG transparan lebih disarankan
- Ukuran: sekitar 1200 × 1000 px
- Isi: 1 kemasan utama, 1 sachet/pouch tambahan, gelas susu, dan sedikit elemen rempah
- Sudut pengambilan: produk menghadap depan dengan pencahayaan studio lembut
- Hindari: teks promosi terlalu banyak karena headline sudah berada di sisi kiri

Untuk memasang gambar, ganti elemen `.hero-image-placeholder` pada `index.html` dengan:

```html
<img class="hero-product-image" src="assets/images/hero-product.png" alt="Produk Alqarni Goat Milk" />
```

Lalu tambahkan CSS untuk menyesuaikan ukuran.

### 3. Foto produk katalog

Sediakan satu foto untuk setiap kartu produk:

- `product-250g.jpg` — kemasan 250 gram / 10 sachet
- `product-500g.jpg` — standing pouch 500 gram
- `product-2box.jpg` — dua box dalam satu komposisi
- `product-2pouch.jpg` — dua pouch 500 gram

Rekomendasi:

- Rasio: 1:1
- Ukuran minimum: 1000 × 1000 px
- Latar: putih, krem muda, atau warna identitas merek
- Produk harus terlihat utuh dan tulisan kemasan tetap terbaca
- Gunakan gaya visual yang sama pada seluruh kartu

Setelah gambar tersedia, ubah `image` pada `script.js` menjadi, misalnya:

```js
image: 'assets/images/product-250g.jpg'
```

### 4. Foto lifestyle

Digunakan pada bagian “Mengapa memilih Alqarni?”.

- Ukuran: sekitar 900 × 1100 px
- Orientasi: portrait
- Isi: orang dewasa sedang menikmati susu hangat pada pagi atau malam hari
- Gaya: natural, bersih, dan tidak terlihat seperti foto medis
- Sisakan area kosong agar foto tidak terasa padat

## Tentang placeholder SVG

Folder `assets/images` berisi gambar SVG sederhana sebagai placeholder. Placeholder boleh langsung diganti dengan foto asli tanpa mengubah struktur halaman.

## Catatan konten dan klaim

Sebelum dipublikasikan, verifikasi kembali:

- Harga dan stok
- Nomor BPOM dan sertifikat halal
- Komposisi 80% susu kambing
- Aturan minum
- Syarat garansi
- Opsi COD
- Seluruh klaim manfaat

Hindari klaim seperti “menyembuhkan asma”, “mengobati rematik”, “tanpa efek samping”, atau “pasti aman untuk semua orang” kecuali redaksi tersebut memang tercantum pada materi resmi yang telah disetujui regulator. Produk pangan juga tidak boleh diposisikan sebagai pengganti diagnosis atau terapi medis.

## Struktur file

```text
alqarnigoatmilk-catalog/
├── index.html
├── styles.css
├── script.js
├── README.md
└── assets/
    └── images/
        ├── product-250g.svg
        ├── product-500g.svg
        ├── product-2box.svg
        └── product-2pouch.svg
```
