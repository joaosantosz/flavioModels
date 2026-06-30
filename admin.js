/* ==========================================================================
   FLAVIO MODELS — admin.js
   Lógica exclusiva da página admin.html: login simples (sem back-end) e
   avaliação (aprovar/rejeitar) dos cadastros enviados em quero-ser-modelo.html.
   Depende das funções getSubmissions/approveSubmission/rejectSubmission
   definidas em js/main.js — carregar admin.js DEPOIS de main.js.
   ========================================================================== */

const ADMIN_PASSWORD = 'flavio2026'; // senha fixa, só para fins didáticos (trabalho de faculdade)
const ADMIN_SESSION_KEY = 'flavioAdminAuth';

// Guarda qual foto (índice) está selecionada como capa para cada cadastro pendente
const selectedCovers = {};

document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  initAdminActions();
  initPhotoLightbox();
});

function initAdminAuth() {
  const loginBox = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  const form = document.querySelector('[data-admin-login-form]');
  const errorMsg = document.querySelector('[data-admin-login-error]');
  const logoutBtn = document.querySelector('[data-admin-logout]');

  if (!loginBox || !dashboard) return;

  function showDashboard() {
    loginBox.style.display = 'none';
    dashboard.style.display = 'block';
    renderPendingSubmissions();
  }

  function showLogin() {
    dashboard.style.display = 'none';
    loginBox.style.display = 'block';
  }

  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
    showDashboard();
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const passwordField = form.querySelector('[data-admin-password]');
      const value = passwordField ? passwordField.value : '';

      if (value === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
        if (errorMsg) errorMsg.classList.remove('is-visible');
        if (passwordField) passwordField.value = '';
        showDashboard();
      } else {
        if (errorMsg) errorMsg.classList.add('is-visible');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      showLogin();
    });
  }
}

/** Liga os cliques em "Aprovar" / "Rejeitar" e na escolha da foto de capa */
function initAdminActions() {
  document.addEventListener('click', (e) => {
    const approveBtn = e.target.closest('[data-approve]');
    const rejectBtn = e.target.closest('[data-reject]');
    const coverBtn = e.target.closest('[data-cover-select]');

    if (coverBtn) {
      const subId = coverBtn.dataset.subId;
      const index = Number(coverBtn.dataset.coverSelect);
      selectedCovers[subId] = index;
      renderPendingSubmissions();
      return;
    }

    if (approveBtn) {
      const subId = approveBtn.dataset.approve;
      const coverIndex = selectedCovers[subId] || 0;
      approveSubmission(subId, coverIndex);
      delete selectedCovers[subId];
      // Recarrega a página: além da lista de pendentes, isso também
      // atualiza o grid de "Modelos da agência" com o novo modelo aprovado.
      location.reload();
    }

    if (rejectBtn) {
      delete selectedCovers[rejectBtn.dataset.reject];
      rejectSubmission(rejectBtn.dataset.reject);
      location.reload();
    }
  });
}

/** Renderiza a lista de cadastros com status "pendente" */
function renderPendingSubmissions() {
  const grid = document.querySelector('[data-pending-grid]');
  const empty = document.querySelector('[data-pending-empty]');
  if (!grid || typeof getSubmissions === 'undefined') return;

  const pending = getSubmissions().filter((s) => s.status === 'pendente');

  grid.innerHTML = pending.map(buildSubmissionCardHTML).join('');

  if (empty) {
    empty.style.display = pending.length ? 'none' : 'block';
  }
}

/** HTML de um card de cadastro pendente, com fotos maiores, lupa para ampliar e escolha de capa */
function buildSubmissionCardHTML(s) {
  const coverIndex = selectedCovers[s.id] || 0;

  const photosHTML = (s.photos || [])
    .map((p, i) => `
      <div class="submission-photo${i === coverIndex ? ' is-cover' : ''}">
        <button type="button"
          class="submission-photo__select"
          data-cover-select="${i}"
          data-sub-id="${s.id}"
          aria-pressed="${i === coverIndex}"
          title="Usar como foto de capa">
          <img src="${p}" alt="Foto ${i + 1} enviada por ${s.nome}" loading="lazy">
          ${i === coverIndex ? '<span class="submission-photo__badge">Capa</span>' : ''}
        </button>
        <button type="button" class="submission-photo__zoom" data-photo-zoom="${p}" aria-label="Ver foto ${i + 1} ampliada" title="Ver ampliada">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    `)
    .join('');

  return `
    <div class="submission-card">
      <div class="submission-card__photos">
        ${photosHTML || '<p class="submission-card__no-photo">Sem fotos enviadas</p>'}
      </div>
      ${(s.photos || []).length ? '<p class="submission-card__hint">Clique na lupa para ver a foto em tamanho grande. Clique na foto para defini-la como capa.</p>' : ''}
      <div class="submission-card__info">
        <h3>${s.nome || 'Sem nome'}</h3>
        <p>${s.category} · ${s.idade || '-'} anos · ${s.altura || '-'} cm · ${s.peso || '-'} kg</p>
        <p>Medidas: ${s.torax || '-'}-${s.cintura || '-'}-${s.quadril || '-'}</p>
        <p>${s.email || '-'} · ${s.telefone || '-'}</p>
        <p>${s.instagram ? '@' + s.instagram : '—'} ${s.tiktok ? ' · TikTok: ' + s.tiktok : ''}</p>
      </div>
      <div class="submission-card__actions">
        <button class="btn btn--primary" type="button" data-approve="${s.id}">Aprovar</button>
        <button class="btn btn--outline" type="button" data-reject="${s.id}">Rejeitar</button>
      </div>
    </div>
  `;
}

/** Lightbox simples: abre a foto clicada em tamanho grande, fecha com X, clique fora ou Esc */
function initPhotoLightbox() {
  const lightbox = document.querySelector('[data-photo-lightbox]');
  const img = document.querySelector('[data-photo-lightbox-img]');
  const closeBtn = document.querySelector('[data-photo-lightbox-close]');
  if (!lightbox || !img) return;

  function open(src) {
    img.src = src;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    img.src = '';
  }

  document.addEventListener('click', (e) => {
    const zoomBtn = e.target.closest('[data-photo-zoom]');
    if (zoomBtn) open(zoomBtn.dataset.photoZoom);
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}