// ════════════════════════════════════════
//  PORTAL DA CLIENTE
// ════════════════════════════════════════
let _cpAdminUid = null;
let _cpFichaId  = null;
let _cpFicha    = null;

// ─── Resgatar código de convite ───
function resgatarConvite() {
  const codeEl = document.getElementById('invite-code');
  const code   = codeEl.value.trim().toUpperCase();
  const errEl  = document.getElementById('invite-error');
  errEl.style.display = 'none';

  if (!code) { errEl.textContent = 'Introduz o código de convite.'; errEl.style.display = 'block'; return; }

  const btn = document.getElementById('invite-submit-btn');
  btn.disabled = true; btn.textContent = 'A validar...';

  fsdb.collection('convites').doc(code).get().then(doc => {
    if (!doc.exists) throw new Error('not-found');
    const conv = doc.data();
    if (conv.used) throw new Error('used');

    return fsdb.collection('clientes').doc(currentUser.uid).set({
      fichaId: conv.fichaId, adminUid: conv.adminUid,
      codigoUsado: code, criadoEm: new Date().toISOString()
    }).then(() => doc.ref.update({ used: true }))
      .then(() => ({ adminUid: conv.adminUid, fichaId: conv.fichaId }));
  }).then(({ adminUid, fichaId }) => {
    userRole = 'cliente';
    applyRoleUI('cliente');
    initClientPortal(adminUid, fichaId);
  }).catch(err => {
    if (err.message === 'used') errEl.textContent = 'Este código já foi utilizado.';
    else if (err.message === 'not-found') errEl.textContent = 'Código inválido. Confirma com a Luana.';
    else errEl.textContent = 'Ocorreu um erro. Tenta novamente.';
    errEl.style.display = 'block';
  }).finally(() => { btn.disabled = false; btn.textContent = 'Validar código'; });
}

// ─── Carregar ficha da cliente ───
function initClientPortal(adminUid, fichaId) {
  _cpAdminUid = adminUid; _cpFichaId = fichaId;
  fsdb.collection('users').doc(adminUid).collection('fichas').doc(fichaId).get()
    .then(doc => {
      if (!doc.exists) { toast('⚠️ A tua ficha não foi encontrada.', 'danger'); return; }
      _cpFicha = doc.data();
      renderClientPortal();
    }).catch(err => {
      console.error('Erro ao carregar ficha:', err);
      toast('⚠️ Erro ao carregar a tua ficha.', 'danger');
    });
}

function renderClientPortal() {
  const c = _cpFicha; if (!c) return;

  document.getElementById('cp-saudacao').textContent = `Olá, ${c.nome.split(' ')[0]}! 🍒`;
  document.getElementById('cp-nome').textContent       = c.nome || '—';
  document.getElementById('cp-nascimento').textContent = c.nascimento
    ? `${formatDate(c.nascimento)} (${calcAge(c.nascimento)} anos)` : '—';
  document.getElementById('cp-profissao').textContent  = c.profissao || '—';
  document.getElementById('cp-tipo-pele').textContent  = getTipoPele(c).join(', ') || '—';
  document.getElementById('cp-services').innerHTML     =
    getSelectedServices(c).map(s => `<span class="tag tag-moss">${s}</span>`).join('') ||
    '<span class="cp-hint">Nenhum serviço registado ainda.</span>';

  document.getElementById('cp-telefone').value = c.telefone || '';
  document.getElementById('cp-email').value    = c.email    || '';
  document.getElementById('cp-endereco').value = c.endereco || '';

  // Profile photo
  renderProfilePhoto(c);

  // Booking calendar
  initBookingCalendar(_cpAdminUid, _cpFichaId, c.nome, c.email);

  // Agenda
  renderAgendaCliente(c);
}

// ─── Agenda da cliente ───
async function renderAgendaCliente(c) {
  const el = document.getElementById('cp-agenda-list');
  if (!el) return;
  const today = new Date().toISOString().split('T')[0];
  const items = [];

  (c.planos || []).forEach(p => (p.sessoes || []).forEach(s => {
    if (s.proxima && s.proxima >= today) items.push({ label: p.nome, data: s.proxima, hora: '' });
  }));
  (c.agendamentos || []).forEach(a => {
    if (a.data && a.data >= today) items.push({ label: a.nota || 'Compromisso', data: a.data, hora: '' });
  });

  // Fetch Firestore marcações for this client
  try {
    const snap = await fsdb.collection('users').doc(_cpAdminUid)
      .collection('marcacoes').where('fichaId','==',_cpFichaId)
      .where('data','>=',today).where('estado','==','confirmada').get();
    snap.docs.forEach(d => {
      const md = d.data();
      items.push({ label: md.servico || 'Consulta agendada', data: md.data, hora: md.hora });
    });
  } catch {}

  items.sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));

  if (!items.length) {
    el.innerHTML = `<div class="agenda-empty">Não tens sessões agendadas no momento.</div>`;
    return;
  }
  el.innerHTML = items.map(it => {
    const d = new Date(it.data + 'T00:00:00');
    const isToday = it.data === today;
    return `<div class="agenda-item ${isToday?'is-today':''}" role="listitem">
      <div class="agenda-date">
        <span class="agenda-day">${d.getDate().toString().padStart(2,'0')}</span>
        <span class="agenda-month">${d.toLocaleDateString('pt-PT',{month:'short'})}</span>
      </div>
      <div class="agenda-info">
        <div class="agenda-cliente">${it.hora ? it.hora + ' · ' : ''}${it.label}</div>
      </div>
      <div class="agenda-badge">${isToday?'Hoje':d.toLocaleDateString('pt-PT',{weekday:'short'})}</div>
    </div>`;
  }).join('');
}

// ─── Actualizar dados de contacto ───
function salvarContatoCliente() {
  const telefone = document.getElementById('cp-telefone').value.trim();
  const email    = document.getElementById('cp-email').value.trim();
  const endereco = document.getElementById('cp-endereco').value.trim();

  if (telefone && !/^[0-9+()\s-]{7,20}$/.test(telefone)) { toast('⚠️ Telefone inválido.', 'danger'); return; }
  if (email    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('⚠️ E-mail inválido.', 'danger'); return; }

  fsdb.collection('users').doc(_cpAdminUid).collection('fichas').doc(_cpFichaId)
    .update({ telefone, email, endereco, updatedAt: new Date().toISOString() })
    .then(() => {
      Object.assign(_cpFicha, { telefone, email, endereco });
      toast('✅ Dados atualizados com sucesso!');
    }).catch(() => toast('⚠️ Erro ao guardar. Tenta novamente.', 'danger'));
}

// ─── Foto de perfil ───
function renderProfilePhoto(c) {
  const wrap = document.getElementById('cp-avatar-display');
  const rmBtn = document.getElementById('cp-remove-photo-btn');
  if (!wrap) return;
  if (c.photoURL) {
    wrap.innerHTML = `<img src="${c.photoURL}" alt="Foto de perfil de ${c.nome}">`;
    if (rmBtn) rmBtn.style.display = '';
  } else {
    wrap.innerHTML = '🌸';
    if (rmBtn) rmBtn.style.display = 'none';
  }
}

function uploadProfilePhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { toast('⚠️ Seleciona uma imagem.', 'danger'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('⚠️ Imagem demasiado grande (máx. 5MB).', 'danger'); return; }

  toast('A enviar foto...');
  const path = `perfil/${currentUser.uid}/photo`;
  fstorage.ref().child(path).put(file)
    .then(snap => snap.ref.getDownloadURL())
    .then(url => {
      return fsdb.collection('users').doc(_cpAdminUid).collection('fichas').doc(_cpFichaId)
        .update({ photoURL: url });
    }).then(() => {
      _cpFicha.photoURL = _cpFicha.photoURL; // will be fetched
      // Re-fetch to get the URL
      return fsdb.collection('users').doc(_cpAdminUid).collection('fichas').doc(_cpFichaId).get();
    }).then(doc => {
      _cpFicha = doc.data();
      renderProfilePhoto(_cpFicha);
      toast('✅ Foto atualizada!');
    }).catch(() => toast('⚠️ Erro ao enviar a foto.', 'danger'));
}

function removeProfilePhoto() {
  askConfirm('Remover a foto de perfil?', () => {
    const path = `perfil/${currentUser.uid}/photo`;
    fstorage.ref().child(path).delete().catch(() => {});
    fsdb.collection('users').doc(_cpAdminUid).collection('fichas').doc(_cpFichaId)
      .update({ photoURL: firebase.firestore.FieldValue.delete() })
      .then(() => {
        delete _cpFicha.photoURL;
        renderProfilePhoto(_cpFicha);
        toast('🗑️ Foto removida.');
      }).catch(() => toast('⚠️ Erro ao remover.', 'danger'));
  }, { title: 'Remover foto', yesLabel: 'Sim, remover' });
}
