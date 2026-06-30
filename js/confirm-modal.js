// ════════════════════════════════════════
//  CONFIRM MODAL — replaces native confirm()
// ════════════════════════════════════════
let _confirmCallback = null;

function askConfirm(message, onYes, opts = {}) {
  document.getElementById('confirm-msg').textContent = message;
  document.getElementById('confirm-title').textContent = opts.title || 'Confirmar ação';
  document.getElementById('confirm-yes-btn').textContent = opts.yesLabel || 'Sim, confirmar';
  _confirmCallback = onYes;
  document.getElementById('modal-confirm').classList.add('open');
}

function _confirmYes() {
  document.getElementById('modal-confirm').classList.remove('open');
  if (typeof _confirmCallback === 'function') _confirmCallback();
  _confirmCallback = null;
}

function _confirmNo() {
  document.getElementById('modal-confirm').classList.remove('open');
  _confirmCallback = null;
}
