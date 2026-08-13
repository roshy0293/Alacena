---
name: frontend-design
description: Checklist de diseño frontend para las hojas de estilo de este repo (css/styles.css, css/minimal.css, css/legal.css) — contraste, foco visible, trampas de especificidad, microinteracciones y verificación responsive. Úsala cuando toques colores, estados hover/focus/active, animaciones, o cuando revises un PR que cambie CSS.
---

# Diseño frontend · Alacena Mágica

Checklist nacido de bugs reales encontrados en este repo, no de teoría general. Cada regla cita el caso que la motivó para que quede claro que no es dogma.

## 1. Contraste: medir siempre, nunca asumir

**No des por bueno un color de marca como texto o borde sin calcular su ratio contra el fondo exacto donde va a caer.** Los tokens de marca de `styles.css` (`--verde-marca` `#459b5b`, `--terracota` `#e28538`) están pensados para superficies grandes, no para texto pequeño ni contornos:

| Color | Sobre | Ratio | AA (4.5:1 texto / 3:1 UI) |
|---|---|---|---|
| `#459b5b` | blanco | 3.45:1 | ❌ |
| `#e28538` | blanco | 2.75:1 | ❌ |
| `#e28538` | `#e28538` (mismo, como contorno de foco) | 1.00:1 | ❌ |

Para texto pequeño usa las variantes ya oscurecidas que existen para esto: `--verde-texto` (`#2f7044`, 5.96:1 sobre blanco), `--terracota-texto`, `--oro-texto`. Si vas a pintar una sección entera de un color de marca, la única combinación de texto que suele funcionar es `--verde-oscuro` (`#1d381c`) o blanco puro — compruébalo con la fórmula de luminancia relativa de WCAG, no a ojo.

**Repite el cálculo por cada fondo distinto donde el elemento pueda aparecer.** Un contorno de foco calibrado para el hero oscuro puede ser invisible tres secciones más abajo sobre fondo claro — pasó con el `:focus-visible` global en terracota de `styles.css`, que daba 2.75:1 sobre blanco y 1.00:1 sobre una tarjeta del mismo color.

## 2. Foco visible es un requisito, no un detalle

Todo elemento interactivo nuevo (botón, tarjeta con enlace, campo) necesita un estado de foco **visible y con contraste suficiente en el fondo real donde vive**, no heredado a ciegas del estilo global. Verifica con teclado (Tab), no solo con el ratón.

## 3. Las trampas de especificidad son el bug más frecuente en este repo

Patrón repetido: una regla de tema por `id` de sección (ej. `#cta-final .m-form__input { border-color: transparent }`, especificidad 1,1,0) le gana silenciosamente a un selector de estado con clase (`.m-form__input:focus`, 0,2,0). El resultado no es un error visual obvio — es un estado que **deja de dispararse y nadie lo nota** hasta que alguien navega con teclado o pasa el ratón y no ve nada.

Antes de dar por terminado un cambio de estilo por sección:
- Si el elemento tiene clases con `.is-visible`, `.is-active` u otro estado dinámico, **verifica que tu regla de tema no le gane** en especificidad y anule ese estado (`transform: none` es el síntoma clásico: mata tanto animaciones de entrada como de hover).
- Cuando un estado necesita ganar dentro de una sección temada por id, **repite la regla con el id delante** (`#seccion .elemento:hover { ... }`) en vez de confiar en el orden de aparición en el archivo.

## 4. Microinteracciones: hover, focus y active son estados distintos

- **`:hover` va dentro de `@media (hover: hover) and (pointer: fine)`.** En táctil, el hover se queda "pegado" tras el primer toque; sin esta guarda, el usuario táctil ve un estado que nunca se suelta.
- **`:active` (el hundido al pulsar) va en un bloque aparte, fuera de `(hover: hover)`** — en táctil no hay hover pero sí pulsación, y es la única señal de respuesta que va a tener. Colócalo **después** del bloque de `:hover` en el archivo: mientras el puntero está encima, ambos estados coinciden, y con igual especificidad gana el que aparece último en la cascada. Repartir `:active` en dos bloques distintos (uno antes, otro después del hover) es una fuente de bugs silenciosos: algunos elementos "pierden" el hundido según en qué bloque cayó cada selector.
- **Tarjetas grandes: `translateY`, no `scale`.** Escalar una tarjeta de varios cientos de píxeles mueve el borde varios píxeles y, mientras dura la transición, el texto se rasteriza a un tamaño intermedio y se ve borroso. Reserva `scale()` para piezas pequeñas sin párrafos (chips, iconos, botones).
- **Duraciones cortas.** Un hover que tarda más de ~200ms deja de leerse como respuesta y empieza a leerse como demora. En este proyecto los tokens son `--m-t-pulsar: 110ms` y `--m-t-hover: 170ms` (`css/minimal.css`).

## 5. `prefers-reduced-motion` no es opcional

Todo lo animado (transiciones de hover/active incluidas, no solo `@keyframes`) debe quedar dentro de `@media (prefers-reduced-motion: no-preference)`. Si el proyecto ya define un bloque `reduce` (lo hace `styles.css`), cuidado: reglas nuevas con la misma especificidad cargadas **después** en la cascada pueden ganarle dentro de ese bloque y reintroducir el movimiento que se quería anular. Cuando pase esto, envuelve la regla nueva explícitamente en `no-preference` en vez de dejarla suelta.

## 6. `position: static` rompe hijos absolutos con `inset` negativo

Si un componente tiene capas decorativas absolutas con `inset` negativo (halos, aros, glow), su contenedor **no puede ser `position: static`** — las capas se anclan al ancestro posicionado más cercano, que puede ser una sección entera, y se estiran a un tamaño absurdo. Usa `position: relative` aunque el elemento no necesite desplazarse.

## 7. Verificación

- **No confíes en simular el ratón con Playwright para comprobar hover/active** — en este repo dio falsos negativos repetidamente (el puntero "no llegaba" a elementos que sí eran interactivos). Fuerza los pseudo-estados directamente con Chrome DevTools Protocol (`CSS.forcePseudoState`) y espera a que la transición termine antes de leer `getComputedStyle`.
- Prueba en los seis anchos de la escalera del proyecto: 390, 480, 768, 968, 1080, 1200. Cero scroll horizontal, cero errores de consola.
- Prueba con `reducedMotion: 'reduce'` en el navegador: nada debe quedar oculto (`opacity` baja) ni deformado por una transición interrumpida a medias.
