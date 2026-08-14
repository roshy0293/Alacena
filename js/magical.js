/* ══════════════════════════════════════════
   MAGICAL.JS — Interactividad de magical.html
   JS nativo ES6+ · Sin dependencias
══════════════════════════════════════════ */
(function(){
'use strict';
var menosMov = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Navbar: estado al scroll ── */
var nav = document.getElementById('nav');
window.addEventListener('scroll', function(){
  nav.classList.toggle('is-scrolled', window.scrollY > 30);
}, {passive:true});

/* ── Menú móvil ── */
var burger = document.getElementById('burger');
var menu = document.getElementById('menu');
burger.addEventListener('click', function(){
  var abierto = menu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', abierto);
});
menu.addEventListener('click', function(e){
  if (e.target.tagName === 'A') { menu.classList.remove('is-open'); burger.setAttribute('aria-expanded','false'); }
});

/* ── Reveal on scroll ── */
var reveals = document.querySelectorAll('.reveal');
if (menosMov) {
  reveals.forEach(function(el){ el.classList.add('is-visible'); });
} else {
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if (en.isIntersecting){ en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, {threshold:.15});
  reveals.forEach(function(el){ io.observe(el); });
}

/* ── Contadores animados ── */
function animarContador(el){
  var target = parseInt(el.dataset.target, 10);
  var sufijo = el.dataset.suffix || '';
  if (menosMov) { el.textContent = target + sufijo; return; }
  var dur = 1400, inicio = null;
  function paso(t){
    if (!inicio) inicio = t;
    var p = Math.min((t - inicio) / dur, 1);
    el.textContent = Math.floor(p * target) + sufijo;
    if (p < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}
var ioNum = new IntersectionObserver(function(entries){
  entries.forEach(function(en){
    if (en.isIntersecting){ animarContador(en.target); ioNum.unobserve(en.target); }
  });
}, {threshold:.5});
document.querySelectorAll('[data-target]').forEach(function(el){ ioNum.observe(el); });

/* ── Demo interactiva de recetas ── */
var RECETAS = [
  {n:'Frittata de la nevera', e:'🍳', ing:['huevos','tomate','queso','espinacas'], t:'25 min', d:'Fácil', tag:'Keto'},
  {n:'Tortilla española express', e:'🍳', ing:['huevos','cebolla','aceite'], t:'20 min', d:'Fácil', tag:'Tradicional'},
  {n:'Revuelto de espinacas', e:'🥬', ing:['huevos','espinacas','ajo'], t:'12 min', d:'Fácil', tag:'Keto'},
  {n:'Ensalada mediterránea', e:'🥗', ing:['tomate','queso','aceite','cebolla'], t:'10 min', d:'Fácil', tag:'Vegetariana'},
  {n:'Pasta al ajo y tomate', e:'🍝', ing:['pasta','ajo','tomate','aceite'], t:'15 min', d:'Fácil', tag:'Vegana'},
  {n:'Tomates aliñados', e:'🍅', ing:['tomate','ajo','aceite'], t:'5 min', d:'Fácil', tag:'Vegana'}
];
var NOMBRES = {huevos:'🥚 Huevos', tomate:'🍅 Tomate', queso:'🧀 Queso', ajo:'🧄 Ajo', cebolla:'🧅 Cebolla', espinacas:'🥬 Espinacas', pasta:'🍝 Pasta', aceite:'🫒 Aceite'};
var chips = document.querySelectorAll('#demo-chips .chip');
var resultado = document.getElementById('demo-result');
var ultimaReceta = null;

function seleccionados(){
  return Array.prototype.filter.call(chips, function(c){ return c.classList.contains('is-selected'); })
    .map(function(c){ return c.dataset.ing; });
}
function mejorReceta(sel){
  var mejor = null, mejorScore = 0;
  RECETAS.forEach(function(r){
    var coin = r.ing.filter(function(i){ return sel.indexOf(i) !== -1; }).length;
    var score = coin / r.ing.length;
    if (coin > 0 && score > mejorScore) { mejorScore = score; mejor = r; }
  });
  return mejor ? {r:mejor, pct:Math.round(mejorScore*100)} : null;
}
function pintarResultado(){
  var m = mejorReceta(seleccionados());
  ultimaReceta = m;
  if (!m){
    resultado.innerHTML = '<div class="demo-placeholder"><span class="big">🤔</span>Añade algún ingrediente más<br>y volvemos a intentarlo.</div>';
    return;
  }
  resultado.innerHTML =
    '<div class="result-card">' +
      '<div class="result-match">✨ ' + m.pct + '% match</div>' +
      '<div class="result-img">' + m.r.e + '</div>' +
      '<div class="result-body">' +
        '<h3>' + m.r.n + '</h3>' +
        '<div class="result-meta"><span>⏱ ' + m.r.t + '</span><span>🔥 ' + m.r.d + '</span><span>🍽 ' + m.r.tag + '</span></div>' +
        '<div class="result-ing">' + m.r.ing.map(function(i){ return '<span>' + NOMBRES[i] + '</span>'; }).join('') + '</div>' +
      '</div>' +
    '</div>';
}
chips.forEach(function(c){
  c.addEventListener('click', function(){
    var on = c.classList.toggle('is-selected');
    c.setAttribute('aria-pressed', on);
    pintarResultado();
  });
});

/* ── Confeti ── */
function confeti(){
  if (menosMov) return;
  var colores = ['#459b5b','#eacc34','#e28538','#22c55e','#fbbf24'];
  for (var i = 0; i < 70; i++){
    var p = document.createElement('span');
    p.className = 'confetti';
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colores[i % colores.length];
    p.style.animationDelay = (Math.random()*.4) + 's';
    document.body.appendChild(p);
    setTimeout(function(el){ return function(){ el.remove(); }; }(p), 2800);
  }
}
document.getElementById('btn-magia').addEventListener('click', function(){
  pintarResultado();
  if (ultimaReceta) confeti();
});
pintarResultado();

/* ── Formulario final ── */
document.getElementById('cta-form').addEventListener('submit', function(e){
  e.preventDefault();
  var email = document.getElementById('email').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    document.getElementById('email').focus();
    return;
  }
  this.outerHTML = '<p class="cta-success">✨ ¡Magia hecha! Te avisaremos en cuanto Alacena Mágica esté lista.</p>';
  confeti();
});
})();
