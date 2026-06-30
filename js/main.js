/* ==========================================================================
   FLAVIO MODELS — main.js
   Comportamentos globais: menu mobile, marcação do link ativo
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  loadApprovedModelsIntoGlobal(); // NOVO: injeta modelos aprovados no admin antes de renderizar
  initMobileMenu();
  markActiveLink();
  renderFeaturedModels();
  renderEvents();
  initModelModal();
  initModelsPage();
  initSignupForm(); 
  initRevealAnimation();
  initNavbarScroll();
  initCounters();
});

/** Abre/fecha o painel de navegação mobile */
function initMobileMenu() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-nav-panel]');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fecha o menu ao clicar em um link
  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/** Adiciona aria-current/estado visual ao link da página atual */
function markActiveLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar__links a, .navbar__mobile-panel a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === current) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

/** Gera o HTML de um card de modelo clicável */
function buildModelCardHTML(model, options = {}) {
  const boldClass = options.bold ? ' model-card--bold' : '';
  return `
    <button class="model-card${boldClass}" type="button" data-model-id="${model.id}" aria-haspopup="dialog">
      <span class="model-card__image">
        <img src="${model.image}" alt="Foto de ${model.name} ${model.surname}" loading="lazy">
      </span>
      <span class="model-card__name">${model.name}</span>
      <span class="model-card__surname">${model.surname}</span>
    </button>
  `;
}

/** Renderiza os modelos em destaque (usado na Home, seção "Recentes") */
function renderFeaturedModels() {
  const grid = document.querySelector('[data-models-grid]');
  if (!grid || typeof MODELS === 'undefined') return;

  const limit = Number(grid.dataset.limit) || MODELS.length;
  const list = MODELS.filter((m) => m.featured).slice(0, limit);

  grid.innerHTML = list.map((m) => buildModelCardHTML(m)).join('');
}

/** Página Modelos: busca por nome + filtro por categoria (abas) */
function initModelsPage() {
  const grid = document.querySelector('[data-models-page-grid]');
  if (!grid || typeof MODELS === 'undefined') return;

  const searchInput = document.querySelector('[data-models-search]');
  const tabs = document.querySelectorAll('[data-models-tab]');
  const emptyState = document.querySelector('[data-models-empty]');

  let activeCategory = grid.dataset.category || 'Todos';
  let activeQuery = '';

  function renderList() {
    let list = MODELS;

    if (activeCategory !== 'Todos') {
      list = list.filter((m) => m.category === activeCategory);
    }
    if (activeQuery.trim()) {
      const q = activeQuery.trim().toLowerCase();
      list = list.filter((m) => `${m.name} ${m.surname}`.toLowerCase().includes(q));
    }

    grid.innerHTML = list.map((m) => buildModelCardHTML(m, { bold: true })).join('');

    if (emptyState) {
      emptyState.classList.toggle('is-visible', list.length === 0);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeQuery = e.target.value;
      renderList();
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeCategory = tab.dataset.modelsTab;
      renderList();
    });
  });

  renderList();
}

/** Renderiza a seção de eventos (Home) */
function renderEvents() {
  const track = document.querySelector('[data-events-track]');
  if (!track || typeof EVENTS === 'undefined') return;

  track.innerHTML = EVENTS.map((ev) => `
    <figure class="event-card">
      <img src="${ev.image}" alt="${ev.title}" loading="lazy">
      <figcaption>${ev.title}</figcaption>
    </figure>
  `).join('');
}

/** Configura o modal de ficha do modelo (abre ao clicar em qualquer .model-card) */
function initModelModal() {
  const modal = document.querySelector('[data-model-modal]');
  if (!modal || typeof MODELS === 'undefined') return;

  const dialogBox = modal.querySelector('[data-modal-box]');
  const closeBtn = modal.querySelector('[data-modal-close]');
  let lastFocused = null;

  function openModal(model) {
    const closeBtnHTML = closeBtn.outerHTML;
    dialogBox.innerHTML = closeBtnHTML + buildModelDetailHTML(model);
    // o botão foi recriado via innerHTML; reobtém a referência e o listener
    const newCloseBtn = modal.querySelector('[data-modal-close]');
    newCloseBtn.addEventListener('click', closeModal);
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    newCloseBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.model-card');
    if (card) {
      const model = MODELS.find((m) => m.id === card.dataset.modelId);
      if (model) openModal(model);
    }
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}

/** Gera o HTML da ficha completa do modelo, exibida dentro do modal */
function buildModelDetailHTML(model) {
  const rows = [
    ['País', model.country],
    ['Idade', `${model.age} anos`],
    ['Altura', model.height],
    ['Peso', model.weight],
    ['Medidas', model.measurements],
    ['Olhos', model.eyes],
    ['Cabelo', model.hair],
  ];

  return `
    <div class="model-detail">
      <div class="model-detail__image">
        <img src="${model.image}" alt="Foto de ${model.name} ${model.surname}">
      </div>
      <div class="model-detail__info">
        <p class="eyebrow">${model.category}</p>
        <h2 id="model-modal-title">${model.name} ${model.surname}</h2>
        <dl class="model-detail__list">
          ${rows.map(([label, value]) => `
            <div class="model-detail__row">
              <dt>${label}</dt>
              <dd>${value}</dd>
            </div>
          `).join('')}
        </dl>
        ${buildContactIconsHTML(model)}
      </div>
    </div>
  `;
}

/** Gera os ícones de contato (telefone/WhatsApp e Instagram) — só aparecem se o modelo tiver o dado preenchido */
function buildContactIconsHTML(model) {
  const items = [];

  if (model.phone) {
    const digits = model.phone.replace(/\D/g, '');
    items.push(`
      <a class="contact-icon" href="https://wa.me/${digits}" target="_blank" rel="noopener" aria-label="Falar com ${model.name} no WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.9-.4-1.8-1-2.6-1.8-.7-.7-1.3-1.5-1.7-2.4-.1-.3 0-.4.1-.6.2-.2.5-.5.6-.7.2-.2.2-.4.1-.6-.1-.2-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 1.8 2.8 4.4 3.9 2.2.9 2.6.7 3.1.6.5-.1 1.6-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.1-.4-.2z"/>
          <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.2L2 22l4.9-1.5C8.3 21.5 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3 .9.9-2.9-.2-.3C3.8 14.8 3.3 13.4 3.3 12c0-4.8 3.9-8.7 8.7-8.7s8.7 3.9 8.7 8.7-3.9 8.7-8.7 8.7z"/>
        </svg>
        <span>WhatsApp</span>
      </a>
    `);
  }

  if (model.instagram) {
    items.push(`
      <a class="contact-icon" href="https://instagram.com/${model.instagram}" target="_blank" rel="noopener" aria-label="Ver Instagram de ${model.name}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5"></rect>
          <circle cx="12" cy="12" r="4"></circle>
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"></circle>
        </svg>
        <span>@${model.instagram}</span>
      </a>
    `);
  }

  if (!items.length) return '';

  return `<div class="model-detail__contact">${items.join('')}</div>`;
}
function initRevealAnimation() {

    const elements = document.querySelectorAll(".reveal");

    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

                observer.unobserve(entry.target);

            }

        });

    }, {

        threshold: 0.15

    });

    elements.forEach(el => observer.observe(el));

}


/**
 * Navbar muda ao rolar
 */
function initNavbarScroll() {

    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    function updateNavbar() {

        if (window.scrollY > 80) {

            navbar.classList.add("scrolled");

        } else {

            navbar.classList.remove("scrolled");

        }

    }

    updateNavbar();

    window.addEventListener("scroll", updateNavbar);

}


/**
 * Contadores animados
 */
function initCounters() {

    const counters = document.querySelectorAll("[data-counter]");

    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {

        entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            const counter = entry.target;

            const target = Number(counter.dataset.counter);

            const duration = 1800;

            const start = performance.now();

            function animate(now) {

                const progress = Math.min((now - start) / duration, 1);

                const value = Math.floor(progress * target);

                counter.textContent = value + "+";

                if (progress < 1) {

                    requestAnimationFrame(animate);

                } else {

                    counter.textContent = target + "+";

                }

            }

            requestAnimationFrame(animate);

            observer.unobserve(counter);

        });

    }, {

        threshold: .5

    });

    counters.forEach(counter => observer.observe(counter));

}
/* ==========================================================================
   Página "Quero ser Modelo" — formulário de cadastro
   ========================================================================== */

/** Configura preview de upload de fotos + validação simples + envio (gravação local) */
function initSignupForm() {
  const form = document.querySelector('[data-signup-form]');
  if (!form) return;

  initUploadPreview(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isValid = validateSignupForm(form);
    if (!isValid) return;

    // NOVO: sem back-end ainda, mas agora persistimos de verdade no localStorage
    // (inclusive as fotos, convertidas para base64) para o admin avaliar depois.
    // TODO: quando o back-end existir, substituir por um fetch real enviando FormData(form).
    const photoInput = form.querySelector('[data-upload-input]');
    const photos = await getBase64Files(photoInput);
    saveSubmission(form, photos);

    showSignupSuccess(form);
  });
}

/** Preview das fotos selecionadas no input de upload múltiplo (acumula entre seleções, limite de 8) */
function initUploadPreview(form) {
  const input = form.querySelector('[data-upload-input]');
  const preview = form.querySelector('[data-upload-preview]');
  const countLabel = form.querySelector('[data-upload-count]');
  if (!input || !preview) return;

  // Mantemos nossa própria lista de arquivos selecionados, porque o input
  // de arquivo do navegador SUBSTITUI a seleção a cada nova escolha — sem
  // isso, ao escolher mais fotos depois, as anteriores desapareceriam.
  let selectedFiles = [];

  function isDuplicate(file) {
    return selectedFiles.some(
      (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
    );
  }

  function syncInputFiles() {
    const dt = new DataTransfer();
    selectedFiles.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  }

  function updateCountLabel() {
    if (!countLabel) return;
    countLabel.textContent = `${selectedFiles.length} foto(s) selecionada(s) — mínimo 3, máximo 8.`;
  }

  function renderPreview() {
    preview.innerHTML = '';

    selectedFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);

      const item = document.createElement('div');
      item.className = 'upload-preview__item';
      item.innerHTML = `
        <img src="${url}" alt="Pré-visualização da foto ${index + 1}">
        <button type="button" class="upload-preview__remove" aria-label="Remover foto ${index + 1}">&times;</button>
      `;
      preview.appendChild(item);

      item.querySelector('.upload-preview__remove').addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        syncInputFiles();
        renderPreview();
        updateCountLabel();
      });
    });

    updateCountLabel();
  }

  input.addEventListener('change', () => {
    const newFiles = Array.from(input.files || []).filter((f) => f.type.startsWith('image/'));

    newFiles.forEach((file) => {
      if (selectedFiles.length >= 8) return;
      if (!isDuplicate(file)) selectedFiles.push(file);
    });

    syncInputFiles();
    renderPreview();
  });
}

/** Validação simples dos campos obrigatórios do formulário de cadastro (inclui fotos: 3 a 8) */
function validateSignupForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');
  const alertBox = form.querySelector('[data-form-alert]');

  requiredFields.forEach((field) => {
    const wrapper = field.closest('.form-field');
    if (!wrapper) return;

    const valueOk = field.value.trim() !== '';
    wrapper.classList.toggle('form-field--error', !valueOk);
    if (!valueOk) isValid = false;
  });

  const photoInput = form.querySelector('[data-upload-input]');
  const uploadField = form.querySelector('[data-upload-field]');
  const photoError = form.querySelector('[data-upload-error]');
  if (photoInput) {
    const count = photoInput.files ? photoInput.files.length : 0;
    const photosOk = count >= 3 && count <= 8;
    if (uploadField) uploadField.classList.toggle('upload-field--error', !photosOk);
    if (photoError) photoError.classList.toggle('is-visible', !photosOk);
    if (!photosOk) isValid = false;
  }

  if (alertBox) {
    alertBox.classList.toggle('is-visible', !isValid);
  }

  if (!isValid) {
    const firstError = form.querySelector('.form-field--error input, .form-field--error select');
    if (firstError) {
      firstError.focus();
    } else if (alertBox) {
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return isValid;
}

/** Esconde o formulário e exibe a mensagem de sucesso */
function showSignupSuccess(form) {
  const success = document.querySelector('[data-form-success]');
  form.style.display = 'none';
  if (success) {
    success.classList.add('is-visible');
    success.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ==========================================================================
   NOVO — Persistência de cadastros (localStorage) + avaliação no admin
   Usado por: quero-ser-modelo.html (gravação) e admin.html (leitura/aprovação)
   ========================================================================== */

const SUBMISSIONS_KEY = 'flavioSubmissions';
const APPROVED_MODELS_KEY = 'flavioApprovedModels';

/** Converte uma lista de arquivos (input file) em base64, para poder salvar no localStorage */
function getBase64Files(input) {
  if (!input || !input.files || !input.files.length) return Promise.resolve([]);
  const files = Array.from(input.files).filter((f) => f.type.startsWith('image/'));
  return Promise.all(files.map(fileToBase64));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Lê os campos do formulário de cadastro e grava como um novo cadastro pendente */
function saveSubmission(form, photos) {
  const data = new FormData(form);
  const generoParaCategoria = { Feminino: 'Mulheres', Masculino: 'Homens', Teen: 'Teen' };
  const genero = data.get('genero') || '';

  const submission = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    status: 'pendente', // pendente | aprovado | rejeitado
    createdAt: new Date().toISOString(),
    nome: (data.get('nome') || '').trim(),
    responsavel: (data.get('responsavel') || '').trim(),
    email: (data.get('email') || '').trim(),
    telefone: (data.get('telefone') || '').trim(),
    idade: data.get('idade') || '',
    altura: data.get('altura') || '',
    peso: data.get('peso') || '',
    torax: data.get('torax') || '',
    cintura: data.get('cintura') || '',
    quadril: data.get('quadril') || '',
    genero,
    category: generoParaCategoria[genero] || 'Mulheres',
    instagram: (data.get('instagram') || '').trim(),
    tiktok: (data.get('tiktok') || '').trim(),
    photos: photos || [],
  };

  const all = getSubmissions();
  all.push(submission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(all));
}

/** Retorna todos os cadastros salvos (qualquer status) */
function getSubmissions() {
  try {
    return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY)) || [];
  } catch {
    return [];
  }
}

/** Atualiza o status de um cadastro (pendente/aprovado/rejeitado) */
function updateSubmissionStatus(id, status) {
  const all = getSubmissions();
  const updated = all.map((s) => (s.id === id ? { ...s, status } : s));
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updated));
  return updated.find((s) => s.id === id);
}

/** Aprova um cadastro: marca como aprovado e gera um "modelo" a partir dele.
 *  coverIndex: índice da foto escolhida como capa (padrão: a primeira). */
function approveSubmission(id, coverIndex = 0) {
  const submission = updateSubmissionStatus(id, 'aprovado');
  if (!submission) return;

  const approved = getApprovedModels();
  if (!approved.some((m) => m.id === submission.id)) {
    approved.push(submissionToModel(submission, coverIndex));
    try {
      localStorage.setItem(APPROVED_MODELS_KEY, JSON.stringify(approved));
    } catch (err) {
      console.error('Não foi possível salvar o modelo aprovado (localStorage cheio?):', err);
      alert('Não foi possível salvar este modelo: o armazenamento local do navegador está cheio. Tente limpar cadastros antigos ou usar fotos menores.');
    }
  }
}

/** Rejeita um cadastro */
function rejectSubmission(id) {
  updateSubmissionStatus(id, 'rejeitado');
}

/** Retorna os modelos aprovados (gerados a partir de cadastros) */
function getApprovedModels() {
  try {
    return JSON.parse(localStorage.getItem(APPROVED_MODELS_KEY)) || [];
  } catch {
    return [];
  }
}

/** Converte um cadastro aprovado no mesmo formato usado em MODELS (js/models.js).
 *  coverIndex: qual foto do array `photos` vira a imagem principal do card. */
function submissionToModel(s, coverIndex = 0) {
  const parts = (s.nome || '').trim().split(' ');
  const name = parts[0] || s.nome || 'Modelo';
  const surname = parts.slice(1).join(' ') || '-';
  const digits = (s.telefone || '').replace(/\D/g, '');
  const photos = s.photos || [];
  const cover = photos[coverIndex] || photos[0] || 'imagens/imagem1.png';

  return {
    id: s.id,
    name,
    surname,
    category: s.category,
    country: 'Brasil',
    age: s.idade || '-',
    height: s.altura ? (Number(s.altura) / 100).toFixed(2).replace('.', ',') + ' m' : '-',
    weight: s.peso ? `${s.peso} kg` : '-',
    measurements: `${s.torax || '-'}-${s.cintura || '-'}-${s.quadril || '-'}`,
    eyes: '-',
    hair: '-',
    phone: digits ? (digits.startsWith('55') ? digits : '55' + digits) : '',
    instagram: (s.instagram || '').replace('@', ''),
    image: cover,
    featured: false,
  };
}

/** Injeta os modelos aprovados dentro do array global MODELS, antes de renderizar a página */
function loadApprovedModelsIntoGlobal() {
  if (typeof MODELS === 'undefined') return;
  const approved = getApprovedModels();
  approved.forEach((m) => {
    if (!MODELS.some((existing) => existing.id === m.id)) {
      MODELS.push(m);
    }
  });
}
