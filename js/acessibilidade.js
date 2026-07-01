// ════════════════════════════════════════
//  ACESSIBILIDADE
//  Dark mode · High Contrast · Colorblind · Font scale
// ════════════════════════════════════════
const a11y = (() => {
  const ROOT = document.documentElement;
  const KEY = 'a11y_prefs';
  let prefs = { theme: '', fontSize: 'md' };

  function save() { localStorage.setItem(KEY, JSON.stringify(prefs)); }

  function load() {
    try { prefs = JSON.parse(localStorage.getItem(KEY)) || prefs; } catch {}
    if (prefs.theme) ROOT.setAttribute('data-theme', prefs.theme);
    if (prefs.fontSize && prefs.fontSize !== 'md')
      ROOT.setAttribute('data-font-size', prefs.fontSize === 'lg' ? 'lg' : prefs.fontSize === 'xl' ? 'xl' : 'sm');
    // Sync toolbar buttons
    document.querySelectorAll('.a11y-btn[aria-pressed]').forEach(btn => {
      btn.setAttribute('aria-pressed', 'false');
    });
    if (prefs.theme === 'dark') _setPressed('[aria-label="Modo escuro"]', true);
    if (prefs.theme === 'high-contrast') _setPressed('[aria-label="Alto contraste"]', true);
    if (prefs.theme === 'colorblind') _setPressed('[aria-label="Modo daltónico"]', true);
  }

  function _setPressed(sel, val) {
    const el = document.querySelector('.a11y-btn' + sel);
    if (el) el.setAttribute('aria-pressed', String(val));
  }

  function setTheme(name, btn) {
    const current = ROOT.getAttribute('data-theme');
    if (current === name) {
      ROOT.removeAttribute('data-theme');
      prefs.theme = '';
      if (btn) btn.setAttribute('aria-pressed', 'false');
    } else {
      ROOT.setAttribute('data-theme', name);
      prefs.theme = name;
      document.querySelectorAll('.a11y-btn[aria-pressed]').forEach(b => b.setAttribute('aria-pressed','false'));
      if (btn) btn.setAttribute('aria-pressed', 'true');
    }
    save();
  }

  const SIZES = ['sm', 'md', 'lg', 'xl'];
  function fontUp() {
    const i = SIZES.indexOf(prefs.fontSize);
    if (i < SIZES.length - 1) { prefs.fontSize = SIZES[i + 1]; applyFont(); save(); }
  }
  function fontDown() {
    const i = SIZES.indexOf(prefs.fontSize);
    if (i > 0) { prefs.fontSize = SIZES[i - 1]; applyFont(); save(); }
  }
  function applyFont() {
    ROOT.removeAttribute('data-font-size');
    if (prefs.fontSize !== 'md') ROOT.setAttribute('data-font-size', prefs.fontSize);
    toast(`Texto: ${({sm:'Pequeno',md:'Normal',lg:'Grande',xl:'Muito grande'})[prefs.fontSize]}`);
  }

  // Public interface
  return {
    init: load,
    toggleDark: (btn) => setTheme('dark', btn),
    toggleHC:   (btn) => setTheme('high-contrast', btn),
    toggleCB:   (btn) => setTheme('colorblind', btn),
    fontUp, fontDown
  };
})();

// ── Show / hide password ──
function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? '🙈' : '👁';
  btn.setAttribute('aria-label', isHidden ? 'Ocultar password' : 'Mostrar password');
}

// Initialise when DOM is ready
document.addEventListener('DOMContentLoaded', () => a11y.init());
