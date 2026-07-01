// ════════════════════════════════════════
//  DATE MASK — DD/MM/AAAA
//  Allows typed input + keeps native calendar picker
// ════════════════════════════════════════
(function () {
  // Replace type=date inputs with a dual approach:
  // visible text input (masked) + hidden date input (ISO value for saving)
  function applyMask(textInput) {
    textInput.addEventListener('input', onInput);
    textInput.addEventListener('keydown', onKeydown);
    textInput.setAttribute('maxlength', '10');
    textInput.setAttribute('placeholder', 'DD/MM/AAAA');
    textInput.setAttribute('inputmode', 'numeric');
  }

  function onInput(e) {
    let v = e.target.value.replace(/\D/g, ''); // digits only
    if (v.length > 8) v = v.slice(0, 8);
    let out = '';
    if (v.length > 4) out = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
    else if (v.length > 2) out = v.slice(0,2) + '/' + v.slice(2);
    else out = v;
    e.target.value = out;
    syncHidden(e.target);
  }

  function onKeydown(e) {
    // Allow: backspace, delete, tab, arrows, ctrl shortcuts
    if ([8,46,9,27,13,37,38,39,40].includes(e.keyCode)) return;
    // Block non-numeric
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  // Write ISO date to the hidden <input type=date> paired with this text input
  function syncHidden(textInput) {
    const hidden = document.getElementById(textInput.id + '-iso');
    if (!hidden) return;
    const parts = textInput.value.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      const [d, m, y] = parts;
      if (+d >= 1 && +d <= 31 && +m >= 1 && +m <= 12) {
        const iso = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        hidden.value = iso;
        // Validate
        const date = new Date(iso);
        const valid = !isNaN(date) && date <= new Date();
        textInput.style.borderColor = valid || textInput.value.length < 10 ? '' : '#e53e3e';
        textInput.setAttribute('aria-invalid', String(!valid && textInput.value.length === 10));
      }
    } else {
      if (hidden) hidden.value = '';
    }
  }

  // Called after DOM is built; converts specified date fields to masked text inputs
  window.initDateMasks = function () {
    const DATE_FIELDS = ['f-nascimento', 'f-data-visita', 'ag-data'];
    DATE_FIELDS.forEach(id => {
      const orig = document.getElementById(id);
      if (!orig || orig.dataset.masked) return;

      // Create visible text input
      const text = document.createElement('input');
      text.type = 'text';
      text.id = id + '-text';
      text.placeholder = 'DD/MM/AAAA';
      text.setAttribute('aria-label', orig.getAttribute('aria-label') || orig.previousElementSibling?.textContent || 'Data');
      text.className = orig.className;
      text.style.cssText = orig.style.cssText;

      // Create hidden ISO input (keeps existing id for save functions)
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id = id;
      hidden.name = orig.name || id;

      // Optionally keep a small calendar icon/button
      const wrap = document.createElement('div');
      wrap.className = 'date-input-wrap';
      wrap.style.display = 'flex';
      wrap.style.gap = '0.4rem';
      wrap.style.alignItems = 'center';

      orig.replaceWith(wrap);
      wrap.appendChild(text);
      wrap.appendChild(hidden);

      applyMask(text);
      text.dataset.masked = 'true';

      // Keep val() working: patch to read hidden ISO
      // (val() in db.js reads by id, hidden has the id, so it works automatically)
    });
  };

  // Helper: populate a date mask field from an ISO string (for editarFicha)
  window.setDateMask = function (id, isoValue) {
    if (!isoValue) return;
    const hidden = document.getElementById(id);
    const text   = document.getElementById(id + '-text');
    if (hidden) hidden.value = isoValue;
    if (text && isoValue) {
      const [y, m, d] = isoValue.split('-');
      text.value = `${d}/${m}/${y}`;
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.initDateMasks();
  });
})();
