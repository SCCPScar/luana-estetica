// ════════════════════════════════════════
//  TRATAMENTO — PLANOS & SESSÕES
// ════════════════════════════════════════
let currentPlanoEdit = null;

function getPlanos() {
  const db = loadDB();
  const c = db.find(x => x.id === currentEditId);
  return c ? (c.planos || []) : [];
}

function savePlanos(planos) {
  const db = loadDB();
  const idx = db.findIndex(x => x.id === currentEditId);
  if (idx > -1) { db[idx].planos = planos; saveDB(db); }
}

// ─── RENDER ───────────────────────────
function renderPlanos() {
  const planos = getPlanos();
  const el = document.getElementById('planos-list');
  if (!planos.length) {
    el.innerHTML = `<div class="empty-trat"><div class="icon">🌿</div><p>Nenhum plano de tratamento criado ainda.<br>Clique em <strong>+ Novo Plano</strong> para começar a acompanhar.</p></div>`;
    return;
  }

  const SB = {
    'em-andamento': ['badge-andamento', 'Em andamento'],
    'concluido':    ['badge-concluido', 'Concluído'],
    'pausado':      ['badge-pausado',   'Pausado']
  };
  const PB = { 'Ótima':'pb-otima','Boa':'pb-boa','Normal':'pb-normal','Irritada':'pb-irritada','Reação':'pb-reacao' };

  el.innerHTML = planos.map(p => {
    const sess  = p.sessoes || [];
    const today = new Date().toISOString().split('T')[0];
    const feitas = sess.filter(s => s.data && s.data <= today).length;
    const total  = parseInt(p.totalSessoes) || 0;
    const pct    = total > 0 ? Math.min(100, Math.round(feitas / total * 100)) : 0;
    const [bc, bl] = SB[p.status] || SB['em-andamento'];

    const sesHTML = sess.length
      ? sess.map((s, i) => {
          const fut = s.data && s.data > today;
          return `
            <div class="sessao-item">
              <div class="sessao-num ${fut ? 'future' : 'done'}">${s.num || i + 1}</div>
              <div class="sessao-info">
                <div class="sessao-title">${s.feito || 'Sessão ' + (s.num || i + 1)}</div>
                <div class="sessao-date">
                  ${s.data ? '📅 ' + formatDate(s.data) : 'Data não definida'}
                  ${s.proxima ? ' → Próxima: ' + formatDate(s.proxima) : ''}
                </div>
                ${s.evolucao ? `<div class="sessao-evo">${s.evolucao}</div>` : ''}
                ${s.homecare ? `<div class="sessao-evo" style="color:var(--text-lt)">🏠 ${s.homecare}</div>` : ''}
                ${s.peleStatus ? `<span class="pele-badge ${PB[s.peleStatus] || ''}">${s.peleStatus}</span>` : ''}
              </div>
              <div class="sessao-actions">
                <button class="btn btn-outline btn-sm" onclick="editarSessao('${p.id}','${s.id}')">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="excluirSessao('${p.id}','${s.id}')">×</button>
              </div>
            </div>`;
        }).join('')
      : `<div style="font-size:0.82rem;color:var(--text-lt);padding:0.8rem 0">Nenhuma sessão registada ainda.</div>`;

    return `
      <div class="plano-card ${p.status || 'em-andamento'}">
        <div class="plano-top">
          <div>
            <div class="plano-title">${p.nome}</div>
            <div class="plano-meta">
              ${p.tipo ? p.tipo + ' · ' : ''}
              ${p.inicio ? 'Início: ' + formatDate(p.inicio) : ''}
              ${p.intervalo ? ' · ' + p.intervalo : ''}
            </div>
          </div>
          <span class="status-badge ${bc}">${bl}</span>
        </div>
        ${total > 0 ? `
          <div class="progress-wrap">
            <div class="progress-label">
              <span>${feitas} de ${total} sessões realizadas</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${p.status === 'concluido' ? 'night' : ''}" style="width:${pct}%"></div>
            </div>
          </div>` : ''}
        ${p.objetivo ? `<div style="font-size:0.81rem;color:var(--text-lt);margin-bottom:0.5rem">🎯 ${p.objetivo}</div>` : ''}
        ${p.produtos  ? `<div style="font-size:0.81rem;color:var(--text-lt);margin-bottom:0.5rem">🧴 ${p.produtos}</div>`  : ''}
        <div class="sessoes-list">${sesHTML}</div>
        <div class="plano-actions">
          <button class="btn btn-moss btn-sm" onclick="abrirModalSessao('${p.id}')">+ Registar Sessão</button>
          <button class="btn btn-outline btn-sm" onclick="editarPlano('${p.id}')">✏️ Editar Plano</button>
          <button class="btn btn-danger btn-sm" onclick="excluirPlano('${p.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

// ─── MODAL PLANO ──────────────────────
function abrirModalPlano() {
  currentPlanoEdit = null;
  document.getElementById('modal-plano-title').textContent = 'Novo Plano de Tratamento';
  ['mp-nome','mp-objetivo','mp-produtos'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('mp-tipo').value = '';
  document.getElementById('mp-total').value = '';
  document.getElementById('mp-intervalo').value = '';
  document.getElementById('mp-inicio').value = new Date().toISOString().split('T')[0];
  document.getElementById('mp-status').value = 'em-andamento';
  document.getElementById('modal-plano').classList.add('open');
}

function editarPlano(pid) {
  const p = getPlanos().find(x => x.id === pid);
  if (!p) return;
  currentPlanoEdit = pid;
  document.getElementById('modal-plano-title').textContent = 'Editar Plano';
  document.getElementById('mp-nome').value     = p.nome || '';
  document.getElementById('mp-tipo').value     = p.tipo || '';
  document.getElementById('mp-total').value    = p.totalSessoes || '';
  document.getElementById('mp-intervalo').value = p.intervalo || '';
  document.getElementById('mp-inicio').value   = p.inicio || '';
  document.getElementById('mp-objetivo').value = p.objetivo || '';
  document.getElementById('mp-produtos').value  = p.produtos || '';
  document.getElementById('mp-status').value   = p.status || 'em-andamento';
  document.getElementById('modal-plano').classList.add('open');
}

function salvarPlano() {
  const nome = document.getElementById('mp-nome').value.trim();
  if (!nome) { toast('⚠️ Nome do tratamento é obrigatório!', 'danger'); return; }

  const dados = {
    nome,
    tipo:         document.getElementById('mp-tipo').value,
    totalSessoes: document.getElementById('mp-total').value,
    intervalo:    document.getElementById('mp-intervalo').value,
    inicio:       document.getElementById('mp-inicio').value,
    objetivo:     document.getElementById('mp-objetivo').value,
    produtos:     document.getElementById('mp-produtos').value,
    status:       document.getElementById('mp-status').value
  };

  const planos = getPlanos();
  if (currentPlanoEdit) {
    const idx = planos.findIndex(x => x.id === currentPlanoEdit);
    if (idx > -1) planos[idx] = { ...planos[idx], ...dados };
  } else {
    planos.unshift({ id: Date.now().toString(), ...dados, sessoes: [] });
  }
  savePlanos(planos);
  fecharModal('modal-plano');
  renderPlanos();
  toast('✅ Plano guardado!');
}

function excluirPlano(pid) {
  if (!confirm('Excluir este plano e todas as suas sessões?')) return;
  savePlanos(getPlanos().filter(x => x.id !== pid));
  renderPlanos();
  toast('🗑️ Plano excluído.');
}

// ─── MODAL SESSÃO ─────────────────────
function abrirModalSessao(pid) {
  document.getElementById('ms-plano-id').value  = pid;
  document.getElementById('ms-sessao-id').value = '';
  document.getElementById('modal-sessao-title').textContent = 'Registar Nova Sessão';
  ['ms-feito','ms-evolucao','ms-homecare'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ms-data').value    = new Date().toISOString().split('T')[0];
  document.getElementById('ms-proxima').value = '';
  document.getElementById('ms-pele-status').value = '';
  document.querySelectorAll('.pele-opt').forEach(b => b.className = 'pele-opt');
  const p = getPlanos().find(x => x.id === pid);
  document.getElementById('ms-num').value = p ? (p.sessoes || []).length + 1 : 1;
  document.getElementById('modal-sessao').classList.add('open');
}

function editarSessao(pid, sid) {
  const p = getPlanos().find(x => x.id === pid);
  const s = p?.sessoes?.find(x => x.id === sid);
  if (!s) return;
  document.getElementById('ms-plano-id').value  = pid;
  document.getElementById('ms-sessao-id').value = sid;
  document.getElementById('modal-sessao-title').textContent = 'Editar Sessão ' + (s.num || '');
  document.getElementById('ms-num').value      = s.num || '';
  document.getElementById('ms-data').value     = s.data || '';
  document.getElementById('ms-feito').value    = s.feito || '';
  document.getElementById('ms-evolucao').value = s.evolucao || '';
  document.getElementById('ms-proxima').value  = s.proxima || '';
  document.getElementById('ms-homecare').value = s.homecare || '';
  document.getElementById('ms-pele-status').value = s.peleStatus || '';
  document.querySelectorAll('.pele-opt').forEach(b => {
    b.className = 'pele-opt';
    if (b.dataset.v === s.peleStatus) selecionarPele(b);
  });
  document.getElementById('modal-sessao').classList.add('open');
}

function selecionarPele(btn) {
  const M = { 'Ótima':'sel-otima','Boa':'sel-boa','Normal':'sel-normal','Irritada':'sel-irritada','Reação':'sel-reacao' };
  document.querySelectorAll('.pele-opt').forEach(b => b.className = 'pele-opt');
  btn.className = 'pele-opt ' + (M[btn.dataset.v] || '');
  document.getElementById('ms-pele-status').value = btn.dataset.v;
}

function salvarSessao() {
  const pid = document.getElementById('ms-plano-id').value;
  const sid = document.getElementById('ms-sessao-id').value;
  const planos = getPlanos();
  const pIdx = planos.findIndex(x => x.id === pid);
  if (pIdx < 0) return;

  const sessao = {
    id:         sid || Date.now().toString(),
    num:        parseInt(document.getElementById('ms-num').value) || 1,
    data:       document.getElementById('ms-data').value,
    feito:      document.getElementById('ms-feito').value.trim(),
    evolucao:   document.getElementById('ms-evolucao').value.trim(),
    proxima:    document.getElementById('ms-proxima').value,
    homecare:   document.getElementById('ms-homecare').value.trim(),
    peleStatus: document.getElementById('ms-pele-status').value
  };

  if (!planos[pIdx].sessoes) planos[pIdx].sessoes = [];
  if (sid) {
    const sIdx = planos[pIdx].sessoes.findIndex(x => x.id === sid);
    if (sIdx > -1) planos[pIdx].sessoes[sIdx] = sessao;
  } else {
    planos[pIdx].sessoes.push(sessao);
    planos[pIdx].sessoes.sort((a, b) => (a.num || 0) - (b.num || 0));
  }
  savePlanos(planos);
  fecharModal('modal-sessao');
  renderPlanos();
  toast('✅ Sessão registada!');
}

function excluirSessao(pid, sid) {
  if (!confirm('Excluir esta sessão?')) return;
  const planos = getPlanos();
  const pIdx = planos.findIndex(x => x.id === pid);
  if (pIdx < 0) return;
  planos[pIdx].sessoes = (planos[pIdx].sessoes || []).filter(x => x.id !== sid);
  savePlanos(planos);
  renderPlanos();
  toast('🗑️ Sessão excluída.');
}

// ─── MODAL HELPERS ────────────────────
function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );
});
