// ════════════════════════════════════════
//  NOTIFICAÇÕES
//  - Telegram Bot para a administradora
//  - Painel de notificações in-app
//  - Confirmação por e-mail (EmailJS)
// ════════════════════════════════════════

// ── CONFIGURAÇÃO (preenche antes de publicar) ──
// Para usar o Telegram:
//   1. Cria um bot: abre o Telegram, fala com @BotFather → /newbot → segue as instruções
//   2. Copia o token que o BotFather te dá e cola em TELEGRAM_TOKEN
//   3. Envia uma mensagem ao teu bot, depois acede a:
//      https://api.telegram.org/bot<TOKEN>/getUpdates
//      Copia o "id" que aparece em "chat" e cola em TELEGRAM_CHAT_ID
//
// Para usar o EmailJS (confirmação para a cliente):
//   1. Regista-te em https://www.emailjs.com (plano gratuito: 200 emails/mês)
//   2. Cria um serviço de e-mail e um template
//   3. Preenche EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY

const NOTIF_CONFIG = {
  telegram: {
    enabled: false,                     // muda para true depois de preencher
    token:   'SEU_TELEGRAM_BOT_TOKEN',
    chatId:  'SEU_TELEGRAM_CHAT_ID'
  },
  emailjs: {
    enabled: false,                     // muda para true depois de preencher
    serviceId:  'SEU_EMAILJS_SERVICE_ID',
    templateId: 'SEU_EMAILJS_TEMPLATE_ID',
    publicKey:  'SEU_EMAILJS_PUBLIC_KEY'
  }
};

// ── FIRESTORE NOTIFICATIONS COLLECTION ──
function _notifCol() {
  return fsdb.collection('users').doc(ADMIN_UID).collection('notificacoes');
}

// Guardar notificação no Firestore (lida pelo painel in-app)
async function _saveNotif(msg, tipo = 'info') {
  try {
    await _notifCol().add({
      mensagem: msg, tipo,
      lida: false,
      criadaEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    renderNotifBadge();
  } catch (e) { console.warn('Notif save error:', e); }
}

// Enviar mensagem pelo Telegram
async function _sendTelegram(texto) {
  if (!NOTIF_CONFIG.telegram.enabled) return;
  const { token, chatId } = NOTIF_CONFIG.telegram;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML' })
    });
  } catch (e) { console.warn('Telegram error:', e); }
}

// Enviar e-mail de confirmação via EmailJS
async function _sendEmail(toEmail, toName, data, hora, servico) {
  if (!NOTIF_CONFIG.emailjs.enabled) return;
  const { serviceId, templateId, publicKey } = NOTIF_CONFIG.emailjs;
  try {
    // EmailJS is loaded from CDN if enabled
    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS SDK não carregado. Adiciona o script no <head>.');
      return;
    }
    emailjs.init(publicKey);
    await emailjs.send(serviceId, templateId, {
      to_email: toEmail,
      to_name:  toName,
      data_consulta: data,
      hora_consulta: hora,
      servico: servico || 'A definir com a Luana'
    });
  } catch (e) { console.warn('EmailJS error:', e); }
}

// ── PONTO DE ENTRADA: nova marcação feita pela cliente ──
async function notificarNovoAgendamento(clienteNome, clienteEmail, data, hora, servico) {
  const dataFmt = data.split('-').reverse().join('/');
  const msg = `🍒 <b>Nova marcação!</b>\n\n<b>Cliente:</b> ${clienteNome}\n<b>Data:</b> ${dataFmt}\n<b>Hora:</b> ${hora}\n<b>Serviço:</b> ${servico || 'A definir'}`;

  // 1. Telegram para a administradora
  _sendTelegram(msg);

  // 2. Notificação in-app
  _saveNotif(`Nova marcação: ${clienteNome} — ${dataFmt} às ${hora}`, 'booking');

  // 3. E-mail de confirmação para a cliente
  if (clienteEmail) {
    _sendEmail(clienteEmail, clienteNome, dataFmt, hora, servico);
  }
}

// ── PAINEL IN-APP ──
function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open');
  if (!isOpen) renderNotifList();
}

// Close panel when clicking outside
document.addEventListener('click', e => {
  const panel = document.getElementById('notif-panel');
  const btn   = document.getElementById('nav-notifications-btn');
  if (panel && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
    panel.classList.remove('open');
  }
});

async function renderNotifList() {
  const el = document.getElementById('notif-list');
  if (!el) return;
  el.innerHTML = '<div class="notif-item" style="color:var(--text-lt)">A carregar...</div>';
  try {
    const snap = await _notifCol().orderBy('criadaEm','desc').limit(30).get();
    if (snap.empty) {
      el.innerHTML = '<div class="notif-item" style="color:var(--text-lt)">Sem notificações.</div>';
      return;
    }
    el.innerHTML = snap.docs.map(doc => {
      const d = doc.data();
      const ts = d.criadaEm?.toDate?.() || new Date();
      const ago = _timeAgo(ts);
      return `<div class="notif-item ${d.lida ? '' : 'unread'}" onclick="markRead('${doc.id}',this)">
        <div>${d.mensagem}</div>
        <div class="notif-time">${ago}</div>
      </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = '<div class="notif-item" style="color:var(--text-lt)">Erro ao carregar.</div>';
  }
}

async function markRead(id, el) {
  el.classList.remove('unread');
  try { await _notifCol().doc(id).update({ lida: true }); renderNotifBadge(); } catch {}
}

async function markAllRead() {
  try {
    const snap = await _notifCol().where('lida','==',false).get();
    const batch = fsdb.batch();
    snap.docs.forEach(d => batch.update(d.ref, { lida: true }));
    await batch.commit();
    renderNotifList();
    renderNotifBadge();
  } catch (e) { console.warn(e); }
}

async function renderNotifBadge() {
  const btn = document.getElementById('nav-notifications-btn');
  if (!btn) return;
  try {
    const snap = await _notifCol().where('lida','==',false).get();
    const count = snap.size;
    let badge = btn.querySelector('.notif-badge');
    if (count > 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'notif-badge'; btn.appendChild(badge); }
      badge.textContent = count > 9 ? '9+' : count;
      btn.setAttribute('aria-label', `Notificações (${count} não lidas)`);
    } else {
      if (badge) badge.remove();
      btn.setAttribute('aria-label', 'Notificações');
    }
  } catch {}
}

function _timeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff/3600)} h`;
  return `há ${Math.floor(diff/86400)} d`;
}
