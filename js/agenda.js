// ════════════════════════════════════════
//  AGENDA — próximas sessões previstas
// ════════════════════════════════════════
function renderAgenda() {
  const el = document.getElementById('agenda-list');
  if (!el) return;

  const db = loadDB();
  const today = new Date().toISOString().split('T')[0];
  const items = [];

  db.forEach(c => {
    (c.planos || []).forEach(p => {
      (p.sessoes || []).forEach(s => {
        if (s.proxima && s.proxima >= today) {
          items.push({
            clienteId: c.id,
            clienteNome: c.nome,
            label: p.nome,
            data: s.proxima
          });
        }
      });
    });
    (c.agendamentos || []).forEach(a => {
      if (a.data && a.data >= today) {
        items.push({
          clienteId: c.id,
          clienteNome: c.nome,
          label: a.nota || 'Compromisso agendado',
          data: a.data
        });
      }
    });
  });

  items.sort((a, b) => a.data.localeCompare(b.data));
  const proximos = items.slice(0, 8);

  if (!proximos.length) {
    el.innerHTML = `<div class="agenda-empty">Sem sessões agendadas para os próximos dias.</div>`;
    return;
  }

  el.innerHTML = proximos.map(it => {
    const d = new Date(it.data + 'T00:00:00');
    const isToday = it.data === today;
    const diaSemana = d.toLocaleDateString('pt-PT', { weekday: 'short' });
    return `
      <div class="agenda-item ${isToday ? 'is-today' : ''}" onclick="showDetail('${it.clienteId}')">
        <div class="agenda-date">
          <span class="agenda-day">${d.getDate().toString().padStart(2,'0')}</span>
          <span class="agenda-month">${d.toLocaleDateString('pt-PT', { month: 'short' })}</span>
        </div>
        <div class="agenda-info">
          <div class="agenda-cliente">${it.clienteNome}</div>
          <div class="agenda-plano">${it.label}</div>
        </div>
        <div class="agenda-badge">${isToday ? 'Hoje' : diaSemana}</div>
      </div>`;
  }).join('');
}

// ─── AGENDAMENTO RÁPIDO (sem precisar criar um plano de tratamento) ───
function abrirModalAgendamento() {
  const db = loadDB();
  const sel = document.getElementById('ag-cliente');
  if (!db.length) {
    toast('⚠️ Cadastra uma cliente primeiro.', 'danger');
    return;
  }
  sel.innerHTML = db.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  document.getElementById('ag-data').value = new Date().toISOString().split('T')[0];
  document.getElementById('ag-nota').value = '';
  document.getElementById('modal-agendamento').classList.add('open');
}

function salvarAgendamento() {
  const clienteId = document.getElementById('ag-cliente').value;
  const data = document.getElementById('ag-data').value;
  const nota = document.getElementById('ag-nota').value.trim();
  if (!clienteId || !data) {
    toast('⚠️ Escolhe a cliente e a data.', 'danger');
    return;
  }
  const db = loadDB();
  const idx = db.findIndex(c => c.id === clienteId);
  if (idx < 0) return;
  if (!db[idx].agendamentos) db[idx].agendamentos = [];
  db[idx].agendamentos.push({ id: Date.now().toString(), data, nota });
  saveDB(db);
  fecharModal('modal-agendamento');
  renderAgenda();
  toast('✅ Agendamento criado!');
}
