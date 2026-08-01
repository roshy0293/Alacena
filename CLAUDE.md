# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es esto

Landing page estática de **Alacena Mágica** (app de recetas a partir de lo que hay en la nevera). HTML + CSS + JavaScript nativo ES6+, **sin dependencias, sin build, sin gestor de paquetes y sin tests**. No hay `package.json` ni backend: cualquier dato es local al cliente.

**El idioma del proyecto es el español**, incluidos comentarios de código, nombres de variables de dominio (`seleccion`, `RECETAS`, `--verde-marca`), copy y mensajes de commit. Mantenlo.

## Desarrollo

No hay que compilar nada. Para previsualizar hace falta un servidor: abrir los archivos con `file://` rompe rutas relativas.

```bash
python3 -m http.server 8080     # luego http://localhost:8080/index.html
```

**Verificación de cambios:** no hay suite de tests. Los cambios se validan visualmente, y como casi todo el CSS es responsive, hay que comprobarlos en varios anchos. En este entorno hay Chromium en `/opt/pw-browsers/chromium`; con `npm install playwright-core` en un directorio temporal se pueden hacer capturas a los anchos de los breakpoints (390, 480, 768, 968, 1080, 1200). No ejecutes `playwright install`.

**Despliegue:** GitHub Pages sirve `main` directamente mediante el workflow `pages-build-deployment`. Fusionar a `main` publica en producción; no hay staging ni paso de build intermedio. No hay CI en los pull requests.

## Arquitectura

### Reparto de hojas y scripts

Hay dos niveles. `css/styles.css` es la base de **todas** las páginas (tokens, reset, navbar, footer, botones); `css/legal.css` se carga encima solo en las páginas de contenido largo y añade el layout de dos columnas con índice lateral.

| Página | CSS | JS |
|---|---|---|
| `index.html` | `styles.css` | `main.js` |
| `minimal.html` | `styles.css` + `minimal.css` | `main.js` |
| `privacy` · `terms` · `support` · `gracias` | `styles.css` + `legal.css` | `legal.js` |
| `unsubscribe.html` | `styles.css` + `legal.css` | `legal.js` + `unsubscribe.js` |

`minimal.html` es una variante alternativa de la portada, no un sustituto: comparte `main.js` sin modificarlo y se apoya en que las IIFE decorativas se desactivan solas cuando su enganche no está en el marcado. `minimal.css` **rehace la escalera de `--nav-h` en sus propios breakpoints**, porque al cargarse después que `styles.css` un valor suelto en `:root` ganaría en todos los anchos.

`main.js` y `legal.js` **nunca conviven**: el menú móvil está duplicado a propósito en ambos para que las páginas legales no carguen los 500 líneas del landing. Si tocas el comportamiento del menú, tócalo en los dos sitios.

### Sistema de tokens

Todo el diseño sale de las custom properties de `:root` en `css/styles.css` (paleta, tipografía fluida con `clamp()`, espaciado, radios, sombras, easings). **No metas valores literales de color o tamaño**: añade o reutiliza un token.

Las variantes `--verde-texto`, `--terracota-texto`, `--oro-texto` existen porque los colores de marca no alcanzan el contraste 4.5:1 de WCAG AA en texto pequeño. Úsalas para texto sobre fondos claros; los tonos de marca quedan para superficies grandes.

### Acoplamientos que hay que respetar

Estas tres cosas rompen de forma silenciosa si se cambian por separado:

1. **`--nav-h` / `--nav-h-scrolled`** alimentan a la vez el alto de la barra, el `scroll-padding-top` del `html` (para que los anclajes no queden tapados) y el `max-height` del menú desplegable. Los breakpoints **redefinen estas variables dentro de `:root`** (118px → 92 → 80 → 72). Si ajustas el alto de la barra en un ancho, hazlo desde la variable, no desde la regla del componente.
2. **El corte de 1080px** es donde la barra pasa a hamburguesa, y está duplicado en el `matchMedia('(min-width: 1081px)')` de `main.js` que cierra el menú al volver a escritorio. Cambiar uno sin el otro deja el menú abierto en escritorio.
3. **El menú móvil se oculta con `visibility`**, no solo con `transform`. Un desplazamiento porcentual depende de la altura del panel y con pocos enlaces asomaba por arriba de la pantalla.

Escalera de breakpoints (todos `max-width`): 1200 · 1080 · 968 · 768 · 480, más el bloque `prefers-reduced-motion`.

### Convenciones de JavaScript

`main.js` y `legal.js` siguen el mismo patrón: un único `DOMContentLoaded` que contiene **IIFE nombradas, una por funcionalidad**, cada una con una guarda que hace `return` si sus elementos no están en el DOM. Así el mismo archivo puede servir a páginas con distinto marcado. Al añadir una funcionalidad, sigue la forma y añádela al índice numerado de la cabecera del archivo.

- **Estado en el DOM mediante clases `is-*`** (`is-open`, `is-active`, `is-visible`, `is-selected`, `is-invalid`, `is-scrolled`), no en variables de módulo.
- **`prefersReducedMotion()` cierra el paso a todo lo decorativo** — destellos, parallax, contadores animados. Si añades una animación, pásala por esa comprobación.
- **Los listeners de scroll y puntero van por `rafThrottle` y con `{ passive: true }`.**
- **`IntersectionObserver` con guarda de disponibilidad**: si no existe, hay que dejar el contenido visible, no oculto (ver `revealOnScroll`).
- **Los atributos ARIA se actualizan junto a la clase**, siempre en la misma función: `aria-expanded` en el menú, `aria-pressed` en los toggles de ingredientes, `aria-selected` en los filtros de dieta. No cambies uno sin el otro.

El `<head>` de cada página añade la clase `js` al `<html>` **antes de pintar**, para que las animaciones de entrada solo escondan contenido si hay JS capaz de revelarlo después. Sin JS, la página se ve entera.

### Formularios

No hay backend en ninguno.

- **Lista de espera** (`index.html`, sección 15 de `main.js`): valida en cliente y responde con un mensaje. No envía nada a ningún sitio.
- **Baja de cuenta** (`unsubscribe.html` + `unsubscribe.js`): dos modos según los `data-*` del `<form>`. Con `data-endpoint` vacío (estado actual) compone un `mailto:` prerrellenado hacia `data-fallback-email` y es el usuario quien envía; con una URL en `data-endpoint` hace `POST` con `fetch`. En ambos casos termina en `data-success`. Para conectar un backend basta con rellenar `data-endpoint` en el HTML: no hay que tocar el JS.

### Demo interactiva de recetas

La sección "EL TRUCO" (`main.js` §11) es una demo que corre **entera en el cliente**, sin API. `INGREDIENTES` y `RECETAS` son constantes dentro de la propia IIFE. El ranking ordena por porcentaje de coincidencia (ingredientes que tienes ÷ los que pide la receta) y desempata por número absoluto de coincidencias. Las recetas usan `foto` cuando hay imagen real y `gradiente` + `icono` cuando no. Tiene dos estados vacíos distintos: sin nada seleccionado, y con selección que no encaja con ninguna receta.
