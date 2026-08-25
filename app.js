(function () {
  'use strict';

  // ---------- State ----------
  let currentPrompt = null;
  let stream = null;
  let timerInterval = null;
  let timerTotal = 0;
  let timerRemaining = 0;
  let lastCapturedDataUrl = null;

  // ---------- Helpers: storage ----------
  function loadCustomPrompts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.customPrompts) || '[]');
    } catch (e) { return []; }
  }
  function saveCustomPrompts(list) {
    localStorage.setItem(STORAGE_KEYS.customPrompts, JSON.stringify(list));
  }
  function loadGallery() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.gallery) || '[]');
    } catch (e) { return []; }
  }
  function saveGallery(list) {
    try {
      localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(list));
    } catch (e) {
      alert("Stockage local plein : supprimez quelques photos de la galerie pour continuer.");
    }
  }
  function loadRefImages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.refImages) || '{}');
    } catch (e) { return {}; }
  }
  function saveRefImages(map) {
    try {
      localStorage.setItem(STORAGE_KEYS.refImages, JSON.stringify(map));
    } catch (e) {
      alert("Stockage local plein : supprimez quelques photos de référence pour continuer.");
    }
  }
  function setRefImage(promptId, src) {
    const map = loadRefImages();
    map[promptId] = src;
    saveRefImages(map);
  }
  function removeRefImage(promptId) {
    const map = loadRefImages();
    delete map[promptId];
    saveRefImages(map);
  }

  function getAllPrompts() {
    return BUILTIN_PROMPTS.concat(loadCustomPrompts());
  }

  // Reads an image pasted via Ctrl+V from a paste event; returns a Promise<dataUrl> or null.
  function readImageFromClipboard(e) {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (!file) continue;
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
      }
    }
    return null;
  }

  // ---------- Tabs ----------
  const tabButtons = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.view');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + btn.dataset.view).classList.add('active');
      if (btn.dataset.view === 'gallery') renderGallery();
      if (btn.dataset.view === 'add') renderCustomList();
    });
  });

  // ---------- Draw a card ----------
  const promptCardEl = document.getElementById('prompt-card');
  const drawBtn = document.getElementById('draw-btn');
  const startTimerBtn = document.getElementById('start-timer-btn');
  const categoryFilters = document.getElementById('category-filters');

  function getCheckedCategories() {
    return Array.from(categoryFilters.querySelectorAll('input[type=checkbox]:checked')).map(i => i.value);
  }

  function sketchHtml(p) {
    return '<div class="prompt-sketch">' + (window.getPoseSketch ? window.getPoseSketch(p) : ('<span class="prompt-emoji">' + p.emoji + '</span>')) + '</div>';
  }

  // A reference image can come from two places: a per-browser override saved
  // via the UI (localStorage), or the "image" field baked into prompts.js
  // (same for every visitor, e.g. once deployed to GitLab Pages). The local
  // override wins if both are set.
  function getLocalRefSrc(p) {
    return loadRefImages()[p.id] || '';
  }
  function getRefSrc(p) {
    return getLocalRefSrc(p) || p.image || '';
  }

  function renderPromptCard(p) {
    const stars = '⭐'.repeat(p.difficulty || 1);
    const localSrc = getLocalRefSrc(p);
    const refSrc = localSrc || p.image || '';
    const badgeLabel = localSrc ? '📌 photo perso (ce navigateur)' : (refSrc ? '🌐 photo du site' : '');
    promptCardEl.classList.remove('empty');
    promptCardEl.innerHTML =
      '<div class="visual-slot" id="visual-slot"></div>' +
      '<h3 class="prompt-title">' + p.emoji + ' ' + escapeHtml(p.title) + '</h3>' +
      '<p class="prompt-desc">' + escapeHtml(p.desc) + '</p>' +
      '<div class="prompt-meta"><span>' + categoryLabel(p.cat) + '</span><span>' + stars + '</span>' +
      (badgeLabel ? '<span class="ref-badge" id="ref-badge">' + badgeLabel + '</span>' : '') + '</div>';

    const slot = document.getElementById('visual-slot');
    if (!refSrc) {
      slot.innerHTML = sketchHtml(p);
      return;
    }
    // Remote URLs (e.g. from another site) can fail to load: hotlink protection,
    // dead link, or the site being offline. Fall back to the sketch with a clear
    // message instead of leaving a broken image icon.
    const img = document.createElement('img');
    img.className = 'ref-photo';
    img.alt = 'Photo de référence';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      slot.innerHTML = sketchHtml(p) +
        '<p class="img-error">⚠️ Impossible de charger cette image (lien mort, site qui bloque l\'affichage externe, ou hors-ligne). Essayez une autre URL, ou utilisez le collage / l\'import de fichier.</p>';
      const badge = document.getElementById('ref-badge');
      if (badge) badge.remove();
    };
    img.src = refSrc;
    slot.appendChild(img);
  }

  function categoryLabel(cat) {
    if (cat === 'meme') return '😂 Meme';
    if (cat === 'film') return '🎬 Film';
    if (cat === 'serie') return '📺 Série';
    return cat;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  drawBtn.addEventListener('click', () => {
    const cats = getCheckedCategories();
    const pool = getAllPrompts().filter(p => cats.includes(p.cat));
    if (pool.length === 0) {
      alert('Sélectionnez au moins une catégorie.');
      return;
    }
    // avoid repeating the same card twice in a row if possible
    let next = currentPrompt;
    if (pool.length > 1) {
      do {
        next = pool[Math.floor(Math.random() * pool.length)];
      } while (currentPrompt && next.id === currentPrompt.id);
    } else {
      next = pool[0];
    }
    currentPrompt = next;
    renderPromptCard(currentPrompt);
    startTimerBtn.disabled = false;
    toggleRefBtn.disabled = false;
    refEditor.classList.add('hidden');
    resetTimerUI();
  });

  // ---------- Reference photo (user-supplied) ----------
  const toggleRefBtn = document.getElementById('toggle-ref-btn');
  const refEditor = document.getElementById('ref-photo-editor');
  const refUrlInput = document.getElementById('ref-url-input');
  const refFileInput = document.getElementById('ref-file-input');
  const refSaveBtn = document.getElementById('ref-save-btn');
  const refRemoveBtn = document.getElementById('ref-remove-btn');
  const refPasteZone = document.getElementById('ref-paste-zone');
  const REF_PASTE_ZONE_HTML = refPasteZone.innerHTML;
  let refPastedDataUrl = null;

  function resetRefPasteZone() {
    refPastedDataUrl = null;
    refPasteZone.classList.remove('has-image');
    refPasteZone.innerHTML = REF_PASTE_ZONE_HTML;
  }

  refPasteZone.addEventListener('paste', (e) => {
    const p = readImageFromClipboard(e);
    if (!p) return;
    e.preventDefault();
    p.then((raw) => downscaleDataUrl(raw, 480)).then((dataUrl) => {
      refPastedDataUrl = dataUrl;
      refPasteZone.classList.add('has-image');
      refPasteZone.innerHTML = '<img class="paste-preview" src="' + dataUrl + '" alt="Image collée" />';
    });
  });

  toggleRefBtn.addEventListener('click', () => {
    if (!currentPrompt) return;
    const current = getRefSrc(currentPrompt);
    refUrlInput.value = current && current.indexOf('http') === 0 ? current : '';
    refFileInput.value = '';
    resetRefPasteZone();
    refEditor.classList.toggle('hidden');
  });

  refSaveBtn.addEventListener('click', () => {
    if (!currentPrompt) return;
    if (refPastedDataUrl) {
      setRefImage(currentPrompt.id, refPastedDataUrl);
      renderPromptCard(currentPrompt);
      refEditor.classList.add('hidden');
      return;
    }
    const file = refFileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        downscaleDataUrl(ev.target.result, 480).then((dataUrl) => {
          setRefImage(currentPrompt.id, dataUrl);
          renderPromptCard(currentPrompt);
          refEditor.classList.add('hidden');
        });
      };
      reader.readAsDataURL(file);
      return;
    }
    const url = refUrlInput.value.trim();
    if (url) {
      setRefImage(currentPrompt.id, url);
      renderPromptCard(currentPrompt);
      refEditor.classList.add('hidden');
    }
  });

  refRemoveBtn.addEventListener('click', () => {
    if (!currentPrompt) return;
    removeRefImage(currentPrompt.id);
    renderPromptCard(currentPrompt);
    refUrlInput.value = '';
    refFileInput.value = '';
    resetRefPasteZone();
  });

  // ---------- Timer ----------
  const timerSelect = document.getElementById('timer-select');
  const timerDisplay = document.getElementById('timer-display');
  const timerNumber = document.getElementById('timer-number');
  const timerRingFg = document.getElementById('timer-ring-fg');
  const RING_CIRCUMFERENCE = 283;

  function resetTimerUI() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerDisplay.classList.add('hidden');
    timerRingFg.style.stroke = 'var(--primary)';
    timerRingFg.style.strokeDashoffset = 0;
  }

  startTimerBtn.addEventListener('click', () => {
    const seconds = parseInt(timerSelect.value, 10);
    if (!seconds) {
      alert('Choisissez une durée de chrono, ou lancez-vous sans chrono !');
      return;
    }
    timerTotal = seconds;
    timerRemaining = seconds;
    timerDisplay.classList.remove('hidden');
    timerNumber.textContent = timerRemaining;
    timerRingFg.style.strokeDashoffset = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerRemaining--;
      timerNumber.textContent = Math.max(timerRemaining, 0);
      const ratio = Math.max(timerRemaining, 0) / timerTotal;
      timerRingFg.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
      if (timerRemaining <= 5 && timerRemaining >= 0) {
        timerRingFg.style.stroke = '#dc2626';
      }
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerNumber.textContent = "📸";
        beep();
      }
    }, 1000);
  });

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) { /* ignore if audio unavailable */ }
  }

  // ---------- Camera ----------
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const capturedPreview = document.getElementById('captured-preview');
  const cameraPlaceholder = document.getElementById('camera-placeholder');
  const startCamBtn = document.getElementById('start-cam-btn');
  const snapBtn = document.getElementById('snap-btn');
  const retakeBtn = document.getElementById('retake-btn');
  const saveBtn = document.getElementById('save-btn');
  const fileInput = document.getElementById('file-input');

  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = stream;
      cameraPlaceholder.classList.add('hidden');
      video.classList.remove('hidden');
      snapBtn.classList.remove('hidden');
    } catch (err) {
      alert("Impossible d'accéder à la caméra (" + err.message + "). Utilisez l'import de photo à la place.");
    }
  }

  startCamBtn.addEventListener('click', startCamera);

  snapBtn.addEventListener('click', () => {
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // mirror to match the preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    lastCapturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    showCapturedPreview();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const w = img.width, h = img.height;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        lastCapturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        showCapturedPreview();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  function showCapturedPreview() {
    capturedPreview.src = lastCapturedDataUrl;
    capturedPreview.classList.remove('hidden');
    video.classList.add('hidden');
    cameraPlaceholder.classList.add('hidden');
    snapBtn.classList.add('hidden');
    retakeBtn.classList.remove('hidden');
    saveBtn.classList.remove('hidden');
  }

  retakeBtn.addEventListener('click', () => {
    lastCapturedDataUrl = null;
    capturedPreview.classList.add('hidden');
    saveBtn.classList.add('hidden');
    retakeBtn.classList.add('hidden');
    if (stream) {
      video.classList.remove('hidden');
      snapBtn.classList.remove('hidden');
    } else {
      cameraPlaceholder.classList.remove('hidden');
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!lastCapturedDataUrl) return;
    const downscaled = downscaleDataUrl(lastCapturedDataUrl, 480);
    downscaled.then((dataUrl) => {
      const gallery = loadGallery();
      gallery.unshift({
        id: 'shot-' + Date.now(),
        promptId: currentPrompt ? currentPrompt.id : null,
        promptTitle: currentPrompt ? currentPrompt.title : 'Photo libre',
        promptEmoji: currentPrompt ? currentPrompt.emoji : '📷',
        dataUrl,
        ts: Date.now(),
      });
      saveGallery(gallery);
      retakeBtn.click();
      alert('Photo ajoutée à la galerie !');
    });
  });

  function downscaleDataUrl(dataUrl, maxWidth) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  }

  // ---------- Gallery ----------
  const galleryGrid = document.getElementById('gallery-grid');
  const clearGalleryBtn = document.getElementById('clear-gallery-btn');

  function renderGallery() {
    const gallery = loadGallery();
    if (gallery.length === 0) {
      galleryGrid.innerHTML = '<p class="empty-msg">Aucune photo pour l\'instant. Va dans « Jouer » pour en ajouter une !</p>';
      return;
    }
    galleryGrid.innerHTML = '';
    gallery.forEach(item => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.innerHTML =
        '<img src="' + item.dataUrl + '" alt="' + escapeHtml(item.promptTitle) + '" />' +
        '<div class="gallery-item-body">' +
          '<div class="gallery-item-title">' + item.promptEmoji + ' ' + escapeHtml(item.promptTitle) + '</div>' +
          '<div class="gallery-item-actions">' +
            '<button data-action="download" data-id="' + item.id + '">⬇️ Télécharger</button>' +
            '<button data-action="delete" data-id="' + item.id + '">🗑️ Supprimer</button>' +
          '</div>' +
        '</div>';
      galleryGrid.appendChild(el);
    });
  }

  galleryGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const gallery = loadGallery();
    const item = gallery.find(g => g.id === btn.dataset.id);
    if (!item) return;
    if (btn.dataset.action === 'delete') {
      saveGallery(gallery.filter(g => g.id !== item.id));
      renderGallery();
    } else if (btn.dataset.action === 'download') {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = (item.promptTitle || 'photo').replace(/[^a-z0-9]+/gi, '_') + '.jpg';
      a.click();
    }
  });

  clearGalleryBtn.addEventListener('click', () => {
    if (confirm('Supprimer toutes les photos de la galerie ?')) {
      saveGallery([]);
      renderGallery();
    }
  });

  // ---------- Add custom prompt ----------
  const addForm = document.getElementById('add-form');
  const customListEl = document.getElementById('custom-list');
  const addPasteZone = document.getElementById('add-paste-zone');
  const ADD_PASTE_ZONE_HTML = addPasteZone.innerHTML;
  let addPastedDataUrl = null;

  function resetAddPasteZone() {
    addPastedDataUrl = null;
    addPasteZone.classList.remove('has-image');
    addPasteZone.innerHTML = ADD_PASTE_ZONE_HTML;
  }

  addPasteZone.addEventListener('paste', (e) => {
    const p = readImageFromClipboard(e);
    if (!p) return;
    e.preventDefault();
    p.then((raw) => downscaleDataUrl(raw, 480)).then((dataUrl) => {
      addPastedDataUrl = dataUrl;
      addPasteZone.classList.add('has-image');
      addPasteZone.innerHTML = '<img class="paste-preview" src="' + dataUrl + '" alt="Image collée" />';
    });
  });

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emoji = document.getElementById('add-emoji').value.trim() || '🎭';
    const title = document.getElementById('add-title').value.trim();
    const cat = document.getElementById('add-cat').value;
    const difficulty = parseInt(document.getElementById('add-difficulty').value, 10);
    const desc = document.getElementById('add-desc').value.trim();
    const imageUrl = document.getElementById('add-image-url').value.trim();
    const imageFile = document.getElementById('add-image-file').files[0];
    if (!title || !desc) return;
    const id = 'custom-' + Date.now();
    const list = loadCustomPrompts();
    list.push({ id, emoji, title, cat, difficulty, desc });
    saveCustomPrompts(list);

    function finish() {
      addForm.reset();
      document.getElementById('add-difficulty').value = '2';
      resetAddPasteZone();
      renderCustomList();
    }

    if (addPastedDataUrl) {
      setRefImage(id, addPastedDataUrl);
      finish();
    } else if (imageFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        downscaleDataUrl(ev.target.result, 480).then((dataUrl) => {
          setRefImage(id, dataUrl);
          finish();
        });
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
      setRefImage(id, imageUrl);
      finish();
    } else {
      finish();
    }
  });

  function renderCustomList() {
    const list = loadCustomPrompts();
    if (list.length === 0) {
      customListEl.innerHTML = '';
      return;
    }
    customListEl.innerHTML = '<h3>Vos cartes personnalisées</h3>';
    list.forEach(p => {
      const row = document.createElement('div');
      row.className = 'custom-list-item';
      row.innerHTML =
        '<span>' + p.emoji + ' ' + escapeHtml(p.title) + ' (' + categoryLabel(p.cat) + ')</span>' +
        '<button data-id="' + p.id + '">Supprimer</button>';
      customListEl.appendChild(row);
    });
    customListEl.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        saveCustomPrompts(loadCustomPrompts().filter(p => p.id !== btn.dataset.id));
        renderCustomList();
      });
    });
  }

  // ---------- init ----------
  renderCustomList();
})();
