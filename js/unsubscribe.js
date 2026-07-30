/* ══════════════════════════════════════════════════════════════
   ALACENA MÁGICA · unsubscribe.js
   Formulario de baja de cuenta / eliminación de datos.

   El sitio es estático, así que hay dos modos de envío según lo
   que valga el atributo data-endpoint del formulario:

     · Vacío  → se abre el cliente de correo del usuario con la
                solicitud ya redactada. No se envía nada solo:
                es el usuario quien pulsa "enviar" en su correo.
     · Con URL → se envía por POST con fetch a ese endpoint.

   En ambos casos se termina en la página de confirmación.
   ════════════════════════════════════════════════════════════ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const form = document.getElementById('unsubscribeForm');
  if (!form) return;

  const status = document.getElementById('formStatus');
  const endpoint = form.dataset.endpoint || '';
  const fallbackEmail = form.dataset.fallbackEmail || '';
  const successUrl = form.dataset.success || 'gracias.html';

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const setStatus = (msg, isError) => {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  };

  /* ── Validación ────────────────────────────────── */
  const validate = () => {
    const invalid = [];

    form.querySelectorAll('[required]').forEach((el) => {
      const empty = !el.value.trim();
      const badEmail = el.type === 'email' && !empty && !isValidEmail(el.value);
      const bad = empty || badEmail;
      el.classList.toggle('is-invalid', bad);
      el.setAttribute('aria-invalid', String(bad));
      if (bad) invalid.push(el);
    });

    return invalid;
  };

  // Limpiar el error en cuanto el usuario corrige
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('is-invalid')) {
      el.classList.remove('is-invalid');
      el.setAttribute('aria-invalid', 'false');
    }
  });
  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('is-invalid') && el.value) {
      el.classList.remove('is-invalid');
      el.setAttribute('aria-invalid', 'false');
    }
  });

  /* ── Envío ─────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const invalid = validate();
    if (invalid.length) {
      invalid[0].focus();
      setStatus('Revisa los campos marcados y volvemos a intentarlo.', true);
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const submitBtn = form.querySelector('[type="submit"]');

    // Modo A · sin endpoint: redactamos el correo por el usuario
    if (!endpoint) {
      if (!fallbackEmail) {
        setStatus('El formulario aún no está configurado. Escríbenos por correo, por favor.', true);
        return;
      }

      const asunto = `Solicitud de baja · ${data.tipo || 'Alacena Mágica'}`;
      const cuerpo = [
        `Nombre: ${data.nombre}`,
        `Correo: ${data.email}`,
        `Plataforma: ${data.plataforma}`,
        `Tipo de solicitud: ${data.tipo}`,
        '',
        'Comentario adicional:',
        data.comentario || '(sin comentario)'
      ].join('\n');

      setStatus('Abriendo tu correo para que confirmes el envío...');
      window.location.href =
        `mailto:${fallbackEmail}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

      // Damos margen a que se abra el cliente de correo antes de cambiar de página
      setTimeout(() => { window.location.href = successUrl; }, 1200);
      return;
    }

    // Modo B · con endpoint configurado
    try {
      if (submitBtn) submitBtn.disabled = true;
      setStatus('Enviando tu solicitud...');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      window.location.href = successUrl;

    } catch (err) {
      if (submitBtn) submitBtn.disabled = false;
      setStatus('No hemos podido enviar la solicitud. Inténtalo de nuevo o escríbenos por correo.', true);
    }
  });

});
