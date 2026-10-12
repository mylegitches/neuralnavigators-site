const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.querySelector('.site-header');

// Mobile menu.
const toggle = document.querySelector('.menu-toggle');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('.site-header a[href^="#"]').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// Header shadow once scrolled; parallax layers drift slower than the page.
// Each layer is enlarged past its section by the furthest it can travel, so its edge never shows.
const layers = [...document.querySelectorAll('[data-parallax]')].map((img) => ({
  img, frame: img.parentElement, section: img.parentElement.parentElement, speed: parseFloat(img.dataset.parallax),
}));
function sizeLayers() {
  const vh = window.innerHeight;
  for (const layer of layers) {
    // The section's center can sit at most (vh + height) / 2 from the viewport center while visible.
    layer.max = reduceMotion ? 0 : Math.ceil(layer.speed * (vh + layer.section.offsetHeight) / 2) + 2;
    layer.frame.style.inset = `-${layer.max}px 0`;
  }
}
let ticking = false;
function onScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  if (!reduceMotion) {
    const vh = window.innerHeight;
    for (const { img, section, speed, max } of layers) {
      const box = section.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) continue;
      const offset = Math.max(-max, Math.min(max, (box.top + box.height / 2 - vh / 2) * speed));
      img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener('resize', () => { sizeLayers(); onScroll(); });
window.addEventListener('load', () => { sizeLayers(); onScroll(); });
sizeLayers();
onScroll();

// Underline the nav link for the section currently in view.
const navLinks = [...document.querySelectorAll('.site-nav a')];
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === `#${entry.target.id}`));
    }
  }
}, { rootMargin: '-40% 0px -55% 0px' });
navLinks.forEach((a) => {
  const section = document.querySelector(a.hash);
  if (section) spy.observe(section);
});

// Reveal elements as they scroll into view.
const revealer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealer.unobserve(entry.target);
    }
  }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

// Service category tabs.
const tabs = [...document.querySelectorAll('.tab')];
function selectTab(tab, focus) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute('aria-selected', selected);
    t.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !selected;
    if (selected) panel.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) selectTab(tabs[(i + step + tabs.length) % tabs.length], true);
  });
});
if (tabs.length) {
  const first = tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0];
  tabs.forEach((t) => { document.getElementById(t.getAttribute('aria-controls')).hidden = t !== first; });
}

// Contact form: submitted to Formspree in the background so the visitor stays on the page.
const form = document.querySelector('.contact-form');
if (form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get('subject')) data.set('_subject', `${data.get('subject')} (neuralnavigators.com)`);
    button.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.classList.add('is-success');
      status.textContent = 'Thanks! Your message was sent. We’ll respond within 12 business hours.';
    } catch {
      status.classList.add('is-error');
      status.textContent = 'Sorry, something went wrong. Please email sales@neuralnavigators.com directly.';
    } finally {
      button.disabled = false;
    }
  });
}
