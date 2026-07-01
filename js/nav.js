// ════════════════════════════════════════
//  NAVIGATION
// ════════════════════════════════════════
let currentEditId = null;

function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  document.querySelectorAll('.nav-btn[data-view]').forEach(b =>
    b.classList.toggle('active', b.dataset.view === v)
  );
  if (v === 'search') { renderCards(); renderAgenda(); }
}

// Used by the logo click — sends each role to its own "home" screen.
function goHome() {
  if (userRole === 'cliente') {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-client-portal').classList.add('active');
  } else if (userRole === 'admin') {
    showView('search');
  }
}

// ════════════════════════════════════════
//  HOME / SEARCH
// ════════════════════════════════════════
function renderCards() {
  const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const db = loadDB();
  const filtered = q ? db.filter(c => c.nome.toLowerCase().includes(q)) : db;

  // Stats
  const total = db.length;
  document.getElementById('stat-total').textContent = total;

  const grid = document.getElementById('clients-grid');

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍒</div>
        <h3>${q ? 'Nenhuma cliente encontrada' : 'Ainda sem clientes'}</h3>
        <p>${q
          ? `Não há resultados para "<strong>${q}</strong>". Tente outro nome.`
          : 'Clique em <strong>+ Nova Ficha</strong> no menu<br>para cadastrar a primeira cliente.'
        }</p>
      </div>`;
    return;
  }

  const PB = { 'Ótima':'pb-otima','Boa':'pb-boa','Normal':'pb-normal','Irritada':'pb-irritada','Reação':'pb-reacao' };

  grid.innerHTML = filtered.map(c => {
    const initials = c.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const age = c.nascimento ? calcAge(c.nascimento) : null;
    const svcs = getSelectedServices(c);
    const tipos = getTipoPele(c);
    const estados = getEstadoPele(c);
    const stars = c.avaliacao > 0 ? '⭐'.repeat(c.avaliacao) : '';
    const totalPlanos = (c.planos || []).length;
    const planoActivo = (c.planos || []).find(p => p.status === 'em-andamento');

    return `
      <div class="client-card" onclick="showDetail('${c.id}')">
        <div class="card-top">
          <div class="card-avatar">${initials}</div>
          <div class="card-info">
            <h3>${c.nome}</h3>
            <div class="card-meta">
              ${age ? age + ' anos' : ''}${age && c.telefone ? ' · ' : ''}${c.telefone || ''}
              ${c.profissao ? '<br>' + c.profissao : ''}
            </div>
          </div>
        </div>
        <div class="tags-row">
          ${svcs.slice(0, 2).map(s => `<span class="tag tag-moss">${s}</span>`).join('')}
          ${svcs.length > 2 ? `<span class="tag tag-more">+${svcs.length - 2}</span>` : ''}
          ${tipos.slice(0, 1).map(s => `<span class="tag tag-beige">${s}</span>`).join('')}
          ${estados.slice(0, 1).map(s => `<span class="tag tag-rosy">${s}</span>`).join('')}
        </div>
        <div class="card-footer">
          <span>${stars || '—'}</span>
          <span>${planoActivo ? '🍒 ' + planoActivo.nome : totalPlanos ? totalPlanos + ' plano(s)' : c.dataVisita ? formatDate(c.dataVisita) : ''}</span>
        </div>
      </div>`;
  }).join('');
}

// ════════════════════════════════════════
//  TABS (detail)
// ════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.detail-tab').forEach((t, i) =>
    t.classList.toggle('active', (i === 0 && name === 'ficha') || (i === 1 && name === 'tratamento'))
  );
  document.getElementById('tab-ficha').classList.toggle('active', name === 'ficha');
  document.getElementById('tab-tratamento').classList.toggle('active', name === 'tratamento');
  if (name === 'tratamento') renderPlanos();
}

// ─── SEARCH FILTERS ───
let _activeFilter = 'all';
const FILTER_MAP = {
  facial:   ['sv-facial-classico','sv-facial-hidrat','sv-facial-anti-age','sv-facial-vit-c','sv-limpeza','sv-peeling','sv-micropigm-sobrancelhas'],
  unhas:    ['sv-manicure','sv-pedicure','sv-gel','sv-acrilico','sv-nail-art','sv-semi-permanente'],
  corporal: ['sv-corp-esfoliacao','sv-corp-envolvimento','sv-corp-reducao','sv-corp-drenagem'],
  massagem: ['sv-massagem-relax','sv-massagem-modeladora','sv-massagem-pedras','sv-massagem-bambu']
};

function setFilter(filter, btn) {
  _activeFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCards();
}

// Override renderCards to support filter
const _origRenderCards = window.renderCards;
window.renderCards = function() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const db = loadDB();
  const total = db.length;
  document.getElementById('stat-total').textContent = total;

  const filtered = db.filter(c => {
    const nameMatch = !query || c.nome?.toLowerCase().includes(query);
    if (!nameMatch) return false;
    if (_activeFilter === 'all') return true;
    const keys = FILTER_MAP[_activeFilter] || [];
    return keys.some(k => c.services && c.services[k]);
  });

  const grid = document.getElementById('clients-grid');
  if (!grid) return;
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🍒</div><p>${query||_activeFilter!=='all'?'Nenhuma cliente encontrada.':'Ainda não há fichas criadas.'}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(c => _makeCard(c)).join('');
};
