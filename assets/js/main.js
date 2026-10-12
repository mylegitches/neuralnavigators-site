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
const layers = [...document.querySelectorAll('[data-parallax]')];
let ticking = false;
function onScroll() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  if (!reduceMotion) {
    const vh = window.innerHeight;
    for (const img of layers) {
      const box = img.parentElement.getBoundingClientRect();
      if (box.bottom < 0 || box.top > vh) continue;
      const offset = (box.top + box.height / 2 - vh / 2) * parseFloat(img.dataset.parallax);
      img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    }
  }
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener('resize', onScroll);
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

// Contact form: static hosting has no backend, so hand the message to the visitor's mail app.
const form = document.querySelector('.contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const body = `${f.message.value}\n\n${f.name.value}\n${f.email.value}`;
    location.href = `mailto:${form.dataset.to}` +
      `?subject=${encodeURIComponent(f.subject.value || 'Website inquiry')}` +
      `&body=${encodeURIComponent(body)}`;
  });
}
