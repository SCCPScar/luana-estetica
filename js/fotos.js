// ════════════════════════════════════════
//  FOTOS — galeria antes/depois (Firebase Storage)
// ════════════════════════════════════════
let _fotosAtual = [];

function renderFotosGrid() {
  const el = document.getElementById('fotos-grid');
  if (!el) return;
  el.innerHTML = _fotosAtual.map((f, i) => `
    <div class="foto-thumb">
      <img src="${f.url}" alt="Foto da cliente" loading="lazy">
      <button type="button" class="foto-del" onclick="removerFoto(${i})" title="Remover foto">×</button>
    </div>`).join('');
}

function renderFotosDetail(c) {
  const el = document.getElementById('d-fotos');
  if (!el) return;
  const fotos = c.fotos || [];
  if (!fotos.length) { el.innerHTML = ''; return; }
  el.innerHTML = fotos.map(f => `
    <div class="foto-thumb">
      <img src="${f.url}" alt="Foto da cliente" loading="lazy">
    </div>`).join('');
}

function uploadFoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!currentUser) { toast('⚠️ Sessão expirada, entra novamente.', 'danger'); return; }
  if (!currentEditId) { toast('⚠️ Guarda a ficha antes de adicionar fotos.', 'danger'); return; }

  if (!file.type.startsWith('image/')) {
    toast('⚠️ Por favor seleciona um ficheiro de imagem.', 'danger');
    input.value = '';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast('⚠️ Imagem demasiado grande (máx. 8MB).', 'danger');
    input.value = '';
    return;
  }

  const statusEl = document.getElementById('foto-upload-status');
  statusEl.textContent = 'A enviar foto...';

  const path = `fotos/${currentUser.uid}/${currentEditId}/${Date.now()}_${file.name}`;
  const ref = fstorage.ref().child(path);

  ref.put(file).then(snap => snap.ref.getDownloadURL()).then(url => {
    _fotosAtual.push({ url, path, data: new Date().toISOString() });
    renderFotosGrid();
    statusEl.textContent = '';
    input.value = '';
    toast('✅ Foto adicionada!');
  }).catch(err => {
    console.error('Erro ao enviar foto:', err);
    statusEl.textContent = '';
    toast('⚠️ Erro ao enviar a foto.', 'danger');
  });
}

function removerFoto(i) {
  const foto = _fotosAtual[i];
  if (!foto) return;
  askConfirm('Remover esta foto?', () => {
    if (foto.path) {
      fstorage.ref().child(foto.path).delete().catch(err => console.warn('Erro ao remover do storage:', err));
    }
    _fotosAtual.splice(i, 1);
    renderFotosGrid();
    toast('🗑️ Foto removida.');
  }, { title: 'Remover foto', yesLabel: 'Sim, remover' });
}
