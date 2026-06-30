// ════════════════════════════════════════
//  DATABASE — Firestore-backed, synced in-memory cache
// ════════════════════════════════════════
// loadDB()/saveDB() keep the same synchronous signature the rest of the
// app already uses. Behind the scenes, a local cache mirrors Firestore
// and every save is pushed up to the cloud, scoped to the logged-in user.

let _dbCache = [];
let _dbReady = false;
let _dbReadyCallbacks = [];

function _fichasCollection() {
  return fsdb.collection('users').doc(currentUser.uid).collection('fichas');
}

function loadDB() {
  return _dbCache;
}

function saveDB(data) {
  _dbCache = data;
  _syncToFirestore(data);
}

// Push the whole array to Firestore (one document per ficha, keyed by id)
let _syncTimer = null;
function _syncToFirestore(data) {
  if (!currentUser) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    const batch = fsdb.batch();
    const col = _fichasCollection();
    data.forEach(ficha => {
      batch.set(col.doc(ficha.id), ficha);
    });
    batch.commit().catch(err => {
      console.error('Erro ao guardar na nuvem:', err);
      toast('⚠️ Erro ao sincronizar. Verifica a tua ligação.', 'danger');
    });
  }, 250);
}

function _deleteFromFirestore(id) {
  if (!currentUser) return;
  _fichasCollection().doc(id).delete().catch(err => console.error('Erro ao excluir na nuvem:', err));
}

// Called once after login — loads all fichas from Firestore into the cache
function initApp() {
  _dbReady = false;
  _fichasCollection().get().then(snapshot => {
    _dbCache = snapshot.docs.map(d => d.data());
    _dbReady = true;
    _dbReadyCallbacks.forEach(cb => cb());
    _dbReadyCallbacks = [];
    renderCards();
  }).catch(err => {
    console.error('Erro ao carregar dados:', err);
    toast('⚠️ Erro ao carregar dados da nuvem.', 'danger');
  });
}

// ════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════
function calcAge(dob) {
  const b = new Date(dob), now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() ||
     (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
  return a;
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function getChecks(ids) {
  const r = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) r[id] = el.checked;
  });
  return r;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (type === 'danger' ? ' danger' : '') + ' show';
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ════════════════════════════════════════
//  SERVICE MAP
// ════════════════════════════════════════
function getServiceMap() {
  return {
    'sv-unhas-gel':   'Unhas Gel',
    'sv-unhas-acr':   'Acrílico',
    'sv-unhas-fibra': 'Fibra de Vidro',
    'sv-nail-art':    'Nail Art',
    'sv-manicure':    'Manicure/Pedicure',
    'sv-facial-limpeza': 'Limpeza de Pele',
    'sv-facial-peeling': 'Peeling',
    'sv-facial-hidrat':  'Hidratação Facial',
    'sv-facial-anti':    'Anti-aging',
    'sv-facial-micro':   'Microagulhamento',
    'sv-massagem-relax':  'Massagem Relaxante',
    'sv-massagem-modal':  'Massagem Modeladora',
    'sv-massagem-pedras': 'Pedras Quentes',
    'sv-massagem-bambu':  'Bambuterapia',
    'sv-corporal-drenagem': 'Drenagem Linfática',
    'sv-corporal-ultra':    'Ultrassom',
    'sv-corporal-radio':    'Radiofrequência',
    'sv-corporal-vac':      'Vacuoterapia',
    'sv-corporal-eletro':   'Eletroestimulação',
    'sv-depilacao':         'Depilação'
  };
}

function getSelectedServices(c) {
  return Object.entries(getServiceMap())
    .filter(([k]) => c.services && c.services[k])
    .map(([, v]) => v);
}

function getTipoPele(c) {
  const M = {
    'tipo-normal': 'Normal',
    'tipo-seca':   'Seca (Alipídica)',
    'tipo-oleosa': 'Oleosa (Lipídica)',
    'tipo-mista':  'Mista'
  };
  return Object.entries(M).filter(([k]) => c.tipoPele && c.tipoPele[k]).map(([, v]) => v);
}

function getEstadoPele(c) {
  const M = {
    'est-desidratada': 'Desidratada',
    'est-sensivel':    'Sensível',
    'est-acneica':     'Acneica',
    'est-asfixiada':   'Asfixiada',
    'est-envelhecida': 'Envelhecida',
    'est-desvitalizada': 'Desvitalizada',
    'est-hiperpig':    'Hiperpigmentada',
    'est-rosácea':     'Rosácea',
    'est-flacidez':    'Flacidez',
    'est-descam':      'Descamação'
  };
  return Object.entries(M).filter(([k]) => c.estadoPele && c.estadoPele[k]).map(([, v]) => v);
}

function getMultiTags(obj, map) {
  return Object.entries(map).filter(([k]) => obj && obj[k]).map(([, v]) => v);
}

const ESPESSURA_MAP = { 'espessura-espessa':'Espessa', 'espessura-media':'Média', 'espessura-fina':'Fina' };
const SENSIB_MAP = { 'sensib-rosto':'Rosto todo', 'sensib-macas':'Maçãs do rosto', 'sensib-outro':'Outra área', 'sensib-nao':'Não' };
const TIPO_UNHAS_MAP = { 'tipo-unhas-normais':'Normais', 'tipo-unhas-frageis':'Frágeis', 'tipo-unhas-descamam':'Descamam', 'tipo-unhas-quebradicas':'Quebradiças' };
const TIPO_PE_MAP = { 'tipo-pe-normal':'Pé normal', 'tipo-pe-plano':'Pé plano', 'tipo-pe-cavo':'Pé cavo' };
const OBJ_CORP_MAP = { 'obj-corp-relaxamento':'Relaxamento', 'obj-corp-emagrecimento':'Emagrecimento', 'obj-corp-modelagem':'Modelagem', 'obj-corp-drenagem':'Drenagem', 'obj-corp-dor':'Alívio de dores' };
const PRESSAO_MAP = { 'pressao-leve':'Leve', 'pressao-media':'Média', 'pressao-forte':'Forte' };
