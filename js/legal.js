/* ══════════════════════════════════════════════════════════════
   ALACENA MÁGICA · legal.js
   Sólo para las páginas de contenido largo (privacidad, términos,
   soporte). Ligero a propósito: no carga nada del landing.

   1. Índice lateral generado desde los <h2> del contenido
   2. Resaltado de la sección visible al hacer scroll
   3. Menú móvil (mismo comportamiento que en la portada)
   4. Año del copyright
   ════════════════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1 + 2. ÍNDICE AUTOMÁTICO ──────────────────── */
  (function tableOfContents() {
    const body = document.getElementById('legalBody');
    const list = document.getElementById('tocList');
    if (!body || !list) return;

    const headings = Array.from(body.querySelectorAll('h2'));
    if (!headings.length) {
      // Sin secciones no hay índice que mostrar: ocultamos el bloque entero.
      const toc = document.getElementById('legalToc');
      if (toc) toc.hidden = true;
      return;
    }

    // Convierte "Datos que recogemos" -> "datos-que-recogemos"
    const slugify = (s) => s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');

    // Partimos de cero: si el script llegara a ejecutarse dos veces
    // (recarga parcial, doble inclusión), el índice no se duplica.
    list.innerHTML = '';
    const frag = document.createDocumentFragment();

    headings.forEach((h, i) => {
      // Respetamos un id existente; si no, lo derivamos del texto.
      if (!h.id) h.id = slugify(h.textContent) || `seccion-${i + 1}`;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.textContent;
      li.appendChild(a);
      frag.appendChild(li);
    });

    list.appendChild(frag);

    // Resaltar la sección visible
    if (!('IntersectionObserver' in window)) return;
    const links = new Map(headings.map((h) => [h, list.querySelector(`a[href="#${CSS.escape(h.id)}"]`)]));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l && l.classList.remove('is-active'));
        const active = links.get(entry.target);
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-15% 0px -70% 0px' });

    headings.forEach((h) => observer.observe(h));
  })();

  /* ── 3. MENÚ MÓVIL ─────────────────────────────── */
  (function mobileMenu() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  })();

  /* ── 4. AÑO DEL COPYRIGHT ──────────────────────── */
  (function currentYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  })();

});
