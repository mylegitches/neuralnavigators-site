# Neural Navigators website

Static export of the former Squarespace site, hosted on GitHub Pages.

- Pages: `index.html`, `about.html`, `services.html`, `contactus.html` (served at `/`, `/about`, `/services`, `/contactus`)
- `assets/` – CSS, images and fonts pulled down from the Squarespace CDN
- `assets/css/static-site.css`, `assets/js/static-site.js` – small shims replacing Squarespace's runtime (menu, accordions, contact form, fonts)
- `squarespace-export/` – the original page snapshots and the script that converted them

To edit content, edit the HTML pages directly and push to `main`; GitHub Pages redeploys automatically.
