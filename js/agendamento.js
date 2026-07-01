// ════════════════════════════════════════
//  AGENDAMENTO — marcação de consultas
//  Admin: gerir horários disponíveis
//  Cliente: escolher data + hora + confirmar
// ════════════════════════════════════════

// ── STATE ──
let _bookingState = {
  adminUid: null, fichaId: null, clienteNome: null, clienteEmail: null,
  year: new Date().getFullYear(), month: new Date().getMonth(),
  selectedDate: null, selectedSlot: null,
  slots: {}, bookedSlots: {}
};

// ── ADMIN: SLOT MANAGER ──
const DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const DIAS_ISO = ['mon','tue','wed','thu','fri','sat','sun'];
let _adminSlots = {};

async function abrirGerirHorarios() {
  await _loadAdminSlots();
  renderSlotManager();
  document.getElementById('modal-slots').classList.add('open');
}

async function _loadAdminSlots() {
  try {
    const doc = await fsdb.collection('users').doc(ADMIN_UID).collection('config').doc('slots').get();
    _adminSlots = doc.exists ? (doc.data().slots || {}) : {};
  } catch { _adminSlots = {}; }
}

function renderSlotManager() {
  const el = document.getElementById('slot-manager');
  if (!el) return;
  el.innerHTML = DIAS.map((dia, i) => {
    const key = DIAS_ISO[i];
    const times = _adminSlots[key] || [];
    return `<div class="slot-day-row">
      <span class="slot-day-label">${dia}</span>
      <div id="slots-${key}" style="display:flex;gap:0.4rem;flex-wrap:wrap">
        ${times.map(t => `<span class="slot-tag">${t}<span class="rm-slot" onclick="rmSlot('${key}','${t}')">×</span></span>`).join('')}
      </div>
      <input class="add-slot-input" type="text" id="new-slot-${key}" placeholder="HH:MM"
             maxlength="5" onkeydown="if(event.key==='Enter')addSlot('${key}')">
      <button class="btn btn-outline btn-sm" onclick="addSlot('${key}')">+</button>
    </div>`;
  }).join('');
}

function addSlot(day) {
  const inp = document.getElementById(`new-slot-${day}`);
  const val = inp.value.trim();
  if (!/^\d{2}:\d{2}$/.test(val)) { inp.style.borderColor = '#e53e3e'; return; }
  inp.style.borderColor = '';
  if (!_adminSlots[day]) _adminSlots[day] = [];
  if (!_adminSlots[day].includes(val)) _adminSlots[day].push(val);
  _adminSlots[day].sort();
  inp.value = '';
  renderSlotManager();
}

function rmSlot(day, time) {
  if (!_adminSlots[day]) return;
  _adminSlots[day] = _adminSlots[day].filter(t => t !== time);
  renderSlotManager();
}

async function salvarSlots() {
  try {
    await fsdb.collection('users').doc(ADMIN_UID).collection('config').doc('slots').set({ slots: _adminSlots });
    fecharModal('modal-slots');
    toast('✅ Horários guardados!');
  } catch { toast('⚠️ Erro ao guardar horários.', 'danger'); }
}

// ── CLIENT: BOOKING CALENDAR ──
async function initBookingCalendar(adminUid, fichaId, clienteNome, clienteEmail) {
  _bookingState.adminUid = adminUid;
  _bookingState.fichaId  = fichaId;
  _bookingState.clienteNome  = clienteNome;
  _bookingState.clienteEmail = clienteEmail;
  await _loadSlotsForClient(adminUid);
  await _loadBookedSlots(adminUid);
  _renderCalendar();
}

async function _loadSlotsForClient(adminUid) {
  try {
    const doc = await fsdb.collection('users').doc(adminUid).collection('config').doc('slots').get();
    _bookingState.slots = doc.exists ? (doc.data().slots || {}) : {};
  } catch { _bookingState.slots = {}; }
}

async function _loadBookedSlots(adminUid) {
  try {
    const snap = await fsdb.collection('users').doc(adminUid)
      .collection('marcacoes').where('estado','!=','cancelada').get();
    const booked = {};
    snap.docs.forEach(d => {
      const { data, hora } = d.data();
      if (!booked[data]) booked[data] = [];
      booked[data].push(hora);
    });
    _bookingState.bookedSlots = booked;
  } catch { _bookingState.bookedSlots = {}; }
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WD_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];

function _dayHasSlots(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  const key = WD_KEYS[d.getDay()];
  const avail = _bookingState.slots[key] || [];
  const booked = _bookingState.bookedSlots[isoDate] || [];
  return avail.some(t => !booked.includes(t));
}

function _renderCalendar() {
  const el = document.getElementById('booking-container');
  if (!el) return;
  const { year, month, selectedDate } = _bookingState;
  const today = new Date(); today.setHours(0,0,0,0);
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startWd  = (firstDay.getDay() + 6) % 7; // Monday=0

  let days = '<div class="cal-weekdays">' +
    ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => `<span class="cal-wd">${d}</span>`).join('') +
    '</div><div class="booking-calendar">';

  // empty cells before first day
  for (let i = 0; i < startWd; i++) days += '<span class="cal-day empty" aria-hidden="true"></span>';

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date   = new Date(year, month, d);
    const isoStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isSel  = isoStr === selectedDate;
    const hasSlots = !isPast && _dayHasSlots(isoStr);
    let cls = 'cal-day';
    if (isPast) cls += ' past';
    else if (isSel) cls += ' selected';
    else if (hasSlots) cls += ' available has-slots';
    else cls += ' unavailable';
    if (isToday && !isPast) cls += ' today';
    days += `<button class="${cls}" ${isPast||!hasSlots?'disabled aria-disabled="true"':''}
               aria-label="${d} de ${MESES[month]}"
               onclick="selectBookingDate('${isoStr}')">${d}</button>`;
  }
  days += '</div>';

  el.innerHTML = `
    <div class="cal-header">
      <button class="btn btn-outline btn-sm" onclick="changeMonth(-1)" aria-label="Mês anterior">‹</button>
      <strong aria-live="polite">${MESES[month]} ${year}</strong>
      <button class="btn btn-outline btn-sm" onclick="changeMonth(1)" aria-label="Próximo mês">›</button>
    </div>
    ${days}
    <div id="booking-slots"></div>`;
}

function changeMonth(dir) {
  let { year, month } = _bookingState;
  month += dir;
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  _bookingState.year = year; _bookingState.month = month;
  _bookingState.selectedDate = null; _bookingState.selectedSlot = null;
  _renderCalendar();
}

function selectBookingDate(isoDate) {
  _bookingState.selectedDate = isoDate;
  _bookingState.selectedSlot = null;
  _renderCalendar();
  _renderTimeSlots(isoDate);
}

function _renderTimeSlots(isoDate) {
  const el = document.getElementById('booking-slots');
  if (!el) return;
  const d = new Date(isoDate + 'T12:00:00');
  const key = WD_KEYS[d.getDay()];
  const avail  = _bookingState.slots[key] || [];
  const booked = _bookingState.bookedSlots[isoDate] || [];

  if (!avail.length) {
    el.innerHTML = '<p class="cp-hint" style="margin-top:0.8rem">Sem horários disponíveis neste dia.</p>';
    return;
  }

  el.innerHTML = `<p style="font-size:0.82rem;font-weight:600;margin:0.8rem 0 0.4rem;color:var(--c-text)">Horários disponíveis:</p>
    <div class="time-slots" role="group" aria-label="Horários disponíveis">
      ${avail.map(t => {
        const isBooked = booked.includes(t);
        return `<button class="time-slot${isBooked?' booked':''}" ${isBooked?'disabled aria-disabled="true"':''}
          aria-label="${isBooked?'Indisponível: ':''} ${t}"
          onclick="selectSlot('${t}')">${t}</button>`;
      }).join('')}
    </div>`;
}

function selectSlot(hora) {
  _bookingState.selectedSlot = hora;
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  // Show confirm modal
  const { selectedDate } = _bookingState;
  const [y,m,d] = selectedDate.split('-');
  const dateFmt = `${d}/${m}/${y}`;
  const dia = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT',{weekday:'long'});
  document.getElementById('booking-confirm-details').innerHTML =
    `📅 <strong>${dia}, ${dateFmt}</strong> às <strong>${hora}</strong>`;
  document.getElementById('booking-servico').value = '';
  document.getElementById('modal-booking-confirm').classList.add('open');
}

async function confirmarAgendamento() {
  const { adminUid, fichaId, clienteNome, clienteEmail, selectedDate, selectedSlot } = _bookingState;
  if (!selectedDate || !selectedSlot) return;
  const servico = document.getElementById('booking-servico').value.trim();

  try {
    // Double-check slot still free
    const existing = await fsdb.collection('users').doc(adminUid)
      .collection('marcacoes')
      .where('data','==',selectedDate).where('hora','==',selectedSlot)
      .where('estado','!=','cancelada').get();

    if (!existing.empty) {
      fecharModal('modal-booking-confirm');
      toast('⚠️ Este horário foi entretanto ocupado. Escolhe outro.', 'danger');
      await _loadBookedSlots(adminUid);
      _renderTimeSlots(selectedDate);
      return;
    }

    await fsdb.collection('users').doc(adminUid).collection('marcacoes').add({
      fichaId, clienteNome, clienteEmail: clienteEmail || '',
      data: selectedDate, hora: selectedSlot, servico,
      estado: 'confirmada',
      criadaEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Notify admin
    notificarNovoAgendamento(clienteNome, clienteEmail, selectedDate, selectedSlot, servico);

    // Update local booked list
    if (!_bookingState.bookedSlots[selectedDate]) _bookingState.bookedSlots[selectedDate] = [];
    _bookingState.bookedSlots[selectedDate].push(selectedSlot);

    fecharModal('modal-booking-confirm');
    toast('✅ Marcação confirmada!');
    _bookingState.selectedDate = null; _bookingState.selectedSlot = null;
    _renderCalendar();

    // Refresh agenda display
    renderAgendaCliente(_cpFicha);
  } catch (e) {
    console.error('Erro ao confirmar marcação:', e);
    toast('⚠️ Erro ao confirmar. Tenta novamente.', 'danger');
  }
}

// ── ADMIN: AGENDA WITH BOOKINGS FROM FIRESTORE ──
async function renderAgendaAdmin() {
  const el = document.getElementById('agenda-list');
  if (!el) return;

  const db = loadDB();
  const today = new Date().toISOString().split('T')[0];
  const items = [];

  // Local agendamentos from client records
  db.forEach(c => {
    (c.planos || []).forEach(p => (p.sessoes || []).forEach(s => {
      if (s.proxima && s.proxima >= today)
        items.push({ clienteId: c.id, clienteNome: c.nome, label: p.nome, data: s.proxima, hora: '' });
    }));
    (c.agendamentos || []).forEach(a => {
      if (a.data && a.data >= today)
        items.push({ clienteId: c.id, clienteNome: c.nome, label: a.nota || 'Compromisso', data: a.data, hora: '' });
    });
  });

  // Firestore marcações (from client portal)
  try {
    const snap = await fsdb.collection('users').doc(ADMIN_UID).collection('marcacoes')
      .where('data','>=',today).where('estado','==','confirmada').orderBy('data').orderBy('hora').limit(30).get();
    snap.docs.forEach(d => {
      const md = d.data();
      items.push({ clienteId: null, clienteNome: md.clienteNome, label: md.servico || 'Marcação', data: md.data, hora: md.hora, marcacaoId: d.id });
    });
  } catch {}

  items.sort((a,b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const proximos = items.slice(0, 10);

  if (!proximos.length) {
    el.innerHTML = `<div class="agenda-empty">Sem sessões agendadas para os próximos dias.</div>`;
    return;
  }

  el.innerHTML = proximos.map(it => {
    const d = new Date(it.data + 'T00:00:00');
    const isToday = it.data === today;
    return `<div class="agenda-item ${isToday?'is-today':''}" ${it.clienteId?`onclick="showDetail('${it.clienteId}')"`:''} role="listitem">
      <div class="agenda-date">
        <span class="agenda-day">${d.getDate().toString().padStart(2,'0')}</span>
        <span class="agenda-month">${d.toLocaleDateString('pt-PT',{month:'short'})}</span>
      </div>
      <div class="agenda-info">
        <div class="agenda-cliente">${it.clienteNome}</div>
        <div class="agenda-plano">${it.hora ? it.hora + ' · ' : ''}${it.label}</div>
      </div>
      <div class="agenda-badge">${isToday?'Hoje':d.toLocaleDateString('pt-PT',{weekday:'short'})}</div>
    </div>`;
  }).join('');
}

// Override renderAgenda to use the enhanced version when logged in as admin
window.renderAgenda = function() {
  if (userRole === 'admin') renderAgendaAdmin();
};
