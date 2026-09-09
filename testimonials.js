function renderTestimonials(reviews) {
  const grid = document.getElementById('testimonialGrid');
  grid.replaceChildren();
  document.getElementById('testimonialStatus').hidden = true;
  document.getElementById('testimoni').hidden = !reviews.length;
  for (const review of reviews) {
    const card = document.createElement('article');
    card.className = 'testimonial-card';
    card.innerHTML = '<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#quote" /></svg>';
    if (review.rating !== null) {
      const rating = document.createElement('div');
      rating.className = 'testimonial-rating';
      rating.setAttribute('aria-label', review.rating + ' dari 5 bintang');
      rating.textContent = '★'.repeat(review.rating);
      card.append(rating);
    }
    const quote = document.createElement('blockquote'); quote.textContent = review.quote;
    const name = document.createElement('cite'); name.textContent = review.name;
    card.append(quote, name);
    if (review.source) {
      const source = document.createElement('small'); source.className = 'testimonial-source';
      source.textContent = review.source; card.append(source);
    }
    const product = products.find(item => item.name.toLowerCase() === review.product.toLowerCase());
    if (product) {
      const detail = document.createElement('a'); detail.className = 'testimonial-product'; detail.href = '#produk';
      const wrap = document.createElement('span'); wrap.className = 'testimonial-image';
      const image = document.createElement('img'); image.width = 64; image.height = 64;
      image.loading = 'lazy'; image.decoding = 'async'; wrap.append(image);
      configureProductImage(image, product);
      const label = document.createElement('span'); label.textContent = product.name + ' · ' + product.size;
      detail.append(wrap, label); card.append(detail);
    } else if (review.product) {
      const label = document.createElement('p'); label.className = 'testimonial-product';
      label.textContent = review.product; card.append(label);
    }
    grid.append(card);
  }
}
async function reloadTestimonials() {
  const button = document.getElementById('retryTestimonials');
  const status = document.getElementById('testimonialStatus');
  button.disabled = true; status.hidden = false; status.textContent = 'Memuat ulasan…';
  try {
    const result = readTestimonials(await fetchSheet(SHEET_SOURCE.testimonialsTab));
    renderTestimonials(result.items);
    button.hidden = !result.issues.length;
    if (result.issues.length) {
      console.warn('Data testimoni:', result.issues);
      status.textContent = 'Sebagian ulasan belum dapat ditampilkan.'; status.hidden = false;
      document.getElementById('testimoni').hidden = false;
    }
  } catch (error) {
    console.error('Memuat ulang testimoni:', error);
    status.textContent = 'Ulasan belum dapat dimuat. Silakan coba lagi.'; button.hidden = false;
  } finally { button.disabled = false; }
}
