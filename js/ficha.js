// ════════════════════════════════════════
//  FORM – NEW / RESET / SAVE
// ════════════════════════════════════════
function newFicha() {
  currentEditId = Date.now().toString();
  resetForm();
  document.getElementById('form-title').textContent = 'Nova Ficha de Cliente';
  document.getElementById('f-data-visita').value = new Date().toISOString().split('T')[0];
  showView('form');
}

function resetForm() {
  const ids = [
    'f-nome','f-nascimento','f-profissao','f-telefone','f-email','f-endereco',
    'f-med-efeito','f-alergias','f-cirurgia-det','f-protese-det',
    'f-oncologico-det','f-gestacao-det','f-outras-doencas','f-agua','f-aha-det',
    'f-fitzpatrick','f-proc-recente','f-produtos-pele','f-aconselh-facial','f-cosm-facial',
    'f-pele-maos','f-maquilhagem','f-aconselh-unhas','f-cosm-unhas','f-obs-unhas',
    'f-tensao','f-obs-corp','f-data-visita','f-indicacao','f-expectativas','f-obs-geral'
  ];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.querySelectorAll('#view-form input[type=checkbox]').forEach(cb => cb.checked = false);

  // reset all radio groups to "nao" where it exists, else first option
  const radioNames = [
    'sexo','medicacao','alergias','cirurgia','protese','oncologico','gestacao',
    'lentes','alimentacao','fuma','desporto','aha','hidrat',
    'filtro','acidos','fungo-unhas','roer','alergia-gel',
    'marcapasso','hernia','calor'
  ];
  radioNames.forEach(n => {
    const naoEl = document.querySelector(`input[name="${n}"][value="nao"]`);
    const firstEl = document.querySelector(`input[name="${n}"]`);
    if (naoEl) naoEl.checked = true;
    else if (firstEl) firstEl.checked = true;
  });

  setStar(0);
  const lgpd = document.getElementById('f-lgpd');
  if (lgpd) lgpd.checked = false;
  _fotosAtual = [];
  renderFotosGrid();
}

function setStar(v) {
  document.getElementById('f-avaliacao').value = v;
  document.querySelectorAll('.star-btn').forEach(b =>
    b.classList.toggle('active', parseInt(b.dataset.v) <= v)
  );
  const L = ['', 'Regular', 'Bom', 'Muito Bom', 'Ótimo', 'Excelente!'];
  document.getElementById('star-label').textContent = v > 0 ? L[v] : '';
}

function salvarFicha() {
  const nome = val('f-nome');
  if (!nome) { toast('⚠️ O nome da cliente é obrigatório!', 'danger'); return; }

  const telefone = val('f-telefone');
  if (telefone && !/^[0-9+()\s-]{7,20}$/.test(telefone)) {
    toast('⚠️ Telefone inválido. Usa apenas números, espaços, + ou -.', 'danger');
    return;
  }

  const email = val('f-email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('⚠️ E-mail inválido. Verifica o formato (ex: nome@exemplo.com).', 'danger');
    return;
  }

  const nascimento = val('f-nascimento');
  if (nascimento && new Date(nascimento) > new Date()) {
    toast('⚠️ A data de nascimento não pode estar no futuro.', 'danger');
    return;
  }

  const SVC  = Object.keys(getServiceMap());
  const PATS = ['pat-diabetes','pat-epilepsia','pat-tiroide','pat-hipertiroi','pat-hipotiroi',
    'pat-psoriase','pat-hepatite','pat-hiv','pat-asma','pat-esclerose','pat-tuberculose',
    'pat-varizes','pat-cancro','pat-cardiacos','pat-osseos','pat-herpes','pat-eczema','pat-autoimune'];
  const TIPOS   = ['tipo-normal','tipo-seca','tipo-oleosa','tipo-mista'];
  const ESTADOS = ['est-desidratada','est-sensivel','est-acneica','est-asfixiada','est-envelhecida',
    'est-desvitalizada','est-hiperpig','est-rosácea','est-flacidez','est-descam'];
  const LESOES  = ['les-hipocromia','les-hipercromia','les-melasma','les-efélides','les-comedoes',
    'les-papulas','les-pustulas','les-cicatriz','les-telangiect','les-verrugas','les-ceratose','les-milium'];
  const ESPESSURA = ['espessura-espessa','espessura-media','espessura-fina'];
  const SENSIB    = ['sensib-rosto','sensib-macas','sensib-outro','sensib-nao'];
  const TIPO_UNHAS = ['tipo-unhas-normais','tipo-unhas-frageis','tipo-unhas-descamam','tipo-unhas-quebradicas'];
  const TIPO_PE    = ['tipo-pe-normal','tipo-pe-plano','tipo-pe-cavo'];
  const OBJ_CORP   = ['obj-corp-relaxamento','obj-corp-emagrecimento','obj-corp-modelagem','obj-corp-drenagem','obj-corp-dor'];
  const PRESSAO    = ['pressao-leve','pressao-media','pressao-forte'];

  const db = loadDB();
  const existing = currentEditId ? db.find(x => x.id === currentEditId) : null;

  const ficha = {
    id: currentEditId || Date.now().toString(),
    nome, nascimento: val('f-nascimento'), sexo: getRadio('sexo'),
    profissao: val('f-profissao'), telefone: val('f-telefone'),
    email: val('f-email'), endereco: val('f-endereco'), indicacao: val('f-indicacao'),
    services: getChecks(SVC),
    // clínico
    medicacao: getRadio('medicacao'), medEfeito: val('f-med-efeito'),
    alergias: getRadio('alergias'), alergiasDet: val('f-alergias'),
    cirurgia: getRadio('cirurgia'), cirurgiaDet: val('f-cirurgia-det'),
    protese: getRadio('protese'), proteseDet: val('f-protese-det'),
    oncologico: getRadio('oncologico'), oncologicoDet: val('f-oncologico-det'),
    gestacao: getRadio('gestacao'), gestacaoDet: val('f-gestacao-det'),
    patologias: getChecks(PATS), outrasDoencas: val('f-outras-doencas'),
    lentes: getRadio('lentes'), alimentacao: getRadio('alimentacao'),
    fuma: getRadio('fuma'), desporto: getRadio('desporto'),
    agua: val('f-agua'), aha: getRadio('aha'), ahaDet: val('f-aha-det'),
    // pele
    tipoPele: getChecks(TIPOS), estadoPele: getChecks(ESTADOS), lesoes: getChecks(LESOES),
    hidrat: getRadio('hidrat'), espessura: getChecks(ESPESSURA), sensib: getChecks(SENSIB),
    fitzpatrick: val('f-fitzpatrick'), filtro: getRadio('filtro'), acidos: getRadio('acidos'),
    produtosPele: val('f-produtos-pele'), procRecente: val('f-proc-recente'),
    aconselhFacial: val('f-aconselh-facial'), cosmFacial: val('f-cosm-facial'),
    // unhas
    tipoUnhas: getChecks(TIPO_UNHAS), peleMaos: val('f-pele-maos'),
    tipoPe: getChecks(TIPO_PE), fungoUnhas: getRadio('fungo-unhas'),
    roerUnhas: getRadio('roer'), alergiaGel: getRadio('alergia-gel'),
    maquilhagem: val('f-maquilhagem'), aconselhUnhas: val('f-aconselh-unhas'),
    cosmUnhas: val('f-cosm-unhas'), obsUnhas: val('f-obs-unhas'),
    // corporal
    objCorporal: getChecks(OBJ_CORP), marcapasso: getRadio('marcapasso'),
    hernia: getRadio('hernia'), calorSens: getRadio('calor'),
    pressaoMassagem: getChecks(PRESSAO), tensao: val('f-tensao'), obsCorporal: val('f-obs-corp'),
    // avaliação
    dataVisita: val('f-data-visita'), expectativas: val('f-expectativas'),
    obsGeral: val('f-obs-geral'),
    avaliacao: parseInt(val('f-avaliacao')) || 0,
    lgpd: document.getElementById('f-lgpd')?.checked || false,
    planos: existing?.planos || [],
    fotos: _fotosAtual,
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    const idx = db.findIndex(x => x.id === currentEditId);
    if (idx > -1) db[idx] = ficha;
  } else {
    db.unshift(ficha);
  }
  saveDB(db);
  toast('✅ Ficha guardada com sucesso!');
  setTimeout(() => showDetail(ficha.id), 600);
}

// ════════════════════════════════════════
//  DETAIL VIEW
// ════════════════════════════════════════
function showDetail(id) {
  const db = loadDB();
  const c = db.find(x => x.id === id);
  if (!c) return;
  currentEditId = id;

  const initials = c.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('d-avatar').textContent = initials;
  document.getElementById('d-nome').textContent = c.nome;

  const age = c.nascimento ? calcAge(c.nascimento) + ' anos · ' : '';
  document.getElementById('d-meta').textContent =
    age + (c.telefone || '') + (c.email ? ' · ' + c.email : '');

  const svcs = getSelectedServices(c);
  document.getElementById('d-services').innerHTML =
    svcs.map(s => `<span class="tag">${s}</span>`).join('');

  renderFotosDetail(c);

  // Maps
  const PAT_MAP = {
    'pat-diabetes':'Diabetes','pat-epilepsia':'Epilepsia','pat-tiroide':'Tiroide',
    'pat-hipertiroi':'Hipertiroidismo','pat-hipotiroi':'Hipotiroidismo','pat-psoriase':'Psoríase',
    'pat-hepatite':'Hepatite','pat-hiv':'HIV','pat-asma':'Asma','pat-esclerose':'Esclerose múltipla',
    'pat-tuberculose':'Tuberculose','pat-varizes':'Varizes','pat-cancro':'Cancro',
    'pat-cardiacos':'Prob. Cardíacos','pat-osseos':'Prob. Ósseos','pat-herpes':'Herpes',
    'pat-eczema':'Eczema','pat-autoimune':'Autoimune'
  };
  const LES_MAP = {
    'les-hipocromia':'Hipocromia','les-hipercromia':'Hipercromia','les-melasma':'Melasma',
    'les-efélides':'Efélides','les-comedoes':'Comedões','les-papulas':'Pápulas',
    'les-pustulas':'Pústulas','les-cicatriz':'Cicatrizes','les-telangiect':'Telangectasias',
    'les-verrugas':'Verrugas','les-ceratose':'Ceratose','les-milium':'Milium'
  };

  const pats   = Object.entries(PAT_MAP).filter(([k]) => c.patologias && c.patologias[k]).map(([, v]) => v);
  const lesoes = Object.entries(LES_MAP).filter(([k]) => c.lesoes && c.lesoes[k]).map(([, v]) => v);
  const tipos  = getTipoPele(c);
  const estados = getEstadoPele(c);
  const espessuras = getMultiTags(c.espessura, ESPESSURA_MAP);
  const sensibs     = getMultiTags(c.sensib, SENSIB_MAP);
  const tipoUnhasTags = getMultiTags(c.tipoUnhas, TIPO_UNHAS_MAP);
  const tipoPeTags    = getMultiTags(c.tipoPe, TIPO_PE_MAP);
  const objCorpTags   = getMultiTags(c.objCorporal, OBJ_CORP_MAP);
  const pressaoTags   = getMultiTags(c.pressaoMassagem, PRESSAO_MAP);
  const stars  = c.avaliacao > 0 ? '⭐'.repeat(c.avaliacao) : '—';

  const row = (l, v) => v
    ? `<div class="info-row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`
    : '';
  const rowTags = (l, tags, cls = 'tag-moss') => tags && tags.length
    ? `<div class="info-row"><span class="lbl">${l}</span><span class="val"><div class="val-tags">${tags.map(t => `<span class="tag ${cls}">${t}</span>`).join('')}</div></span></div>`
    : '';
  const yn = (v, y = '✅ Sim', n = '❌ Não') =>
    v === 'sim' ? y : v === 'nao' ? n : v || '—';

  document.getElementById('detail-body').innerHTML = `
    <div class="info-block"><h4>👤 Identificação</h4>
      ${row('Nascimento', c.nascimento ? formatDate(c.nascimento) + (c.nascimento ? ' (' + calcAge(c.nascimento) + ' anos)' : '') : null)}
      ${row('Sexo', c.sexo)} ${row('Profissão', c.profissao)}
      ${row('Telefone', c.telefone)} ${row('E-mail', c.email)}
      ${row('Endereço', c.endereco)} ${row('Indicação', c.indicacao)}
      ${row('Primeira visita', c.dataVisita ? formatDate(c.dataVisita) : null)}
    </div>
    <div class="info-block"><h4>🩺 Dados Clínicos</h4>
      ${row('Medicação', yn(c.medicacao) + (c.medEfeito ? ' — ' + c.medEfeito : ''))}
      ${row('Alergias', yn(c.alergias) + (c.alergiasDet ? ' — ' + c.alergiasDet : ''))}
      ${row('Cirurgia', yn(c.cirurgia) + (c.cirurgiaDet ? ' — ' + c.cirurgiaDet : ''))}
      ${row('Prótese metálica', yn(c.protese) + (c.proteseDet ? ' — ' + c.proteseDet : ''))}
      ${row('Antec. oncológico', yn(c.oncologico) + (c.oncologicoDet ? ' — ' + c.oncologicoDet : ''))}
      ${row('Gestação', c.gestacao === 'sim' ? '✅ Sim' + (c.gestacaoDet ? ' — ' + c.gestacaoDet : '') : c.gestacao === 'amamentando' ? '🤱 Amamentando' : c.gestacao === 'nao' ? '❌ Não' : '—')}
      ${rowTags('Doenças', pats, 'tag-rosy')}
      ${row('Outras doenças', c.outrasDoencas)}
      ${row('Lentes de contacto', yn(c.lentes))}
      ${row('Alimentação equilibrada', yn(c.alimentacao))}
      ${row('Fumadora', c.fuma === 'ex' ? 'Ex-fumante' : yn(c.fuma))}
      ${row('Desporto', c.desporto)} ${row('Água por dia', c.agua)}
      ${row('AHAs / Acutane', yn(c.aha) + (c.ahaDet ? ' — ' + c.ahaDet : ''))}
    </div>
    <div class="info-block"><h4>🧖 Avaliação da Pele — Facial</h4>
      ${rowTags('Tipo de pele', tipos, 'tag-beige')}
      ${rowTags('Estado da pele', estados, 'tag-rosy')}
      ${rowTags('Lesões / Alterações', lesoes, 'tag-night')}
      ${row('Hidratação', c.hidrat)} ${rowTags('Espessura', espessuras, 'tag-beige')} ${rowTags('Sensibilidade', sensibs, 'tag-beige')}
      ${row('Fitzpatrick', c.fitzpatrick)} ${row('Filtro solar', c.filtro)}
      ${row('Ácidos em casa', c.acidos)} ${row('Produtos em uso', c.produtosPele)}
      ${row('Proc. recente', c.procRecente)} ${row('Aconselhamentos', c.aconselhFacial)}
      ${row('Cosméticos usados', c.cosmFacial)}
    </div>
    <div class="info-block"><h4>💅 Manicura & Pedicura</h4>
      ${rowTags('Tipo de unhas', tipoUnhasTags, 'tag-beige')} ${row('Pele das mãos/pés', c.peleMaos)}
      ${rowTags('Tipo de pé', tipoPeTags, 'tag-beige')} ${row('Fungo (histórico)', c.fungoUnhas)}
      ${row('Rói as unhas', yn(c.roerUnhas))} ${row('Alergia gel/acrílico', c.alergiaGel)}
      ${row('Maquilhagem habitual', c.maquilhagem)} ${row('Aconselhamentos', c.aconselhUnhas)}
      ${row('Cosméticos usados', c.cosmUnhas)} ${row('Observações', c.obsUnhas)}
    </div>
    <div class="info-block"><h4>🧴 Corporal & Massagem</h4>
      ${rowTags('Objetivo', objCorpTags, 'tag-beige')} ${row('Marcapasso/Implante', yn(c.marcapasso))}
      ${row('Hérnia de disco', yn(c.hernia))} ${row('Sensib. ao calor', yn(c.calorSens))}
      ${rowTags('Pressão preferida', pressaoTags, 'tag-beige')} ${row('Área de tensão', c.tensao)}
      ${row('Observações', c.obsCorporal)}
    </div>
    <div class="info-block"><h4>📝 Avaliação & Notas</h4>
      ${row('Expectativas', c.expectativas)} ${row('Notas internas', c.obsGeral)}
      ${row('Avaliação', stars)}
      ${row('Consentimento RGPD', c.lgpd ? '✅ Autorizado' : '❌ Não autorizado')}
      ${row('Última atualização', c.updatedAt ? new Date(c.updatedAt).toLocaleString('pt-PT') : null)}
    </div>`;

  // reset tabs to ficha
  document.querySelectorAll('.detail-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.getElementById('tab-ficha').classList.add('active');
  document.getElementById('tab-tratamento').classList.remove('active');

  showView('detail');
}

// ════════════════════════════════════════
//  EDIT FICHA
// ════════════════════════════════════════
function editarFicha() {
  const db = loadDB();
  const c = db.find(x => x.id === currentEditId);
  if (!c) return;

  document.getElementById('form-title').textContent = 'Editar Ficha — ' + c.nome;
  resetForm();
  currentEditId = c.id;
  _fotosAtual = c.fotos ? [...c.fotos] : [];
  renderFotosGrid();

  const sv = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
  sv('f-nome', c.nome); sv('f-nascimento', c.nascimento); sv('f-profissao', c.profissao);
  sv('f-telefone', c.telefone); sv('f-email', c.email); sv('f-endereco', c.endereco);
  sv('f-indicacao', c.indicacao); sv('f-med-efeito', c.medEfeito); sv('f-alergias', c.alergiasDet);
  sv('f-cirurgia-det', c.cirurgiaDet); sv('f-protese-det', c.proteseDet);
  sv('f-oncologico-det', c.oncologicoDet); sv('f-gestacao-det', c.gestacaoDet);
  sv('f-outras-doencas', c.outrasDoencas); sv('f-agua', c.agua); sv('f-aha-det', c.ahaDet);
  sv('f-fitzpatrick', c.fitzpatrick); sv('f-proc-recente', c.procRecente);
  sv('f-produtos-pele', c.produtosPele); sv('f-aconselh-facial', c.aconselhFacial);
  sv('f-cosm-facial', c.cosmFacial); sv('f-pele-maos', c.peleMaos);
  sv('f-maquilhagem', c.maquilhagem); sv('f-aconselh-unhas', c.aconselhUnhas);
  sv('f-cosm-unhas', c.cosmUnhas); sv('f-obs-unhas', c.obsUnhas);
  sv('f-tensao', c.tensao); sv('f-obs-corp', c.obsCorporal);
  sv('f-data-visita', c.dataVisita); sv('f-expectativas', c.expectativas);
  sv('f-obs-geral', c.obsGeral);

  // Checkboxes
  const allCb = [
    ...Object.keys(getServiceMap()),
    'pat-diabetes','pat-epilepsia','pat-tiroide','pat-hipertiroi','pat-hipotiroi','pat-psoriase',
    'pat-hepatite','pat-hiv','pat-asma','pat-esclerose','pat-tuberculose','pat-varizes',
    'pat-cancro','pat-cardiacos','pat-osseos','pat-herpes','pat-eczema','pat-autoimune',
    'tipo-normal','tipo-seca','tipo-oleosa','tipo-mista',
    'est-desidratada','est-sensivel','est-acneica','est-asfixiada','est-envelhecida',
    'est-desvitalizada','est-hiperpig','est-rosácea','est-flacidez','est-descam',
    'les-hipocromia','les-hipercromia','les-melasma','les-efélides','les-comedoes',
    'les-papulas','les-pustulas','les-cicatriz','les-telangiect','les-verrugas','les-ceratose','les-milium',
    'espessura-espessa','espessura-media','espessura-fina',
    'sensib-rosto','sensib-macas','sensib-outro','sensib-nao',
    'tipo-unhas-normais','tipo-unhas-frageis','tipo-unhas-descamam','tipo-unhas-quebradicas',
    'tipo-pe-normal','tipo-pe-plano','tipo-pe-cavo',
    'obj-corp-relaxamento','obj-corp-emagrecimento','obj-corp-modelagem','obj-corp-drenagem','obj-corp-dor',
    'pressao-leve','pressao-media','pressao-forte'
  ];
  allCb.forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const grp = id.startsWith('sv-') ? c.services
      : id.startsWith('pat-') ? c.patologias
      : id.startsWith('tipo-normal') || id.startsWith('tipo-seca') || id.startsWith('tipo-oleosa') || id.startsWith('tipo-mista') ? c.tipoPele
      : id.startsWith('est-') ? c.estadoPele
      : id.startsWith('les-') ? c.lesoes
      : id.startsWith('espessura-') ? c.espessura
      : id.startsWith('sensib-') ? c.sensib
      : id.startsWith('tipo-unhas-') ? c.tipoUnhas
      : id.startsWith('tipo-pe-') ? c.tipoPe
      : id.startsWith('obj-corp-') ? c.objCorporal
      : id.startsWith('pressao-') ? c.pressaoMassagem : null;
    if (grp) el.checked = !!grp[id];
  });

  // Radios
  const sr = (n, v) => { if (!v) return; const el = document.querySelector(`input[name="${n}"][value="${v}"]`); if (el) el.checked = true; };
  sr('sexo', c.sexo); sr('medicacao', c.medicacao); sr('alergias', c.alergias);
  sr('cirurgia', c.cirurgia); sr('protese', c.protese); sr('oncologico', c.oncologico);
  sr('gestacao', c.gestacao); sr('lentes', c.lentes); sr('alimentacao', c.alimentacao);
  sr('fuma', c.fuma); sr('desporto', c.desporto); sr('aha', c.aha);
  sr('hidrat', c.hidrat); sr('filtro', c.filtro); sr('acidos', c.acidos);
  sr('fungo-unhas', c.fungoUnhas); sr('roer', c.roerUnhas); sr('alergia-gel', c.alergiaGel);
  sr('marcapasso', c.marcapasso); sr('hernia', c.hernia); sr('calor', c.calorSens);

  setStar(c.avaliacao || 0);
  const lgpd = document.getElementById('f-lgpd');
  if (lgpd) lgpd.checked = !!c.lgpd;

  showView('form');
}

// ════════════════════════════════════════
//  DELETE
// ════════════════════════════════════════
function excluirFicha() {
  const db = loadDB();
  const c = db.find(x => x.id === currentEditId);
  if (!c) return;
  askConfirm(`Excluir a ficha de "${c.nome}"? Esta ação não pode ser desfeita.`, () => {
    _deleteFromFirestore(currentEditId);
    saveDB(db.filter(x => x.id !== currentEditId));
    toast('🗑️ Ficha excluída.');
    setTimeout(() => showView('search'), 500);
  }, { title: 'Excluir ficha', yesLabel: 'Sim, excluir' });
}
