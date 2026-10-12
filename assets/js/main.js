// Mobile menu.
const toggle = document.querySelector('.menu-toggle');
toggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

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
