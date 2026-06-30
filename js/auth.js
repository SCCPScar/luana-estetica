// ════════════════════════════════════════
//  AUTHENTICATION
// ════════════════════════════════════════
let currentUser = null;

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = 'block';
}
function hideAuthError() {
  document.getElementById('auth-error').style.display = 'none';
}

function translateAuthError(code) {
  const M = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não existe conta com este e-mail.',
    'auth/wrong-password': 'Password incorreta.',
    'auth/invalid-credential': 'E-mail ou password incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com este e-mail.',
    'auth/weak-password': 'A password deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarda um pouco e tenta de novo.',
    'auth/network-request-failed': 'Sem ligação à internet.'
  };
  return M[code] || 'Ocorreu um erro. Tenta novamente.';
}

function doLogin() {
  hideAuthError();
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  if (!email || !pass) { showAuthError('Preenche o e-mail e a password.'); return; }

  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = true; btn.textContent = 'A entrar...';

  auth.signInWithEmailAndPassword(email, pass)
    .catch(err => showAuthError(translateAuthError(err.code)))
    .finally(() => { btn.disabled = false; btn.textContent = 'Entrar'; });
}

function doRegister() {
  hideAuthError();
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value;
  if (!email || !pass) { showAuthError('Preenche o e-mail e a password.'); return; }
  if (pass.length < 6) { showAuthError('A password deve ter pelo menos 6 caracteres.'); return; }

  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = true; btn.textContent = 'A criar conta...';

  auth.createUserWithEmailAndPassword(email, pass)
    .catch(err => showAuthError(translateAuthError(err.code)))
    .finally(() => { btn.disabled = false; btn.textContent = 'Criar conta'; });
}

function doLogout() {
  askConfirm('Terminar sessão?', () => auth.signOut(), { title: 'Sair', yesLabel: 'Sim, sair' });
}

function toggleAuthMode() {
  const isLogin = document.getElementById('auth-mode-title').dataset.mode === 'login';
  hideAuthError();
  if (isLogin) {
    document.getElementById('auth-mode-title').textContent = 'Criar Conta';
    document.getElementById('auth-mode-title').dataset.mode = 'register';
    document.getElementById('auth-submit-btn').textContent = 'Criar conta';
    document.getElementById('auth-submit-btn').onclick = doRegister;
    document.getElementById('auth-toggle-text').innerHTML = 'Já tens conta? <a href="#" onclick="toggleAuthMode();return false;">Entrar</a>';
  } else {
    document.getElementById('auth-mode-title').textContent = 'Entrar';
    document.getElementById('auth-mode-title').dataset.mode = 'login';
    document.getElementById('auth-submit-btn').textContent = 'Entrar';
    document.getElementById('auth-submit-btn').onclick = doLogin;
    document.getElementById('auth-toggle-text').innerHTML = 'Ainda não tens conta? <a href="#" onclick="toggleAuthMode();return false;">Criar conta</a>';
  }
}

// ── AUTH STATE LISTENER ──
auth.onAuthStateChanged(user => {
  const loadingScreen = document.getElementById('loading-screen');
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app-screen');

  if (user) {
    currentUser = user;
    loadingScreen.style.display = 'none';
    authScreen.style.display = 'none';
    appScreen.style.display = 'block';
    document.getElementById('user-email-label').textContent = user.email;
    initApp();
  } else {
    currentUser = null;
    loadingScreen.style.display = 'none';
    appScreen.style.display = 'none';
    authScreen.style.display = 'flex';
  }
});

// Enter key submits the form
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('auth-submit-btn').click();
  });
});
