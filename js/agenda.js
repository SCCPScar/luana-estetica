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
            planoNome: p.nome,
            data: s.proxima
          });
        }
      });
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
          <div class="agenda-plano">${it.planoNome}</div>
        </div>
        <div class="agenda-badge">${isToday ? 'Hoje' : diaSemana}</div>
      </div>`;
  }).join('');
}
