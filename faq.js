// Animasi memakai details/summary asli agar tetap berfungsi tanpa JavaScript.
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary = details.querySelector('summary');
  const answer = details.querySelector('.faq-answer');
  if (!summary || !answer) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;
  let targetOpen = details.open;
  function finish() {
    details.open = targetOpen;
    answer.inert = !targetOpen;
    answer.style.height = '';
    answer.style.opacity = '';
    const current = animation;
    animation = null;
    if (current) { current.onfinish = null; current.cancel(); }
  }
  summary.addEventListener('click', event => {
    event.preventDefault();
    const height = details.open ? answer.getBoundingClientRect().height : 0;
    const opacity = details.open ? Number(getComputedStyle(answer).opacity) : 0;
    targetOpen = !targetOpen;
    if (targetOpen) window.trackAnalyticsEvent?.('faq_open', { question: summary.textContent.trim() });
    if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
    if (reducedMotion.matches || typeof answer.animate !== 'function') { finish(); return; }
    details.open = true;
    answer.inert = !targetOpen;
    animation = answer.animate([
      { height: height + 'px', opacity },
      { height: (targetOpen ? answer.scrollHeight : 0) + 'px', opacity: targetOpen ? 1 : 0 },
    ], { duration: 230, easing: 'cubic-bezier(.2, 0, .2, 1)', fill: 'forwards' });
    animation.onfinish = finish;
  });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finish(); });
});
