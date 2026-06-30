// ════════════════════════════════════════
//  DATABASE
// ════════════════════════════════════════
const DB_KEY = 'luana_estetica_v3';

function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}
function saveDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
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
