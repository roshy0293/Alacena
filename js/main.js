/* ══════════════════════════════════════════════════════════════
   ALACENA MÁGICA · main.js
   JS nativo ES6+, sin dependencias. Módulos por funcionalidad:

    1. Utilidades compartidas (reduced-motion, throttle)
    2. Menú móvil (hamburguesa, accesible)
    3. Estado de la navbar al hacer scroll
    4. Enlace activo según sección visible (scroll-spy)
    5. Reveal on-scroll (IntersectionObserver)
    6. Contadores animados
    7. Destellos flotantes de fondo
    8. Rastro de destellos que sigue al cursor
    9. Parallax suave en el hero
   10. Pasos de "cómo funciona" que se iluminan
   11. EL TRUCO · demo interactiva de recetas
   12. Mockup: contar ingredientes seleccionados
   13. Mockup: filtros de dieta
   14. Formulario de lista de espera
   ════════════════════════════════════════════════════════════ */
'use strict';

/* ── 1. UTILIDADES ──────────────────────────────── */

// Respetamos la preferencia del sistema: sin animaciones decorativas.
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Limita la frecuencia de ejecución usando el ciclo de pintado del navegador.
const rafThrottle = (fn) => {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fn(...args); ticking = false; });
  };
};

document.addEventListener('DOMContentLoaded', () => {

  /* ── 2. MENÚ MÓVIL ─────────────────────────────── */
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

    // Cerrar al pulsar un enlace del menú
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    // Cerrar con Escape y devolver el foco al botón
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset al volver a escritorio
    window.matchMedia('(min-width: 1081px)')
      .addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  })();

  /* ── 3. NAVBAR AL HACER SCROLL ─────────────────── */
  (function navbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    // A partir de ~70vh la barra deja el hero y necesita fondo sólido.
    const onScroll = rafThrottle(() => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ── 4. SCROLL-SPY ─────────────────────────────── */
  (function scrollSpy() {
    const links = Array.from(document.querySelectorAll('.navbar__links a'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute('href');
      const section = id && document.querySelector(id);
      if (section) map.set(section, link);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove('is-active'));
        const active = map.get(entry.target);
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, section) => observer.observe(section));
  })();

  /* ── 5. REVEAL ON-SCROLL ───────────────────────── */
  (function revealOnScroll() {
    // Soporta tanto .reveal (clásico) como .reveal-up (nuevo para hero mágico)
    const items = document.querySelectorAll('.reveal, .reveal-up');
    if (!items.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('active', 'is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('active', 'is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach((el) => observer.observe(el));
  })();

  /* ── 6. CONTADORES ANIMADOS ────────────────────── */
  (function animatedCounters() {
    // Sirve tanto para las stats grandes como para los ahorros del bento.
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    const reduced = prefersReducedMotion();

    const run = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = target + suffix; return; }

      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach((el) => observer.observe(el));
  })();

  /* ── 7. DESTELLOS FLOTANTES ────────────────────── */
  (function backgroundSparkles() {
    if (prefersReducedMotion()) return;

    document.querySelectorAll('.sparkle-layer').forEach((layer) => {
      const count = parseInt(layer.dataset.sparkles, 10) || 20;
      const frag = document.createDocumentFragment();

      for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'sparkle';
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.setProperty('--s', `${4 + Math.random() * 12}px`);
        s.style.setProperty('--dur', `${3.5 + Math.random() * 5}s`);
        s.style.setProperty('--delay', `${Math.random() * 6}s`);
        s.style.setProperty('--peak', (0.45 + Math.random() * 0.5).toFixed(2));
        // Uno de cada cuatro destellos en terracota, para romper el dorado.
        if (i % 4 === 0) s.style.color = 'var(--terracota)';
        frag.appendChild(s);
      }
      layer.appendChild(frag);
    });
  })();

  /* ── 8. RASTRO DE DESTELLOS EN EL CURSOR ───────── */
  (function cursorSparkles() {
    // Solo con ratón real y sin reduced-motion: en táctil sobra.
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let last = 0;
    document.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 90) return; // ~11 destellos por segundo como máximo
      last = now;

      const spark = document.createElement('span');
      spark.className = 'cursor-spark';
      spark.style.left = `${e.clientX + (Math.random() * 16 - 8)}px`;
      spark.style.top = `${e.clientY + (Math.random() * 16 - 8)}px`;
      if (Math.random() > 0.65) spark.style.color = 'var(--terracota)';
      document.body.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove());
    }, { passive: true });
  })();

  /* ── 9. PARALLAX DEL HERO ──────────────────────── */
  (function heroParallax() {
    if (prefersReducedMotion()) return;

    const items = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;

    const onScroll = rafThrottle(() => {
      const y = window.scrollY;
      if (y > window.innerHeight * 1.2) return; // fuera de pantalla, no calculamos
      items.forEach((el) => {
        const depth = parseFloat(el.dataset.parallax) || 0;
        el.style.transform = `translate3d(0, ${(y * depth).toFixed(1)}px, 0)`;
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ── 10. PASOS QUE SE ILUMINAN ─────────────────── */
  (function activeSteps() {
    const steps = document.querySelectorAll('#steps .step');
    if (!steps.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-42% 0px -42% 0px' });

    steps.forEach((s) => observer.observe(s));
  })();

  /* ══════════════════════════════════════════════
     11. EL TRUCO · demo interactiva de recetas
     El usuario marca lo que tiene y calculamos qué
     receta encaja mejor. Todo en cliente, sin API.
  ═══════════════════════════════════════════════ */
  (function magicTrick() {
    const picker = document.getElementById('pantryPicker');
    const card = document.getElementById('spellCard');
    const more = document.getElementById('trickMore');
    if (!picker || !card) return;

    /* Despensa disponible en la demo */
    const INGREDIENTES = [
      { id: 'huevos',    emoji: '🥚', nombre: 'Huevos'    },
      { id: 'tomate',    emoji: '🍅', nombre: 'Tomate'    },
      { id: 'queso',     emoji: '🧀', nombre: 'Queso'     },
      { id: 'cebolla',   emoji: '🧅', nombre: 'Cebolla'   },
      { id: 'pimiento',  emoji: '🫑', nombre: 'Pimiento'  },
      { id: 'espinacas', emoji: '🥬', nombre: 'Espinacas' },
      { id: 'ajo',       emoji: '🧄', nombre: 'Ajo'       },
      { id: 'aceite',    emoji: '🫒', nombre: 'Aceite'    },
      { id: 'nata',      emoji: '🥛', nombre: 'Nata'      },
      { id: 'pasta',     emoji: '🍝', nombre: 'Pasta'     },
      { id: 'arroz',     emoji: '🍚', nombre: 'Arroz'     },
      { id: 'pollo',     emoji: '🍗', nombre: 'Pollo'     }
    ];

    /* Recetario de la demo.
       `foto` solo en las que tenemos imagen real; el resto usa un degradado. */
    const RECETAS = [
      {
        nombre: 'Frittata de la nevera',
        tiempo: '25 min', dificultad: 'Fácil', dieta: 'Keto',
        ingredientes: ['huevos', 'tomate', 'queso', 'cebolla', 'pimiento'],
        foto: 'assets/images/3 - Alacena Magica.png',
        alt: 'Frittata dorada en sartén de hierro con tomates cherry, pimiento y cebollino'
      },
      {
        nombre: 'Tortilla española express',
        tiempo: '20 min', dificultad: 'Fácil', dieta: 'Tradicional',
        ingredientes: ['huevos', 'cebolla', 'aceite'],
        gradiente: 'linear-gradient(135deg, #eacc34, #e28538)', icono: '🍳'
      },
      {
        nombre: 'Ensalada mediterránea',
        tiempo: '10 min', dificultad: 'Muy fácil', dieta: 'Vegetariana',
        ingredientes: ['tomate', 'queso', 'aceite', 'cebolla', 'espinacas'],
        gradiente: 'linear-gradient(135deg, #6bb87f, #459b5b)', icono: '🥗'
      },
      {
        nombre: 'Pasta al ajo y tomate',
        tiempo: '18 min', dificultad: 'Fácil', dieta: 'Vegana',
        ingredientes: ['pasta', 'ajo', 'tomate', 'aceite'],
        gradiente: 'linear-gradient(135deg, #e28538, #d05f2a)', icono: '🍝'
      },
      {
        nombre: 'Arroz cremoso de espinacas',
        tiempo: '30 min', dificultad: 'Media', dieta: 'Vegetariana',
        ingredientes: ['arroz', 'espinacas', 'nata', 'ajo', 'queso'],
        gradiente: 'linear-gradient(135deg, #8fd0a1, #2f7a44)', icono: '🍚'
      },
      {
        nombre: 'Pollo al horno con verduras',
        tiempo: '45 min', dificultad: 'Fácil', dieta: 'Paleo',
        ingredientes: ['pollo', 'pimiento', 'cebolla', 'ajo', 'aceite'],
        gradiente: 'linear-gradient(135deg, #e2a838, #b9611f)', icono: '🍗'
      }
    ];

    // Lo que "hay en la nevera" al cargar: da un 100% de primeras.
    const seleccion = new Set(['huevos', 'tomate', 'queso', 'cebolla', 'pimiento']);

    /* Pinta los botones de la despensa */
    const renderPicker = () => {
      picker.innerHTML = INGREDIENTES.map((ing) => `
        <button
          class="pantry-picker__btn"
          type="button"
          data-id="${ing.id}"
          aria-pressed="${seleccion.has(ing.id)}"
        >
          <span aria-hidden="true">${ing.emoji}</span> ${ing.nombre}
        </button>
      `).join('');
    };

    /* Porcentaje de coincidencia = ingredientes que tienes / los que pide */
    const calcularMatch = (receta) => {
      const tiene = receta.ingredientes.filter((i) => seleccion.has(i));
      return {
        ...receta,
        tiene,
        faltan: receta.ingredientes.filter((i) => !seleccion.has(i)),
        match: Math.round((tiene.length / receta.ingredientes.length) * 100)
      };
    };

    const nombreDe = (id) => {
      const ing = INGREDIENTES.find((i) => i.id === id);
      return ing ? `${ing.emoji} ${ing.nombre}` : id;
    };

    /* Pinta la receta ganadora */
    const renderResultado = () => {
      // Sin ingredientes no hay magia: estado vacío con microcopy de marca.
      if (seleccion.size === 0) {
        card.innerHTML = `
          <div class="spell-card__empty">
            <span class="spark" aria-hidden="true">🪄</span>
            <p>Tu nevera está vacía... o eso parece.<br />Toca algún ingrediente y vemos qué sale.</p>
          </div>`;
        if (more) more.textContent = '';
        return;
      }

      const ranking = RECETAS
        .map(calcularMatch)
        // Priorizamos coincidencia, y a igualdad, la receta más completa.
        .sort((a, b) => b.match - a.match || b.tiene.length - a.tiene.length);

      const top = ranking[0];

      // Ninguna receta usa nada de lo marcado.
      if (top.match === 0) {
        card.innerHTML = `
          <div class="spell-card__empty">
            <span class="spark" aria-hidden="true">🤔</span>
            <p>Con eso solo... se nos resiste.<br />Añade algo más y lo volvemos a intentar.</p>
          </div>`;
        if (more) more.textContent = '';
        return;
      }

      const media = top.foto
        ? `<img src="${top.foto}" alt="${top.alt}" width="1024" height="1024" loading="lazy" />`
        : `<div style="width:100%;height:100%;display:grid;place-items:center;font-size:4.5rem;background:${top.gradiente}">${top.icono}</div>`;

      const usa = top.tiene.map((i) =>
        `<span class="spell-card__use">${nombreDe(i)}</span>`).join('');
      const falta = top.faltan.map((i) =>
        `<span class="spell-card__use spell-card__use--missing">${nombreDe(i)}</span>`).join('');

      card.innerHTML = `
        <div class="spell-card__media">
          ${media}
          <span class="spell-card__match">✨ ${top.match}% match</span>
        </div>
        <div class="spell-card__body">
          <h3 class="spell-card__name">${top.nombre}</h3>
          <div class="spell-card__meta">
            <span>⏱ ${top.tiempo}</span>
            <span>🔥 ${top.dificultad}</span>
            <span>🍽 ${top.dieta}</span>
          </div>
          <div class="spell-card__uses">${usa}${falta}</div>
        </div>`;

      // Pequeño rebote: la receta "se conjura".
      if (!prefersReducedMotion()) {
        card.classList.remove('is-casting');
        void card.offsetWidth; // fuerza reinicio de la animación
        card.classList.add('is-casting');
      }

      // Cuántas más podría cocinar con lo mismo
      if (more) {
        const otras = ranking.filter((r) => r !== top && r.match >= 50).length;
        more.innerHTML = otras
          ? `Y hay <strong>${otras} receta${otras > 1 ? 's' : ''} más</strong> esperándote con estos ingredientes.`
          : 'Añade un ingrediente más y se abren nuevas recetas.';
      }
    };

    /* Alternar ingrediente */
    picker.addEventListener('click', (e) => {
      const btn = e.target.closest('.pantry-picker__btn');
      if (!btn) return;

      const id = btn.dataset.id;
      if (seleccion.has(id)) seleccion.delete(id);
      else seleccion.add(id);

      btn.setAttribute('aria-pressed', String(seleccion.has(id)));
      renderResultado();
    });

    renderPicker();
    renderResultado();
  })();

  /* ── 12. MOCKUP: contar ingredientes ───────────── */
  (function ingredientPicker() {
    const grid = document.getElementById('ingredientGrid');
    const counter = document.getElementById('ingredientCount');
    if (!grid || !counter) return;

    const update = () => {
      counter.textContent = grid.querySelectorAll('.ingredient.is-selected').length;
    };

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.ingredient');
      if (!btn) return;
      btn.classList.toggle('is-selected');
      btn.setAttribute('aria-pressed', String(btn.classList.contains('is-selected')));
      update();
    });

    update();
  })();

  /* ── 13. MOCKUP: filtros de dieta ──────────────── */
  (function dietFilters() {
    const filterBar = document.getElementById('dietFilters');
    const list = document.getElementById('recipeList');
    if (!filterBar || !list) return;

    const rows = Array.from(list.querySelectorAll('.recipe-row'));

    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.diet-chip');
      if (!chip) return;

      filterBar.querySelectorAll('.diet-chip').forEach((c) => {
        const active = c === chip;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-selected', String(active));
      });

      const diet = chip.dataset.diet;
      rows.forEach((row) => {
        const diets = (row.dataset.diets || '').split(' ');
        row.classList.toggle('is-hidden', !(diet === 'todas' || diets.includes(diet)));
      });
    });
  })();

  /* ── 14. AÑO DEL COPYRIGHT ─────────────────────── */
  (function currentYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  })();

  /* ── 15. FORMULARIO LISTA DE ESPERA ────────────── */
  (function waitlist() {
    const form = document.getElementById('waitlistForm');
    const input = document.getElementById('email');
    const note = document.getElementById('formNote');
    if (!form || !input || !note) return;

    const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!isValidEmail(input.value)) {
        input.classList.add('is-invalid');
        input.focus();
        note.textContent = 'Ups, revisa tu email y volvemos a intentarlo 🙂';
        note.classList.remove('is-success');
        return;
      }

      input.classList.remove('is-invalid');
      // Demo sin backend: confirmamos con microcopy de marca.
      note.textContent = '¡Genial! Te avisaremos en cuanto haya magia disponible ✨';
      note.classList.add('is-success');
      form.reset();
    });

    input.addEventListener('input', () => input.classList.remove('is-invalid'));
  })();

});
