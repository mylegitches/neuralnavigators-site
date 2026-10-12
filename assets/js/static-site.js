// Minimal replacements for the Squarespace runtime behaviours these pages rely on.
(function () {
  // Mobile hamburger menu.
  document.querySelectorAll('.header-burger-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = document.body.classList.toggle('header--menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.querySelectorAll('.header-menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('header--menu-open');
    });
  });

  // Contact form: no backend on static hosting, so hand the message to the visitor's mail app.
  document.querySelectorAll('form.static-contact-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var body = f.message.value + '\n\n' + f.name.value + '\n' + f.email.value;
      window.location.href = 'mailto:' + form.dataset.mailto +
        '?subject=' + encodeURIComponent(f.subject.value || 'Website inquiry') +
        '&body=' + encodeURIComponent(body);
    });
  });

  // Accordions.
  document.querySelectorAll('.accordion-item__click-target').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.classList.toggle('accordion-item__dropdown--open', open);
    });
  });
})();
