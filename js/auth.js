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
let userRole = null; // 'admin' | 'cliente' | null

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
    resolveUserRole(user);
  } else {
    currentUser = null;
    userRole = null;
    loadingScreen.style.display = 'none';
    appScreen.style.display = 'none';
    authScreen.style.display = 'flex';
  }
});

function resolveUserRole(user) {
  if (user.uid === ADMIN_UID) {
    userRole = 'admin';
    applyRoleUI('admin');
    initApp();
    return;
  }
  fsdb.collection('clientes').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      userRole = 'cliente';
      applyRoleUI('cliente');
      initClientPortal(doc.data().adminUid, doc.data().fichaId);
    } else {
      userRole = 'pendente';
      applyRoleUI('pendente');
    }
  }).catch(err => {
    console.error('Erro ao verificar conta:', err);
    toast('⚠️ Erro ao verificar a conta.', 'danger');
  });
}

// Hides/shows nav buttons and switches between the admin app and the
// simplified client-only screens, depending on who logged in.
function applyRoleUI(role) {
  const navClientes = document.getElementById('nav-clientes-btn');
  const navNova = document.getElementById('nav-nova-btn');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  if (role === 'admin') {
    navClientes.style.display = '';
    navNova.style.display = '';
    const notifBtn = document.getElementById('nav-notifications-btn');
    if (notifBtn) { notifBtn.style.display = ''; renderNotifBadge(); }
    document.getElementById('view-search').classList.add('active');
  } else if (role === 'cliente') {
    navClientes.style.display = 'none';
    navNova.style.display = 'none';
    document.getElementById('view-client-portal').classList.add('active');
  } else {
    navClientes.style.display = 'none';
    navNova.style.display = 'none';
    document.getElementById('view-client-invite').classList.add('active');
  }
}

// Enter key submits the form
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('auth-submit-btn').click();
  });
});
