// ════════════════════════════════════════
//  EXPORTAR — CSV (backup) e Impressão/PDF
// ════════════════════════════════════════
function _csvEscape(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}

function exportarCSV() {
  const db = loadDB();
  if (!db.length) { toast('⚠️ Não há clientes para exportar.', 'danger'); return; }

  const headers = [
    'Nome', 'Nascimento', 'Sexo', 'Profissão', 'Telefone', 'E-mail', 'Endereço',
    'Indicação', 'Serviços', 'Tipo de Pele', 'Estado da Pele', 'Fitzpatrick',
    'Primeira Visita', 'Avaliação', 'Última Atualização'
  ];

  const rows = db.map(c => [
    c.nome, c.nascimento, c.sexo, c.profissao, c.telefone, c.email, c.endereco,
    c.indicacao, getSelectedServices(c).join(' | '), getTipoPele(c).join(' | '),
    getEstadoPele(c).join(' | '), c.fitzpatrick, c.dataVisita, c.avaliacao,
    c.updatedAt ? new Date(c.updatedAt).toLocaleString('pt-PT') : ''
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(_csvEscape).join(';'))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `luana-estetica-clientes-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✅ CSV exportado com sucesso!');
}

function imprimirFicha() {
  window.print();
}
