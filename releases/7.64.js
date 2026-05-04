
/* ==================================================================
   Demoforge Ultimate Fusion — tout-en-un, sans dépendances.
   Pipeline :
     1) vidéo / gif → <video> ou <img>
     2) frame courante → work canvas (basse résolution pour perf)
     3) masque (diff motion + fallback luminance/contraste)
     4) render d'effet sur render-canvas (4:3)
     5) overlay raster
================================================================== */
(() => {
  'use strict';

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);

  const srcVideo = $('src-video');
  const srcGif = $('src-gif');
  const ytCard = $('yt-card');
  const ytThumb = $('yt-thumb');
  const ytId = $('yt-id');
  const ytOpen = $('yt-open');
  const ytEmbed = $('yt-embed');

  const renderCanvas = $('render-canvas');
  const renderCtx = renderCanvas.getContext('2d');
  const workCanvas = $('work-canvas');
  const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
  const prevCanvas = $('prev-canvas');
  const prevCtx = prevCanvas.getContext('2d', { willReadFrequently: true });

  const dbgSrc = $('dbg-src').getContext('2d');
  const dbgMask = $('dbg-mask').getContext('2d');
  const dbgOut = $('dbg-out').getContext('2d');

  const selEffect = $('sel-effect');
  const selVariant = $('sel-variant');
  const selRaster = $('sel-raster');
  const selPalette = $('sel-palette');
  const cBg = $('c-bg'), cInk = $('c-ink'), cAccent = $('c-accent'), cHalo = $('c-halo');

  const rMotion = $('r-motion'),   vMotion = $('v-motion');
  const rSize = $('r-size'),       vSize = $('v-size');
  const rSimplify = $('r-simplify'), vSimplify = $('v-simplify');
  const rContrast = $('r-contrast'), vContrast = $('v-contrast');
  const rHalo = $('r-halo'),       vHalo = $('v-halo');

  const taChars = $('ta-chars');

  const btnPlay = $('btn-play');
  const btnPause = $('btn-pause');
  const btnExportTop = $('btn-export');

  const tlBar = $('tl-bar');
  const tlRange = $('tl-range');
  const tlMarkIn = $('tl-mark-in');
  const tlMarkOut = $('tl-mark-out');
  const tlPlayhead = $('tl-playhead');
  const rTrimStart = $('r-trim-start');
  const rTrimEnd = $('r-trim-end');

  const tcTotal = $('tc-total');
  const tcIn = $('tc-in');
  const tcOut = $('tc-out');
  const tcCur = $('tc-cur');
  const tcDur = $('tc-dur');
  const tcRange = $('tc-range');

  const btnInHead = $('btn-in-head');
  const btnOutHead = $('btn-out-head');

  const statusEl = $('status');
  const dropOverlay = $('drop-overlay');
  const chkDebug = $('chk-debug');
  const debugRow = $('debug-row');
  const srcBadge = $('src-badge');
  const tagSrc = $('tag-src');
  const tagEff = $('tag-eff');

  /* ---------- STATE ---------- */
  const state = {
    sourceType: 'none',      // 'none' | 'video' | 'gif' | 'youtube'
    inSec: 0,
    outSec: 0,
    totalSec: 0,
    effect: 0,
    variant: 0,
    raster: 'none',
    palette: 'state',
    engine: { motion: 40, size: 50, simplify: 40, contrast: 110, halo: 45 },
    chars: ' .:-=+*#%@',
    debug: false,
    // runtime
    rafId: null,
    lastDiffScore: 0,
    trailCanvas: null,
    trailCtx: null,
    ghostCanvas: null,
    ghostCtx: null,
    matrixDrops: null,
    editingTc: { in: false, out: false },
    recorder: null,
    recording: false,
  };

  /* ---------- PALETTES (rendu) ---------- */
  const PALETTES = {
    state: { bg: '#efe9d9', ink: '#1a1a1a', accent: '#8a8a3a', halo: '#b8b36b', alt: '#cfc9a8' },
    green: { bg: '#001806', ink: '#33ff66', accent: '#9fffa6', halo: '#1a8a3a', alt: '#003a14' },
    mono:  { bg: '#f3ead9', ink: '#2a241c', accent: '#6b5d45', halo: '#c9b796', alt: '#d9ccae' },
    amber: { bg: '#1a0d00', ink: '#ffb347', accent: '#ffd280', halo: '#b76a16', alt: '#4a2a08' },
    ice:   { bg: '#eaf4fa', ink: '#08364a', accent: '#3aa6c4', halo: '#a8d8e8', alt: '#b8d6e4' },
    custom:{ bg: '#efe9d9', ink: '#1a1a1a', accent: '#8a8a3a', halo: '#b8b36b', alt: '#cfc9a8' },
  };

  /* ---------- EFFETS (liste) ---------- */
  const EFFECTS = [
    'Silhouette Demoscene', 'ASCII Art', 'Pixel Art', 'Matrix Rain',
    'Outline Only', 'Shadow Dance', 'Rotoscope Retro', 'Black And White Contrast',
    'Duotone Retro', 'Vector Minimal', 'Ink Cutout', 'CRT Vintage',
    'Posterized Graphic', 'Ghost Trail', 'Amiga Art Sequence'
  ];

  /* ---------- VARIANTES (12, noms partagés) ----------
     Chaque variante modifie plusieurs paramètres:
     sizeMul, contrastMul, haloMul, rasterDefault, paletteDefault, extra
  */
  const VARIANTS = [
    { name: 'Clean Cut',       sizeMul: 0.9, contrastMul: 1.1,  haloMul: 0.2, raster: 'none',            palette: 'state' },
    { name: 'Soft Halo',       sizeMul: 1.0, contrastMul: 0.9,  haloMul: 1.4, raster: 'scanlines',       palette: 'mono'  },
    { name: 'Brut Contrast',   sizeMul: 1.0, contrastMul: 1.6,  haloMul: 0.6, raster: 'horizontal-lines',palette: 'state' },
    { name: 'Warm Paper',      sizeMul: 1.1, contrastMul: 0.85, haloMul: 0.9, raster: 'halftone-dots',   palette: 'mono'  },
    { name: 'Ice Grid',        sizeMul: 0.85,contrastMul: 1.1,  haloMul: 0.7, raster: 'crt-grid',        palette: 'ice'   },
    { name: 'Green Drift',     sizeMul: 1.0, contrastMul: 1.0,  haloMul: 1.0, raster: 'scanlines',       palette: 'green' },
    { name: 'Dot Bloom',       sizeMul: 1.2, contrastMul: 1.0,  haloMul: 1.3, raster: 'dot-grid',        palette: 'state' },
    { name: 'Chunky Blocks',   sizeMul: 1.8, contrastMul: 1.2,  haloMul: 0.5, raster: 'checker',         palette: 'mono'  },
    { name: 'Bare Bones',      sizeMul: 0.8, contrastMul: 1.3,  haloMul: 0.0, raster: 'none',            palette: 'state' },
    { name: 'Hard Signal',     sizeMul: 0.9, contrastMul: 1.7,  haloMul: 0.8, raster: 'vertical-lines',  palette: 'amber' },
    { name: 'Night Terminal',  sizeMul: 1.0, contrastMul: 1.2,  haloMul: 1.1, raster: 'scanlines',       palette: 'green' },
    { name: 'Classic Demo',    sizeMul: 1.0, contrastMul: 1.0,  haloMul: 1.0, raster: 'diagonal-lines',  palette: 'state' },
  ];

  /* ---------- UTILS ---------- */
  function setStatus(txt, kind='info') {
    const cls = kind === 'ok' ? 's-ok' : kind === 'warn' ? 's-warn' : 's-info';
    statusEl.innerHTML = '<span class="' + cls + '">' + txt + '</span>';
  }

  function fmtTime(t) {
    if (!isFinite(t) || t < 0) t = 0;
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t - Math.floor(t)) * 1000);
    const pad = (n, w=2) => String(n).padStart(w, '0');
    return pad(h) + ':' + pad(m) + ':' + pad(s) + '.' + pad(ms, 3);
  }
  function parseTime(s) {
    const m = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(String(s).trim());
    if (!m) return null;
    const h = +m[1], mi = +m[2], se = +m[3];
    const ms = m[4] ? +String(m[4]).padEnd(3,'0') : 0;
    return h*3600 + mi*60 + se + ms/1000;
  }

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function hexToRgb(hex) {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    return {
      r: parseInt(hex.substr(0,2), 16),
      g: parseInt(hex.substr(2,2), 16),
      b: parseInt(hex.substr(4,2), 16),
    };
  }

  function currentPalette() { return PALETTES[state.palette] || PALETTES.state; }

  /* ---------- POPULATE SELECTS ---------- */
  function addEffectOption(n, i) {
    const o = document.createElement('option'); o.value = i; o.textContent = n;
    selEffect.appendChild(o);
  }
  EFFECTS.forEach((n, i) => addEffectOption(n, i));
  function populateVariants() {
    selVariant.innerHTML = '';
    VARIANTS.forEach((v, i) => {
      const o = document.createElement('option'); o.value = i; o.textContent = v.name;
      selVariant.appendChild(o);
    });
  }
  populateVariants();

  /* ---------- SOURCE HANDLING ---------- */
  function resetSource() {
    try { srcVideo.pause(); } catch(e){}
    srcVideo.removeAttribute('src');
    srcVideo.load && srcVideo.load();
    srcGif.removeAttribute('src');
    srcVideo.style.display = 'none';
    srcGif.style.display = 'none';
    ytCard.style.display = 'none';
    state.sourceType = 'none';
    state.totalSec = 0;
    state.inSec = 0;
    state.outSec = 0;
    updateTimecodesUI();
    srcBadge.textContent = 'aucune';
    tagSrc.textContent = '—';
    setStatus('source réinitialisée.', 'info');
  }

  function loadVideoFile(file) {
    resetSource();
    const url = URL.createObjectURL(file);
    srcVideo.src = url;
    srcVideo.style.display = 'block';
    srcVideo.loop = false;
    state.sourceType = 'video';
    srcBadge.textContent = 'vidéo';
    tagSrc.textContent = file.name;
    srcVideo.addEventListener('loadedmetadata', onVideoReady, { once: true });
    setStatus('chargement vidéo…', 'info');
  }

  function onVideoReady() {
    state.totalSec = srcVideo.duration || 0;
    state.inSec = 0;
    state.outSec = state.totalSec;
    updateTimecodesUI();
    setStatus('source chargée (' + fmtTime(state.totalSec) + ').', 'ok');
    try { srcVideo.play(); } catch(e){}
  }

  function loadGifFile(file) {
    resetSource();
    const url = URL.createObjectURL(file);
    srcGif.src = url;
    srcGif.style.display = 'block';
    state.sourceType = 'gif';
    srcBadge.textContent = 'gif';
    tagSrc.textContent = file.name;
    // GIFs : pas de durée native ; on force un "total" nominal de 5s
    state.totalSec = 5;
    state.inSec = 0;
    state.outSec = 5;
    updateTimecodesUI();
    setStatus('gif chargé (durée nominale 5s).', 'ok');
  }

  function parseYouTube(url) {
    if (!url) return null;
    url = url.trim();
    // ID direct (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?[^#]*v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const re of patterns) {
      const m = re.exec(url);
      if (m) return m[1];
    }
    return null;
  }

  function loadYouTube(urlOrId) {
    const id = parseYouTube(urlOrId);
    if (!id) { setStatus('URL invalide.', 'warn'); return false; }
    resetSource();
    state.sourceType = 'youtube';
    ytCard.style.display = 'flex';
    ytThumb.src = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
    ytThumb.onerror = () => setStatus('miniature YouTube indisponible (hors-ligne ?).', 'warn');
    ytId.textContent = id;
    ytOpen.href = 'https://www.youtube.com/watch?v=' + id;
    ytEmbed.href = 'https://www.youtube.com/embed/' + id;
    srcBadge.textContent = 'youtube';
    tagSrc.textContent = id;
    setStatus('URL YouTube reconnue. Mode compatible local : canvas et export ne s\'appliquent pas à YouTube.', 'warn');
    // dessiner un rendu statique avec la miniature lorsqu'elle sera chargée
    ytThumb.onload = () => renderYouTubeStatic();
    return true;
  }

  function renderYouTubeStatic() {
    // Dessine la miniature YouTube sur le work canvas pour permettre un aperçu stylisé statique
    try {
      workCtx.drawImage(ytThumb, 0, 0, workCanvas.width, workCanvas.height);
    } catch(e) { /* cross-origin parfois bloqué */ }
  }

  /* ---------- FILE/URL DISPATCH ---------- */
  function handleDroppedFile(file) {
    if (!file) return;
    const name = (file.name || '').toLowerCase();
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|ogg)$/i.test(name)) {
      loadVideoFile(file);
    } else if (file.type === 'image/gif' || /\.gif$/i.test(name)) {
      loadGifFile(file);
    } else {
      setStatus('drop non pris en charge : ' + (file.type || 'type inconnu'), 'warn');
    }
  }
  function handleDroppedText(txt) {
    if (!txt) return;
    const m = /(https?:\/\/[^\s]+|[a-zA-Z0-9_-]{11})/.exec(txt);
    if (m && loadYouTube(m[1])) return;
    setStatus('aucune URL YouTube détectée dans le texte déposé.', 'warn');
  }

  /* ---------- TIMECODES / TIMELINE ---------- */
  function updateTimecodesUI() {
    tcTotal.value = fmtTime(state.totalSec);
    tcDur.textContent = fmtTime(state.totalSec);
    if (!state.editingTc.in) tcIn.value = fmtTime(state.inSec);
    if (!state.editingTc.out) tcOut.value = fmtTime(state.outSec);
    tcRange.textContent = fmtTime(Math.max(0, state.outSec - state.inSec));
    // sliders trim
    const dur = state.totalSec || 1;
    rTrimStart.value = Math.round(1000 * clamp(state.inSec / dur, 0, 1));
    rTrimEnd.value = Math.round(1000 * clamp(state.outSec / dur, 0, 1));
    renderTimelineMarkers();
  }
  function renderTimelineMarkers() {
    const dur = state.totalSec || 1;
    const inP = clamp(state.inSec / dur, 0, 1) * 100;
    const outP = clamp(state.outSec / dur, 0, 1) * 100;
    tlMarkIn.style.left = inP + '%';
    tlMarkOut.style.left = outP + '%';
    tlRange.style.left = inP + '%';
    tlRange.style.width = Math.max(0, outP - inP) + '%';
  }
  function updatePlayhead(cur) {
    const dur = state.totalSec || 1;
    const p = clamp(cur / dur, 0, 1) * 100;
    tlPlayhead.style.left = p + '%';
    tcCur.textContent = fmtTime(cur);
  }

  function timeFromTimelinePointer(clientX) {
    const rect = tlBar.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1) * (state.totalSec || 0);
  }

  function setTrim(kind, t, seek=true) {
    if (!state.totalSec) return;
    if (kind === 'in') {
      state.inSec = clamp(t, 0, Math.max(0, state.outSec - 0.05));
      if (seek && state.sourceType === 'video') srcVideo.currentTime = state.inSec;
    } else {
      state.outSec = clamp(t, Math.min(state.totalSec, state.inSec + 0.05), state.totalSec);
      if (seek && state.sourceType === 'video') srcVideo.currentTime = state.outSec;
    }
    updateTimecodesUI();
  }

  function setTrimFromPointer(kind, clientX) {
    setTrim(kind, timeFromTimelinePointer(clientX), true);
  }

  function bindTrimDrag(el, kind) {
    el.addEventListener('pointerdown', (e) => {
      if (!state.totalSec) return;
      e.preventDefault(); e.stopPropagation();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      setTrimFromPointer(kind, e.clientX);
      const move = (ev) => { ev.preventDefault(); setTrimFromPointer(kind, ev.clientX); };
      const up = (ev) => {
        try { el.releasePointerCapture && el.releasePointerCapture(ev.pointerId); } catch(_) {}
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up, { once: true });
      window.addEventListener('pointercancel', up, { once: true });
    });
  }

  function bindRangeDrag() {
    tlRange.addEventListener('pointerdown', (e) => {
      if (!state.totalSec) return;
      e.preventDefault(); e.stopPropagation();
      const startX = e.clientX;
      const startIn = state.inSec;
      const span = Math.max(0.05, state.outSec - state.inSec);
      tlRange.setPointerCapture && tlRange.setPointerCapture(e.pointerId);
      const rect = tlBar.getBoundingClientRect();
      const secPerPx = state.totalSec / Math.max(1, rect.width);
      const move = (ev) => {
        ev.preventDefault();
        let nextIn = clamp(startIn + (ev.clientX - startX) * secPerPx, 0, Math.max(0, state.totalSec - span));
        state.inSec = nextIn;
        state.outSec = nextIn + span;
        if (state.sourceType === 'video') srcVideo.currentTime = state.inSec;
        updateTimecodesUI();
      };
      const up = (ev) => {
        try { tlRange.releasePointerCapture && tlRange.releasePointerCapture(ev.pointerId); } catch(_) {}
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up, { once: true });
      window.addEventListener('pointercancel', up, { once: true });
    });
  }

  tlBar.addEventListener('pointerdown', (e) => {
    if (!state.totalSec) return;
    if (e.target === tlMarkIn || e.target === tlMarkOut || e.target === tlRange) return;
    e.preventDefault();
    const t = timeFromTimelinePointer(e.clientX);
    const kind = Math.abs(t - state.inSec) <= Math.abs(t - state.outSec) ? 'in' : 'out';
    setTrim(kind, t, true);
    const move = (ev) => { ev.preventDefault(); setTrimFromPointer(kind, ev.clientX); };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', up, { once: true });
  });

  bindTrimDrag(tlMarkIn, 'in');
  bindTrimDrag(tlMarkOut, 'out');
  bindRangeDrag();

  rTrimStart.addEventListener('input', () => {
    const dur = state.totalSec || 1;
    let v = (+rTrimStart.value / 1000) * dur;
    if (v >= state.outSec) v = Math.max(0, state.outSec - 0.05);
    state.inSec = v;
    updateTimecodesUI();
  });
  rTrimEnd.addEventListener('input', () => {
    const dur = state.totalSec || 1;
    let v = (+rTrimEnd.value / 1000) * dur;
    if (v <= state.inSec) v = Math.min(state.totalSec, state.inSec + 0.05);
    state.outSec = v;
    updateTimecodesUI();
  });

  function bindTcInput(el, key) {
    el.addEventListener('focus', () => { state.editingTc[key] = true; });
    el.addEventListener('blur', () => {
      state.editingTc[key] = false;
      const v = parseTime(el.value);
      if (v !== null) {
        if (key === 'in') state.inSec = clamp(v, 0, state.totalSec);
        else state.outSec = clamp(v, 0, state.totalSec);
        if (state.inSec >= state.outSec) {
          if (key === 'in') state.inSec = Math.max(0, state.outSec - 0.05);
          else state.outSec = Math.min(state.totalSec, state.inSec + 0.05);
        }
      }
      updateTimecodesUI();
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.blur(); });
  }
  bindTcInput(tcIn, 'in');
  bindTcInput(tcOut, 'out');

  btnInHead.addEventListener('click', () => {
    if (state.sourceType === 'video') {
      state.inSec = clamp(srcVideo.currentTime, 0, Math.max(0, state.outSec - 0.05));
      updateTimecodesUI();
    }
  });
  btnOutHead.addEventListener('click', () => {
    if (state.sourceType === 'video') {
      state.outSec = clamp(srcVideo.currentTime, state.inSec + 0.05, state.totalSec);
      updateTimecodesUI();
    }
  });

  /* ---------- CONTROLS ---------- */
  btnPlay.addEventListener('click', () => {
    if (state.sourceType === 'video') {
      if (srcVideo.currentTime < state.inSec || srcVideo.currentTime >= state.outSec) {
        srcVideo.currentTime = state.inSec;
      }
      srcVideo.play();
    }
  });
  btnPause.addEventListener('click', () => {
    if (state.sourceType === 'video') srcVideo.pause();
  });
  btnExportTop.addEventListener('click', () => exportAnimatedHtmlLite());

  $('btn-src-reset').addEventListener('click', resetSource);
  $('file-video').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (f) loadVideoFile(f);
  });
  $('file-gif').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0]; if (f) loadGifFile(f);
  });
  $('btn-yt-load').addEventListener('click', () => loadYouTube($('yt-url').value));
  $('yt-url').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadYouTube(e.target.value); });
  $('yt-url').addEventListener('paste', (e) => {
    setTimeout(() => loadYouTube($('yt-url').value), 10);
  });

  /* Engine sliders */
  function bindSlider(r, v, key) {
    r.addEventListener('input', () => {
      state.engine[key] = +r.value;
      v.textContent = r.value;
    });
  }
  bindSlider(rMotion, vMotion, 'motion');
  bindSlider(rSize, vSize, 'size');
  bindSlider(rSimplify, vSimplify, 'simplify');
  bindSlider(rContrast, vContrast, 'contrast');
  bindSlider(rHalo, vHalo, 'halo');

  /* Selects */
  selEffect.addEventListener('change', () => {
    state.effect = +selEffect.value;
    tagEff.textContent = EFFECTS[state.effect];
    // reset caches d'effet
    state.trailCanvas = null; state.ghostCanvas = null; state.matrixDrops = null;
  });
  selVariant.addEventListener('change', () => {
    state.variant = +selVariant.value;
    const v = VARIANTS[state.variant];
    // applique les défauts de variante sur raster/palette
    selRaster.value = v.raster;
    selPalette.value = v.palette;
    state.raster = v.raster;
    state.palette = v.palette;
  });
  selRaster.addEventListener('change', () => { state.raster = selRaster.value; });
  selPalette.addEventListener('change', () => { state.palette = selPalette.value; syncColorInputs(); });

  function syncColorInputs() {
    const p = currentPalette();
    cBg.value = p.bg; cInk.value = p.ink; cAccent.value = p.accent; cHalo.value = p.halo;
  }
  function saveCustomPaletteFromInputs() {
    PALETTES.custom = { bg: cBg.value, ink: cInk.value, accent: cAccent.value, halo: cHalo.value, alt: cAccent.value };
    state.palette = 'custom'; selPalette.value = 'custom';
  }
  [cBg, cInk, cAccent, cHalo].forEach(el => el.addEventListener('input', saveCustomPaletteFromInputs));
  $('btn-palette-save').addEventListener('click', () => { saveCustomPaletteFromInputs(); setStatus('palette custom sauvegardée.', 'ok'); });
  $('btn-preset-apply').addEventListener('click', () => {
    const v = VARIANTS[state.variant];
    state.raster = selRaster.value;
    state.palette = selPalette.value;
    v.raster = state.raster;
    v.palette = state.palette;
    setStatus('preset variante mis à jour avec couleur + raster.', 'ok');
  });

  taChars.addEventListener('input', () => {
    const v = taChars.value;
    state.chars = v.length >= 2 ? v : ' .:-=+*#%@';
  });

  chkDebug.addEventListener('change', () => {
    state.debug = chkDebug.checked;
    debugRow.classList.toggle('show', state.debug);
  });

  function serializeConfig() {
    return {
      version: 2,
      effect: state.effect,
      variant: state.variant,
      raster: state.raster,
      palette: state.palette,
      palettes: { custom: PALETTES.custom },
      variants: VARIANTS,
      engine: state.engine,
      chars: state.chars,
      trim: { inSec: state.inSec, outSec: state.outSec }
    };
  }

  function applyConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') throw new Error('JSON config invalide');
    if (cfg.palettes && cfg.palettes.custom) Object.assign(PALETTES.custom, cfg.palettes.custom);
    if (Array.isArray(cfg.variants)) cfg.variants.forEach((v, i) => { if (VARIANTS[i]) Object.assign(VARIANTS[i], v); });
    if (cfg.engine) Object.assign(state.engine, cfg.engine);
    if (typeof cfg.effect === 'number') state.effect = clamp(cfg.effect, 0, EFFECTS.length - 1);
    if (typeof cfg.variant === 'number') state.variant = clamp(cfg.variant, 0, VARIANTS.length - 1);
    if (cfg.raster) state.raster = cfg.raster;
    if (cfg.palette) state.palette = cfg.palette;
    if (cfg.chars) state.chars = String(cfg.chars);
    if (cfg.trim) { state.inSec = +cfg.trim.inSec || 0; state.outSec = +cfg.trim.outSec || state.outSec; }
    selEffect.value = state.effect; tagEff.textContent = EFFECTS[state.effect];
    selVariant.value = state.variant; selRaster.value = state.raster; selPalette.value = state.palette;
    rMotion.value = state.engine.motion; vMotion.textContent = rMotion.value;
    rSize.value = state.engine.size; vSize.textContent = rSize.value;
    rSimplify.value = state.engine.simplify; vSimplify.textContent = rSimplify.value;
    rContrast.value = state.engine.contrast; vContrast.textContent = rContrast.value;
    rHalo.value = state.engine.halo; vHalo.textContent = rHalo.value;
    taChars.value = state.chars;
    syncColorInputs(); updateTimecodesUI();
  }

  $('cfg-export').addEventListener('click', () => {
    const txt = JSON.stringify(serializeConfig(), null, 2);
    download(new Blob([txt], { type: 'application/json' }), 'demoforge_config.json');
    setStatus('config exportée.', 'ok');
  });
  $('cfg-import-btn').addEventListener('click', () => $('cfg-import-file').click());
  $('cfg-import-file').addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try { applyConfig(JSON.parse(await f.text())); setStatus('config rechargée.', 'ok'); }
    catch(err) { setStatus('config invalide : ' + err.message, 'warn'); }
  });

  function applyModule(mod) {
    if (!mod || typeof mod !== 'object') throw new Error('module JSON invalide');
    if (mod.palette) { Object.assign(PALETTES.custom, mod.palette); state.palette = 'custom'; }
    if (mod.raster) state.raster = mod.raster;
    if (mod.engine) Object.assign(state.engine, mod.engine);
    if (mod.variantOverrides) Object.entries(mod.variantOverrides).forEach(([k, v]) => { if (VARIANTS[+k]) Object.assign(VARIANTS[+k], v); });
    if (Array.isArray(mod.effects)) {
      mod.effects.forEach(def => {
        if (!def || !def.name || !def.code) return;
                const userFn = new Function('api', 'frame', 'mask', '"use strict";\n' + def.code);
        const wrapped = (frame, mask) => userFn({ state, renderCanvas, renderCtx, workCanvas, workCtx, currentPalette, clearRender, applyRaster, clamp, hexToRgbA }, frame, mask);
        EFFECTS.push(def.name); EFFECT_FNS.push(wrapped); addEffectOption(def.name, EFFECTS.length - 1);
      });
    }
    applyConfig(serializeConfig());
  }

  $('module-apply').addEventListener('click', () => {
    try { applyModule(JSON.parse($('module-json').value)); setStatus('module JSON appliqué.', 'ok'); }
    catch(e) { setStatus('module JSON refusé : ' + e.message, 'warn'); }
  });

  /* Initial state */
  selEffect.value = 0;
  tagEff.textContent = EFFECTS[0];
  syncColorInputs();

  /* ---------- EXPORT ---------- */
  $('exp-png').addEventListener('click', exportPng);
  $('exp-webm9').addEventListener('click', () => exportWebm('video/webm;codecs=vp9'));
  $('exp-webm8').addEventListener('click', () => exportWebm('video/webm;codecs=vp8'));
  $('exp-html').addEventListener('click', exportHtml);
  $('exp-svg').addEventListener('click', exportSvg);
  $('exp-html-lite').addEventListener('click', () => exportAnimatedHtmlLite());
  $('exp-html-anim').addEventListener('click', () => exportAnimatedHtml());
  $('exp-svg-anim').addEventListener('click', () => exportAnimatedSvg());

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
  }

  function exportPng() {
    try {
      renderCanvas.toBlob((blob) => {
        if (!blob) { setStatus('export PNG impossible (toBlob a échoué).', 'warn'); return; }
        download(blob, 'demoforge_frame.png');
        setStatus('export PNG terminé.', 'ok');
      }, 'image/png');
    } catch(e) {
      setStatus('export PNG impossible : ' + e.message, 'warn');
    }
  }

  function exportHtml() {
    try {
      const dataUrl = renderCanvas.toDataURL('image/png');
      const pal = currentPalette();
      const html = '<!doctype html><meta charset="utf-8"><title>Demoforge snapshot</title>' +
        '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:' + pal.bg + ';font-family:monospace;color:' + pal.ink + '}img{width:100vw;height:100vh;object-fit:cover;display:block}</style>' +
        '<img src="' + dataUrl + '" alt="snapshot">';
      download(new Blob([html], { type: 'text/html' }), 'demoforge_snapshot.html');
      setStatus('export HTML terminé.', 'ok');
    } catch(e) {
      setStatus('export HTML impossible : ' + e.message, 'warn');
    }
  }

  function exportSvg() {
    try {
      const dataUrl = renderCanvas.toDataURL('image/png');
      const w = renderCanvas.width, h = renderCanvas.height;
      const svg = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="100vw" height="100vh" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice">' +
        '<image href="' + dataUrl + '" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid slice"/>' +
        '</svg>';
      download(new Blob([svg], { type: 'image/svg+xml' }), 'demoforge_snapshot.svg');
      setStatus('export SVG terminé.', 'ok');
    } catch(e) {
      setStatus('export SVG impossible : ' + e.message, 'warn');
    }
  }



  function canvasToDataUrlScaled(sourceCanvas, maxWidth, mime, quality) {
    const scale = Math.min(1, maxWidth / sourceCanvas.width);
    const w = Math.max(1, Math.round(sourceCanvas.width * scale));
    const h = Math.max(1, Math.round(sourceCanvas.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sourceCanvas, 0, 0, w, h);
    let url;
    try { url = c.toDataURL(mime, quality); }
    catch(e) { url = c.toDataURL('image/jpeg', quality); }
    return { url, w, h };
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function seekVideo(t) {
    return new Promise((resolve, reject) => {
      let done = false;
      const cleanup = () => {
        srcVideo.removeEventListener('seeked', onSeeked);
        srcVideo.removeEventListener('error', onError);
      };
      const onSeeked = () => { if (done) return; done = true; cleanup(); resolve(); };
      const onError = () => { if (done) return; done = true; cleanup(); reject(new Error('seek vidéo impossible')); };
      srcVideo.addEventListener('seeked', onSeeked, { once: true });
      srcVideo.addEventListener('error', onError, { once: true });
      try { srcVideo.currentTime = clamp(t, 0, Math.max(0, state.totalSec - 0.001)); }
      catch(e) { cleanup(); reject(e); }
      setTimeout(() => { if (!done) { done = true; cleanup(); resolve(); } }, 900);
    });
  }

  async function collectAnimationFrames(opts) {
    const fps = opts.fps || 10;
    const maxWidth = opts.maxWidth || 480;
    const quality = opts.quality || 0.68;
    const mime = opts.mime || 'image/webp';
    const frames = [];
    let w = 0, h = 0;

    if (state.sourceType === 'none') {
      throw new Error('charge une vidéo ou un GIF avant export animé');
    }
    if (state.sourceType === 'youtube') {
      setStatus('export animé : YouTube reste statique en mode local.', 'warn');
    }

    const start = state.inSec || 0;
    const end = Math.max(start + 0.1, state.outSec || state.totalSec || 2);
    const duration = Math.min(Math.max(0.1, end - start), opts.maxDuration || 12);
    const count = Math.max(2, Math.min(opts.maxFrames || 120, Math.ceil(duration * fps)));
    const previousTime = srcVideo.currentTime || 0;
    const wasPaused = srcVideo.paused;

    setStatus('export animé : capture de ' + count + ' frames…', 'info');

    try {
      if (state.sourceType === 'video') {
        srcVideo.pause();
        for (let i = 0; i < count; i++) {
          const t = start + (duration * i / count);
          await seekVideo(t);
          await nextFrame();
          const shot = canvasToDataUrlScaled(renderCanvas, maxWidth, mime, quality);
          frames.push(shot.url); w = shot.w; h = shot.h;
        }
        await seekVideo(previousTime);
        if (!wasPaused) srcVideo.play();
      } else {
        for (let i = 0; i < count; i++) {
          await wait(1000 / fps);
          await nextFrame();
          const shot = canvasToDataUrlScaled(renderCanvas, maxWidth, mime, quality);
          frames.push(shot.url); w = shot.w; h = shot.h;
        }
      }
    } catch(e) {
      if (state.sourceType === 'video' && !wasPaused) srcVideo.play();
      throw e;
    }

    return { frames, w, h, fps, duration: count / fps };
  }

  async function exportAnimatedHtmlLite() {
    try {
      const pal = currentPalette();
      const pack = await collectAnimationFrames({ fps: 6, maxWidth: 320, quality: 0.46, mime: 'image/webp', maxDuration: 8, maxFrames: 48 });
      const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Demoforge lite</title>' +
        '<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:' + pal.bg + '}img{width:100vw;height:100vh;object-fit:cover;display:block}</style>' +
        '<img id="f" width="' + pack.w + '" height="' + pack.h + '"><script>const F=' + JSON.stringify(pack.frames).replace(/</g,'\u003c') + ';let i=0,f=document.getElementById("f");function t(){f.src=F[i++%F.length]}t();setInterval(t,' + Math.round(1000/pack.fps) + ')<\/script>';
      download(new Blob([html], { type: 'text/html' }), 'demoforge_lite_fullscreen.html');
      setStatus('export HTML ultra léger terminé (' + Math.round(html.length/1024) + ' Ko).', 'ok');
    } catch(e) {
      setStatus('export HTML ultra léger impossible : ' + e.message, 'warn');
    }
  }

  async function exportAnimatedHtml() {
    try {
      const pal = currentPalette();
      const pack = await collectAnimationFrames({ fps: 10, maxWidth: 480, quality: 0.66, mime: 'image/webp', maxDuration: 12, maxFrames: 120 });
      const html = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Demoforge animated HTML</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:' + pal.bg + ';color:' + pal.ink + '}body{display:grid;place-items:center}img{width:100vw;height:100vh;object-fit:cover;display:block}.meta{position:fixed;left:8px;bottom:6px;font:11px ui-monospace,Menlo,Consolas,monospace;opacity:.55}</style>' +
        '<img id="f" width="' + pack.w + '" height="' + pack.h + '" alt="Demoforge animation"><div class="meta">' + pack.frames.length + ' frames · ' + pack.fps + ' fps · autonome</div>' +
        '<script>const frames=' + JSON.stringify(pack.frames) + ';let i=0;const img=document.getElementById("f");function tick(){img.src=frames[i++%frames.length]}tick();setInterval(tick,' + Math.round(1000/pack.fps) + ');<\/script></html>';
      download(new Blob([html], { type: 'text/html' }), 'demoforge_motion_compact.html');
      setStatus('export HTML animé terminé (' + Math.round(html.length/1024) + ' Ko avant compression disque).', 'ok');
    } catch(e) {
      setStatus('export HTML animé impossible : ' + e.message, 'warn');
    }
  }

  async function exportAnimatedSvg() {
    try {
      const pack = await collectAnimationFrames({ fps: 8, maxWidth: 420, quality: 0.62, mime: 'image/webp', maxDuration: 10, maxFrames: 80 });
      const frameList = JSON.stringify(pack.frames).replace(/</g, '\\u003c');
      const svg = '<?xml version="1.0" encoding="UTF-8"?>' +
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + pack.w + '" height="' + pack.h + '" viewBox="0 0 ' + pack.w + ' ' + pack.h + '">' +
        '<image id="f" width="' + pack.w + '" height="' + pack.h + '" href="' + pack.frames[0] + '"/>' +
        '<script><![CDATA[(function(){var frames=' + frameList + ';var i=0,img=document.getElementById("f");setInterval(function(){i=(i+1)%frames.length;img.setAttribute("href",frames[i]);img.setAttributeNS("http://www.w3.org/1999/xlink","href",frames[i]);},' + Math.round(1000/pack.fps) + ');})();]]><\/script>' +
        '</svg>';
      download(new Blob([svg], { type: 'image/svg+xml' }), 'demoforge_motion_compact.svg');
      setStatus('export SVG animé terminé (' + Math.round(svg.length/1024) + ' Ko avant compression disque).', 'ok');
    } catch(e) {
      setStatus('export SVG animé impossible : ' + e.message, 'warn');
    }
  }

  async function exportWebm(mime) {
    if (state.sourceType !== 'video') {
      setStatus('export WebM : nécessite une vidéo locale (GIF/YouTube non supportés).', 'warn'); return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setStatus('export WebM impossible : MediaRecorder non supporté.', 'warn'); return;
    }
    if (!renderCanvas.captureStream) {
      setStatus('export WebM impossible : canvas.captureStream non supporté.', 'warn'); return;
    }
    if (!MediaRecorder.isTypeSupported || !MediaRecorder.isTypeSupported(mime)) {
      setStatus('export WebM impossible : codec ' + mime + ' non supporté.', 'warn'); return;
    }
    if (state.recording) { setStatus('export déjà en cours.', 'warn'); return; }

    try {
      const stream = renderCanvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        download(blob, 'demoforge_clip.webm');
        state.recording = false;
        setStatus('export terminé (' + mime + ').', 'ok');
      };
      state.recording = true;
      state.recorder = rec;
      setStatus('export en cours : lecture In → Out…', 'info');

      // Positionne la vidéo à In, joue jusqu'à Out
      srcVideo.pause();
      srcVideo.currentTime = state.inSec;
      await new Promise(r => setTimeout(r, 50));
      rec.start();
      srcVideo.play();

      const tick = () => {
        if (!state.recording) return;
        if (srcVideo.currentTime >= state.outSec || srcVideo.ended) {
          rec.stop();
          srcVideo.pause();
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    } catch(e) {
      state.recording = false;
      setStatus('export WebM échec : ' + e.message, 'warn');
    }
  }

  /* ---------- DRAG & DROP GLOBAL ---------- */
  function setupDragAndDrop() {
    let dragDepth = 0;

    function hasUsableDrop(dt) {
      if (!dt) return false;
      const types = Array.from(dt.types || []);
      return types.includes('Files') || types.includes('text/uri-list') || types.includes('text/plain');
    }

    function showDrop(e) {
      if (!hasUsableDrop(e.dataTransfer)) return;
      e.preventDefault();
      dragDepth++;
      dropOverlay.classList.add('show');
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }

    function keepDrop(e) {
      if (!hasUsableDrop(e.dataTransfer)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }

    function hideDrop(e) {
      if (!hasUsableDrop(e.dataTransfer)) return;
      e.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) dropOverlay.classList.remove('show');
    }

    function consumeDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = 0;
      dropOverlay.classList.remove('show');

      const dt = e.dataTransfer;
      if (!dt) return;

      if (dt.files && dt.files.length) {
        handleDroppedFile(dt.files[0]);
        return;
      }

      const txt = dt.getData('text/uri-list') || dt.getData('text/plain');
      if (txt) {
        handleDroppedText(txt);
      } else {
        setStatus('drop vide ou non pris en charge.', 'warn');
      }
    }

    // Capture = plus robuste : les contrôles internes ne peuvent pas avaler le drop.
    document.addEventListener('dragenter', showDrop, true);
    document.addEventListener('dragover', keepDrop, true);
    document.addEventListener('dragleave', hideDrop, true);
    document.addEventListener('drop', consumeDrop, true);

    // Sécurité hors-fenêtre : évite un overlay bloqué après un drag annulé.
    window.addEventListener('blur', () => {
      dragDepth = 0;
      dropOverlay.classList.remove('show');
    });
  }

  setupDragAndDrop();

  /* ==================================================================
     RENDU EN TEMPS RÉEL
  ================================================================== */

  // Dimensions internes du work canvas (basse rés = perf)
  const WORK_W = 160, WORK_H = 120;
  workCanvas.width = WORK_W; workCanvas.height = WORK_H;
  prevCanvas.width = WORK_W; prevCanvas.height = WORK_H;
  $('dbg-src').width = WORK_W; $('dbg-src').height = WORK_H;
  $('dbg-mask').width = WORK_W; $('dbg-mask').height = WORK_H;
  $('dbg-out').width = WORK_W; $('dbg-out').height = WORK_H;

  // render canvas (4:3 interne)
  renderCanvas.width = 640; renderCanvas.height = 480;

  function grabSourceFrame() {
    workCtx.fillStyle = '#000';
    workCtx.fillRect(0, 0, WORK_W, WORK_H);
    try {
      if (state.sourceType === 'video' && srcVideo.readyState >= 2) {
        workCtx.drawImage(srcVideo, 0, 0, WORK_W, WORK_H);
        return true;
      } else if (state.sourceType === 'gif' && srcGif.complete && srcGif.naturalWidth) {
        workCtx.drawImage(srcGif, 0, 0, WORK_W, WORK_H);
        return true;
      } else if (state.sourceType === 'youtube' && ytThumb.complete && ytThumb.naturalWidth) {
        try { workCtx.drawImage(ytThumb, 0, 0, WORK_W, WORK_H); return true; }
        catch(e) { return false; }
      }
    } catch(e) {}
    return false;
  }

  function buildMask(frame) {
    // frame: ImageData (WORK_W x WORK_H)
    // Retourne Uint8Array (0..255) de la taille WORK_W*WORK_H : valeur = force du masque
    const n = WORK_W * WORK_H;
    const mask = new Uint8Array(n);
    const data = frame.data;

    // motion threshold (0..255)
    const motTh = 8 + (1 - state.engine.motion / 100) * 90; // plus la sensibilité est haute, plus le seuil est bas
    let motionSum = 0;

    const prev = prevCtx.getImageData(0, 0, WORK_W, WORK_H).data;
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const lum = (data[j]*0.299 + data[j+1]*0.587 + data[j+2]*0.114);
      const plum = (prev[j]*0.299 + prev[j+1]*0.587 + prev[j+2]*0.114);
      const diff = Math.abs(lum - plum);
      if (diff > motTh) {
        mask[i] = 255;
        motionSum++;
      }
    }
    state.lastDiffScore = motionSum / n;

    // Fallback : si peu de mouvement, on dérive du contraste / luminance
    if (state.lastDiffScore < 0.02) {
      // calcul luminance moyenne
      let meanL = 0;
      for (let i = 0; i < n; i++) {
        const j = i * 4;
        meanL += (data[j]*0.299 + data[j+1]*0.587 + data[j+2]*0.114);
      }
      meanL /= n;
      const spread = 30;
      for (let i = 0; i < n; i++) {
        if (mask[i]) continue;
        const j = i * 4;
        const lum = (data[j]*0.299 + data[j+1]*0.587 + data[j+2]*0.114);
        // zones significativement plus sombres/claires que la moyenne = foreground probable
        const d = Math.abs(lum - meanL);
        if (d > spread) mask[i] = Math.min(255, (d - spread) * 3 + 120);
      }
    }

    // Dilatation simple (1 passe) pour consolider les blobs
    const out = new Uint8Array(n);
    for (let y = 1; y < WORK_H - 1; y++) {
      for (let x = 1; x < WORK_W - 1; x++) {
        const idx = y * WORK_W + x;
        let m = mask[idx];
        if (!m) {
          if (mask[idx - 1] || mask[idx + 1] || mask[idx - WORK_W] || mask[idx + WORK_W]) m = 180;
        }
        out[idx] = m;
      }
    }

    // Copie frame courante → prev pour la prochaine itération
    prevCtx.drawImage(workCanvas, 0, 0);
    return out;
  }

  function maskToImageData(mask, pal) {
    const id = renderCtx.createImageData(WORK_W, WORK_H);
    const ink = hexToRgb(pal.ink);
    for (let i = 0; i < mask.length; i++) {
      const v = mask[i];
      const j = i * 4;
      id.data[j] = ink.r;
      id.data[j+1] = ink.g;
      id.data[j+2] = ink.b;
      id.data[j+3] = v;
    }
    return id;
  }

  /* ---------- CONTEXT HELPERS ---------- */
  function clearRender(pal) {
    renderCtx.save();
    renderCtx.fillStyle = pal.bg;
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderCtx.restore();
  }

  function drawHalo(pal, strength) {
    if (strength <= 0) return;
    // halo radial subtil avec alpha = strength
    const g = renderCtx.createRadialGradient(
      renderCanvas.width/2, renderCanvas.height/2, renderCanvas.height*0.2,
      renderCanvas.width/2, renderCanvas.height/2, renderCanvas.height*0.75,
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, hexToRgbA(pal.halo, Math.min(0.55, strength)));
    renderCtx.save();
    renderCtx.globalCompositeOperation = 'multiply';
    renderCtx.fillStyle = g;
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
    renderCtx.restore();
  }
  function hexToRgbA(hex, a) {
    const c = hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }

  /* ---------- RASTERS ---------- */
  function applyRaster(pal) {
    const kind = state.raster;
    if (kind === 'none') return;
    const ctx = renderCtx;
    const W = renderCanvas.width, H = renderCanvas.height;
    const v = VARIANTS[state.variant];
    const sizeMul = v.sizeMul;
    const pitch = Math.max(2, Math.round((state.engine.size / 100) * 16 * sizeMul) + 2);

    ctx.save();
    if (kind === 'horizontal-lines') {
      ctx.strokeStyle = hexToRgbA(pal.ink, 0.55);
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += pitch) {
        ctx.beginPath(); ctx.moveTo(0, y+0.5); ctx.lineTo(W, y+0.5); ctx.stroke();
      }
    } else if (kind === 'vertical-lines') {
      ctx.strokeStyle = hexToRgbA(pal.ink, 0.55);
      for (let x = 0; x < W; x += pitch) {
        ctx.beginPath(); ctx.moveTo(x+0.5, 0); ctx.lineTo(x+0.5, H); ctx.stroke();
      }
    } else if (kind === 'scanlines') {
      ctx.fillStyle = hexToRgbA(pal.ink, 0.22);
      for (let y = 0; y < H; y += Math.max(2, pitch/2|0)) ctx.fillRect(0, y, W, 1);
    } else if (kind === 'crt-grid') {
      ctx.strokeStyle = hexToRgbA(pal.accent, 0.35);
      for (let y = 0; y < H; y += pitch) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      for (let x = 0; x < W; x += pitch) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    } else if (kind === 'dot-grid') {
      ctx.fillStyle = hexToRgbA(pal.ink, 0.55);
      for (let y = 0; y < H; y += pitch) {
        for (let x = 0; x < W; x += pitch) {
          ctx.beginPath(); ctx.arc(x, y, Math.max(1, pitch/8), 0, Math.PI*2); ctx.fill();
        }
      }
    } else if (kind === 'checker') {
      ctx.fillStyle = hexToRgbA(pal.ink, 0.28);
      for (let y = 0; y < H; y += pitch) {
        for (let x = 0; x < W; x += pitch) {
          if (((x/pitch)|0 + (y/pitch)|0) % 2 === 0) ctx.fillRect(x, y, pitch, pitch);
        }
      }
    } else if (kind === 'diagonal-lines') {
      ctx.strokeStyle = hexToRgbA(pal.ink, 0.45);
      ctx.lineWidth = 1;
      for (let x = -H; x < W; x += pitch) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
      }
    } else if (kind === 'halftone-dots') {
      // rayon variable basé sur luminance du work canvas
      const id = workCtx.getImageData(0, 0, WORK_W, WORK_H).data;
      const cw = W / WORK_W, ch = H / WORK_H;
      const step = Math.max(1, Math.round(pitch / 3));
      ctx.fillStyle = pal.ink;
      for (let y = 0; y < WORK_H; y += step) {
        for (let x = 0; x < WORK_W; x += step) {
          const j = (y * WORK_W + x) * 4;
          const lum = (id[j]*0.299 + id[j+1]*0.587 + id[j+2]*0.114) / 255;
          const r = (1 - lum) * step * cw * 0.6;
          if (r > 0.3) {
            ctx.beginPath();
            ctx.arc((x + step/2) * cw, (y + step/2) * ch, r, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
    } else if (kind === 'coarse-pixels') {
      // pixelisation par-dessus
      const tmp = document.createElement('canvas');
      const k = Math.max(4, pitch);
      const tw = Math.max(8, Math.round(W / k)), th = Math.max(6, Math.round(H / k));
      tmp.width = tw; tmp.height = th;
      const tctx = tmp.getContext('2d');
      tctx.drawImage(renderCanvas, 0, 0, tw, th);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(tmp, 0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ---------- EFFETS IMPLEMENTATIONS ---------- */

  function effectParams() {
    const v = VARIANTS[state.variant];
    return {
      sizeMul: v.sizeMul,
      contrastMul: v.contrastMul,
      haloMul: v.haloMul,
      size: state.engine.size,      // 1..100
      simplify: state.engine.simplify, // 0..100
      contrast: state.engine.contrast, // 0..200
      halo: state.engine.halo,       // 0..100
      pal: currentPalette(),
    };
  }

  // 1. Silhouette Demoscene : encre sur masque
  function eff_silhouette(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    // bloc size réel (cellule)
    const block = Math.max(2, Math.round((p.size / 100) * 16 * p.sizeMul) + 2);
    const W = renderCanvas.width, H = renderCanvas.height;
    const cw = W / WORK_W, ch = H / WORK_H;
    renderCtx.fillStyle = p.pal.ink;
    const threshold = 100 + (1 - p.contrast/200) * 60;
    for (let y = 0; y < WORK_H; y += Math.max(1, Math.round(block/Math.max(cw,ch)))) {
      for (let x = 0; x < WORK_W; x += Math.max(1, Math.round(block/Math.max(cw,ch)))) {
        const i = y * WORK_W + x;
        if (mask[i] > threshold) {
          renderCtx.fillRect(x*cw, y*ch, block, block);
        }
      }
    }
    // halo
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 2. ASCII Art
  function eff_ascii(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const cell = Math.max(4, Math.round((p.size / 100) * 18 * p.sizeMul) + 4);
    const W = renderCanvas.width, H = renderCanvas.height;
    const cols = Math.floor(W / cell);
    const rows = Math.floor(H / cell);
    const chars = state.chars || ' .:-=+*#%@';
    renderCtx.fillStyle = p.pal.ink;
    renderCtx.font = 'bold ' + Math.round(cell * 1.1) + 'px ' +
      'ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace';
    renderCtx.textBaseline = 'top';
    const data = frame.data;
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const sx = Math.min(WORK_W - 1, Math.round((rx + 0.5) / cols * WORK_W));
        const sy = Math.min(WORK_H - 1, Math.round((ry + 0.5) / rows * WORK_H));
        const j = (sy * WORK_W + sx) * 4;
        let lum = (data[j]*0.299 + data[j+1]*0.587 + data[j+2]*0.114) / 255;
        // contraste
        lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
        const mi = mask[sy * WORK_W + sx];
        // densité combinée
        let density = lum;
        if (mi > 100) density = Math.min(1, density + 0.25);
        const idx = Math.min(chars.length - 1, Math.max(0, Math.floor((1 - density) * (chars.length - 1))));
        const ch = chars.charAt(idx);
        if (ch && ch !== ' ') {
          renderCtx.fillText(ch, rx * cell, ry * cell);
        }
      }
    }
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 3. Pixel Art : quantize palette
  function eff_pixel(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const cell = Math.max(3, Math.round((p.size / 100) * 18 * p.sizeMul) + 3);
    const W = renderCanvas.width, H = renderCanvas.height;
    const cols = Math.floor(W / cell);
    const rows = Math.floor(H / cell);
    const data = frame.data;
    const pal = p.pal;
    const palColors = [pal.bg, pal.alt, pal.halo, pal.accent, pal.ink].map(hexToRgb);

    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        const sx = Math.min(WORK_W - 1, Math.round((rx + 0.5) / cols * WORK_W));
        const sy = Math.min(WORK_H - 1, Math.round((ry + 0.5) / rows * WORK_H));
        const j = (sy * WORK_W + sx) * 4;
        let r = data[j], g = data[j+1], b = data[j+2];
        // contraste
        const c = p.contrast/100;
        r = clamp((r - 128) * c + 128, 0, 255);
        g = clamp((g - 128) * c + 128, 0, 255);
        b = clamp((b - 128) * c + 128, 0, 255);
        // nearest palette color
        let best = palColors[0], bd = 1e9;
        for (const pc of palColors) {
          const d = (pc.r-r)*(pc.r-r) + (pc.g-g)*(pc.g-g) + (pc.b-b)*(pc.b-b);
          if (d < bd) { bd = d; best = pc; }
        }
        renderCtx.fillStyle = 'rgb(' + best.r + ',' + best.g + ',' + best.b + ')';
        renderCtx.fillRect(rx * cell, ry * cell, cell, cell);
      }
    }
    drawHalo(pal, (p.halo/100) * p.haloMul * 0.5);
  }

  // 4. Matrix Rain
  function eff_matrix(frame, mask) {
    const p = effectParams();
    const W = renderCanvas.width, H = renderCanvas.height;
    // fond sombre (pas la palette bg) pour l'effet
    renderCtx.fillStyle = hexToRgbA('#000000', 0.28);
    renderCtx.fillRect(0, 0, W, H);

    const cell = Math.max(6, Math.round((p.size / 100) * 22 * p.sizeMul) + 6);
    const cols = Math.floor(W / cell);
    if (!state.matrixDrops || state.matrixDrops.length !== cols) {
      state.matrixDrops = new Array(cols).fill(0).map(() => Math.random() * H);
    }
    const chars = state.chars || ' .:-=+*#%@';
    renderCtx.font = 'bold ' + Math.round(cell * 0.95) + 'px ui-monospace, monospace';
    renderCtx.textBaseline = 'top';

    for (let c = 0; c < cols; c++) {
      const x = c * cell;
      // sample mask au centre de la colonne
      const sx = Math.min(WORK_W - 1, Math.round((c + 0.5) / cols * WORK_W));
      for (let row = 0; row < Math.floor(H / cell); row++) {
        const y = row * cell;
        const sy = Math.min(WORK_H - 1, Math.round((row + 0.5) * WORK_H / Math.floor(H/cell)));
        const mi = mask[sy * WORK_W + sx];
        const ch = chars.charAt((Math.random() * chars.length) | 0) || '0';
        // brightness = masque
        const alpha = 0.15 + (mi / 255) * 0.85;
        renderCtx.fillStyle = hexToRgbA(p.pal.ink, alpha);
        renderCtx.fillText(ch, x, y);
      }
      // tête brillante
      const hy = state.matrixDrops[c];
      renderCtx.fillStyle = p.pal.accent;
      renderCtx.fillText(chars.charAt((Math.random()*chars.length)|0) || '1', x, hy);
      state.matrixDrops[c] += cell * 0.6;
      if (state.matrixDrops[c] > H) state.matrixDrops[c] = -cell * 5 * Math.random();
    }
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.8);
  }

  // 5. Outline Only (Sobel)
  function eff_outline(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const d = frame.data;
    const edges = new Uint8Array(WORK_W * WORK_H);
    const lum = new Float32Array(WORK_W * WORK_H);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      lum[i] = d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114;
    }
    const th = 20 + (1 - p.contrast/200) * 80;
    for (let y = 1; y < WORK_H - 1; y++) {
      for (let x = 1; x < WORK_W - 1; x++) {
        const i = y*WORK_W + x;
        const gx = -lum[i-1-WORK_W] - 2*lum[i-1] - lum[i-1+WORK_W]
                 +  lum[i+1-WORK_W] + 2*lum[i+1] + lum[i+1+WORK_W];
        const gy = -lum[i-WORK_W-1] - 2*lum[i-WORK_W] - lum[i-WORK_W+1]
                 +  lum[i+WORK_W-1] + 2*lum[i+WORK_W] + lum[i+WORK_W+1];
        const mag = Math.hypot(gx, gy);
        if (mag > th) edges[i] = 255;
      }
    }
    // dessine les edges en scale-up
    const W = renderCanvas.width, H = renderCanvas.height;
    const cw = W / WORK_W, ch = H / WORK_H;
    const thickness = Math.max(1, Math.round((p.size/100) * 6 * p.sizeMul) + 1);
    renderCtx.fillStyle = p.pal.ink;
    for (let y = 0; y < WORK_H; y++) {
      for (let x = 0; x < WORK_W; x++) {
        if (edges[y * WORK_W + x]) {
          renderCtx.fillRect(x*cw, y*ch, thickness, thickness);
        }
      }
    }
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 6. Shadow Dance : trail
  function eff_shadow(frame, mask) {
    const p = effectParams();
    const W = renderCanvas.width, H = renderCanvas.height;
    if (!state.trailCanvas) {
      state.trailCanvas = document.createElement('canvas');
      state.trailCanvas.width = W; state.trailCanvas.height = H;
      state.trailCtx = state.trailCanvas.getContext('2d');
      state.trailCtx.fillStyle = p.pal.bg;
      state.trailCtx.fillRect(0, 0, W, H);
    }
    const tctx = state.trailCtx;
    // fade
    const fade = 0.08 + (p.simplify / 100) * 0.15;
    tctx.fillStyle = hexToRgbA(p.pal.bg, fade);
    tctx.fillRect(0, 0, W, H);
    // draw mask en accent
    const cw = W / WORK_W, ch = H / WORK_H;
    const block = Math.max(2, Math.round((p.size / 100) * 12 * p.sizeMul) + 2);
    tctx.fillStyle = p.pal.ink;
    const th = 80 + (1 - p.contrast/200) * 60;
    for (let y = 0; y < WORK_H; y += 1) {
      for (let x = 0; x < WORK_W; x += 1) {
        if (mask[y * WORK_W + x] > th) {
          tctx.fillRect(x*cw, y*ch, block, block);
        }
      }
    }
    clearRender(p.pal);
    renderCtx.drawImage(state.trailCanvas, 0, 0);
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 7. Rotoscope Retro : posterize + contour
  function eff_roto(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    // posterize via scale-up
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const levels = Math.max(2, 6 - Math.round(p.simplify/25));
    const palCols = [p.pal.bg, p.pal.halo, p.pal.alt, p.pal.accent, p.pal.ink].map(hexToRgb);
    const d = frame.data;
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      let lum = (d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114) / 255;
      lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
      const q = Math.min(levels-1, Math.floor(lum * levels));
      const t = q / (levels - 1);
      const ci = Math.min(palCols.length - 1, Math.round(t * (palCols.length - 1)));
      const c = palCols[ci];
      id.data[j] = c.r; id.data[j+1] = c.g; id.data[j+2] = c.b; id.data[j+3] = 255;
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.drawImage(tmp, 0, 0, W, H);
    // contours noirs
    eff_outlineOverlay(frame, p);
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.6);
  }

  function eff_outlineOverlay(frame, p) {
    const d = frame.data;
    const lum = new Float32Array(WORK_W * WORK_H);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      lum[i] = d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114;
    }
    const th = 25 + (1 - p.contrast/200) * 60;
    const W = renderCanvas.width, H = renderCanvas.height;
    const cw = W / WORK_W, ch = H / WORK_H;
    renderCtx.fillStyle = p.pal.ink;
    for (let y = 1; y < WORK_H - 1; y++) {
      for (let x = 1; x < WORK_W - 1; x++) {
        const i = y*WORK_W + x;
        const gx = -lum[i-1-WORK_W] - 2*lum[i-1] - lum[i-1+WORK_W]
                 +  lum[i+1-WORK_W] + 2*lum[i+1] + lum[i+1+WORK_W];
        const gy = -lum[i-WORK_W-1] - 2*lum[i-WORK_W] - lum[i-WORK_W+1]
                 +  lum[i+WORK_W-1] + 2*lum[i+WORK_W] + lum[i+WORK_W+1];
        const mag = Math.hypot(gx, gy);
        if (mag > th) renderCtx.fillRect(x*cw, y*ch, cw+1, ch+1);
      }
    }
  }

  // 8. Black And White Contrast
  function eff_bwc(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const d = frame.data;
    const th = 128 + (p.contrast - 100) * 0.6;
    const inkC = hexToRgb(p.pal.ink), bgC = hexToRgb(p.pal.bg);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      const lum = d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114;
      const isInk = lum < th;
      const c = isInk ? inkC : bgC;
      id.data[j] = c.r; id.data[j+1] = c.g; id.data[j+2] = c.b; id.data[j+3] = 255;
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.drawImage(tmp, 0, 0, W, H);
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 9. Duotone Retro
  function eff_duo(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const d = frame.data;
    const a = hexToRgb(p.pal.bg), b = hexToRgb(p.pal.ink);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      let lum = (d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114) / 255;
      lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
      id.data[j]   = a.r * (1-lum) + b.r * lum;
      id.data[j+1] = a.g * (1-lum) + b.g * lum;
      id.data[j+2] = a.b * (1-lum) + b.b * lum;
      id.data[j+3] = 255;
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.drawImage(tmp, 0, 0, W, H);
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.8);
  }

  // 10. Vector Minimal : lignes courtes sur bords
  function eff_vector(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const d = frame.data;
    const lum = new Float32Array(WORK_W * WORK_H);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      lum[i] = d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114;
    }
    const W = renderCanvas.width, H = renderCanvas.height;
    const cw = W / WORK_W, ch = H / WORK_H;
    const step = Math.max(2, Math.round((p.size / 100) * 10 * p.sizeMul) + 2);
    const th = 25 + (1 - p.contrast/200) * 60;
    renderCtx.strokeStyle = p.pal.ink;
    renderCtx.lineWidth = Math.max(1, (p.size/100) * 3 * p.sizeMul + 0.5);
    renderCtx.lineCap = 'round';
    renderCtx.beginPath();
    for (let y = 1; y < WORK_H - 1; y += step) {
      for (let x = 1; x < WORK_W - 1; x += step) {
        const i = y*WORK_W + x;
        const gx = -lum[i-1] + lum[i+1];
        const gy = -lum[i-WORK_W] + lum[i+WORK_W];
        const mag = Math.hypot(gx, gy);
        if (mag > th) {
          const ang = Math.atan2(gy, gx) + Math.PI/2;
          const len = step * 0.9;
          const cx = x * cw, cy = y * ch;
          const dx = Math.cos(ang) * len * cw * 0.5;
          const dy = Math.sin(ang) * len * ch * 0.5;
          renderCtx.moveTo(cx - dx, cy - dy);
          renderCtx.lineTo(cx + dx, cy + dy);
        }
      }
    }
    renderCtx.stroke();
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.5);
  }

  // 11. Ink Cutout : masque + texture bruit
  function eff_ink(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    const cw = W / WORK_W, ch = H / WORK_H;
    const th = 90 + (1 - p.contrast/200) * 60;
    // solid ink on mask
    renderCtx.fillStyle = p.pal.ink;
    const block = Math.max(1, Math.round((p.size/100) * 8 * p.sizeMul) + 1);
    for (let y = 0; y < WORK_H; y++) {
      for (let x = 0; x < WORK_W; x++) {
        if (mask[y * WORK_W + x] > th) {
          renderCtx.fillRect(x*cw, y*ch, cw+block*0.2, ch+block*0.2);
        }
      }
    }
    // bruit soustractif : petits trous
    renderCtx.globalCompositeOperation = 'destination-out';
    const holes = Math.round(400 * (p.simplify/100 + 0.3));
    for (let k = 0; k < holes; k++) {
      const rx = Math.random() * W, ry = Math.random() * H;
      const r = 1 + Math.random() * 2.5;
      renderCtx.beginPath(); renderCtx.arc(rx, ry, r, 0, Math.PI*2); renderCtx.fill();
    }
    renderCtx.globalCompositeOperation = 'source-over';
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 12. CRT Vintage : duotone + scanlines intenses + RGB shift simulé
  function eff_crt(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    // base duo
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const d = frame.data;
    const a = hexToRgb(p.pal.bg), b = hexToRgb(p.pal.ink);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      let lum = (d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114) / 255;
      lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
      id.data[j]   = a.r * (1-lum) + b.r * lum;
      id.data[j+1] = a.g * (1-lum) + b.g * lum;
      id.data[j+2] = a.b * (1-lum) + b.b * lum;
      id.data[j+3] = 255;
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = true;
    // RGB offset : 3 passes légères
    renderCtx.save();
    renderCtx.globalCompositeOperation = 'lighter';
    renderCtx.globalAlpha = 0.55;
    renderCtx.drawImage(tmp, -2, 0, W, H);
    renderCtx.drawImage(tmp, 2, 0, W, H);
    renderCtx.globalAlpha = 1.0;
    renderCtx.globalCompositeOperation = 'source-over';
    renderCtx.drawImage(tmp, 0, 0, W, H);
    renderCtx.restore();
    // scanlines courbes
    renderCtx.save();
    const lineH = Math.max(2, Math.round((p.size/100)*6 * p.sizeMul) + 2);
    renderCtx.fillStyle = hexToRgbA('#000', 0.35);
    for (let y = 0; y < H; y += lineH) {
      renderCtx.fillRect(0, y, W, 1);
    }
    // bord sombre (vignette CRT)
    const g = renderCtx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    renderCtx.fillStyle = g;
    renderCtx.fillRect(0, 0, W, H);
    renderCtx.restore();
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 13. Posterized Graphic : 4 niveaux palette
  function eff_poster(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const d = frame.data;
    const levels = Math.max(2, 5 - Math.round(p.simplify/30));
    const cols = [p.pal.bg, p.pal.alt, p.pal.accent, p.pal.halo, p.pal.ink].map(hexToRgb);
    for (let i = 0; i < WORK_W * WORK_H; i++) {
      const j = i * 4;
      let lum = (d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114) / 255;
      lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
      const q = Math.min(levels-1, Math.floor(lum * levels));
      const ci = Math.min(cols.length - 1, Math.round(q / (levels-1) * (cols.length - 1)));
      const c = cols[ci];
      id.data[j] = c.r; id.data[j+1] = c.g; id.data[j+2] = c.b; id.data[j+3] = 255;
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.drawImage(tmp, 0, 0, W, H);
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.6);
  }

  // 14. Ghost Trail : accumulation motion
  function eff_ghost(frame, mask) {
    const p = effectParams();
    const W = renderCanvas.width, H = renderCanvas.height;
    if (!state.ghostCanvas) {
      state.ghostCanvas = document.createElement('canvas');
      state.ghostCanvas.width = W; state.ghostCanvas.height = H;
      state.ghostCtx = state.ghostCanvas.getContext('2d');
      state.ghostCtx.fillStyle = p.pal.bg;
      state.ghostCtx.fillRect(0, 0, W, H);
    }
    const gctx = state.ghostCtx;
    // fade lent
    const fade = 0.04 + (p.simplify / 100) * 0.1;
    gctx.fillStyle = hexToRgbA(p.pal.bg, fade);
    gctx.fillRect(0, 0, W, H);
    // dessine masque coloré avec variance selon mask value
    const cw = W / WORK_W, ch = H / WORK_H;
    const id = gctx.createImageData(W, H);
    // trop coûteux par pixel : on passe par le masque scalé avec fillRect
    const inkC = hexToRgb(p.pal.accent);
    for (let y = 0; y < WORK_H; y++) {
      for (let x = 0; x < WORK_W; x++) {
        const m = mask[y * WORK_W + x];
        if (m > 40) {
          gctx.fillStyle = hexToRgbA(p.pal.accent, m / 255 * 0.8);
          gctx.fillRect(x * cw, y * ch, cw + 1, ch + 1);
        }
      }
    }
    clearRender(p.pal);
    renderCtx.drawImage(state.ghostCanvas, 0, 0);
    // overlay silhouette nette
    renderCtx.fillStyle = p.pal.ink;
    const block = Math.max(2, Math.round((p.size/100) * 10 * p.sizeMul) + 2);
    for (let y = 0; y < WORK_H; y += 2) {
      for (let x = 0; x < WORK_W; x += 2) {
        if (mask[y * WORK_W + x] > 180) {
          renderCtx.fillRect(x*cw, y*ch, block*0.6, block*0.6);
        }
      }
    }
    drawHalo(p.pal, (p.halo/100) * p.haloMul);
  }

  // 15. Amiga Art Sequence : dithering Bayer 4x4
  function eff_amiga(frame, mask) {
    const p = effectParams();
    clearRender(p.pal);
    const W = renderCanvas.width, H = renderCanvas.height;
    const bayer = [
      [ 0, 8, 2,10],
      [12, 4,14, 6],
      [ 3,11, 1, 9],
      [15, 7,13, 5],
    ];
    const tmp = document.createElement('canvas');
    tmp.width = WORK_W; tmp.height = WORK_H;
    const tctx = tmp.getContext('2d');
    const id = tctx.createImageData(WORK_W, WORK_H);
    const d = frame.data;
    const cols = [p.pal.bg, p.pal.alt, p.pal.accent, p.pal.ink].map(hexToRgb);
    for (let y = 0; y < WORK_H; y++) {
      for (let x = 0; x < WORK_W; x++) {
        const i = y * WORK_W + x, j = i * 4;
        let lum = (d[j]*0.299 + d[j+1]*0.587 + d[j+2]*0.114) / 255;
        lum = clamp((lum - 0.5) * (p.contrast/100) + 0.5, 0, 1);
        const threshold = (bayer[y % 4][x % 4] + 0.5) / 16;
        let t = lum + (threshold - 0.5) * 0.4;
        t = clamp(t, 0, 1);
        const ci = Math.min(cols.length - 1, Math.floor(t * cols.length));
        const c = cols[ci];
        id.data[j] = c.r; id.data[j+1] = c.g; id.data[j+2] = c.b; id.data[j+3] = 255;
      }
    }
    tctx.putImageData(id, 0, 0);
    renderCtx.imageSmoothingEnabled = false;
    const cell = Math.max(2, Math.round((p.size/100) * 4 * p.sizeMul) + 2);
    // pixelise à l'echelle définie par size
    const sw = Math.max(32, Math.round(W / cell));
    const sh = Math.max(24, Math.round(H / cell));
    const t2 = document.createElement('canvas');
    t2.width = sw; t2.height = sh;
    t2.getContext('2d').drawImage(tmp, 0, 0, sw, sh);
    renderCtx.drawImage(t2, 0, 0, W, H);
    drawHalo(p.pal, (p.halo/100) * p.haloMul * 0.5);
  }

  const EFFECT_FNS = [
    eff_silhouette, eff_ascii, eff_pixel, eff_matrix,
    eff_outline, eff_shadow, eff_roto, eff_bwc,
    eff_duo, eff_vector, eff_ink, eff_crt,
    eff_poster, eff_ghost, eff_amiga,
  ];

  /* ---------- BOUCLE RAF ---------- */
  function renderFrame() {
    state.rafId = requestAnimationFrame(renderFrame);

    const ok = grabSourceFrame();
    if (!ok) {
      // écran d'attente stylé
      const pal = currentPalette();
      clearRender(pal);
      renderCtx.fillStyle = pal.ink;
      renderCtx.font = 'bold 14px ui-monospace, monospace';
      renderCtx.textAlign = 'center';
      renderCtx.fillText('// déposez une vidéo / gif / url youtube', renderCanvas.width/2, renderCanvas.height/2);
      renderCtx.textAlign = 'start';
      return;
    }

    const frame = workCtx.getImageData(0, 0, WORK_W, WORK_H);
    const mask = buildMask(frame);
    const fn = EFFECT_FNS[state.effect] || eff_silhouette;
    fn(frame, mask);
    applyRaster(currentPalette());

    // loop entre In et Out pour video
    if (state.sourceType === 'video' && state.totalSec > 0) {
      const t = srcVideo.currentTime;
      if (!srcVideo.paused) {
        if (t >= state.outSec - 0.03 || t < state.inSec) {
          srcVideo.currentTime = state.inSec;
        }
      }
      updatePlayhead(t);
    }

    // debug
    if (state.debug) {
      dbgSrc.putImageData(frame, 0, 0);
      dbgMask.putImageData(maskToImageData(mask, currentPalette()), 0, 0);
      dbgOut.drawImage(renderCanvas, 0, 0, WORK_W, WORK_H);
    }
  }

  /* ---------- DEMARRAGE ---------- */
  function checkExportSupport() {
    const caps = [];
    if (typeof MediaRecorder === 'undefined') caps.push('MediaRecorder absent');
    if (!renderCanvas.captureStream) caps.push('captureStream absent');
    if (caps.length) {
      $('exp-webm9').disabled = true;
      $('exp-webm8').disabled = true;
      setStatus('export WebM indisponible (' + caps.join(', ') + ').', 'warn');
    } else {
      if (MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        $('exp-webm9').disabled = true;
      }
      if (MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        $('exp-webm8').disabled = true;
      }
    }
  }

  srcVideo.addEventListener('timeupdate', () => updatePlayhead(srcVideo.currentTime));
  srcVideo.addEventListener('durationchange', () => {
    state.totalSec = srcVideo.duration || 0;
    if (!state.outSec || state.outSec > state.totalSec) state.outSec = state.totalSec;
    updateTimecodesUI();
  });
  srcVideo.addEventListener('error', () => setStatus('erreur de chargement vidéo.', 'warn'));
  ytThumb.addEventListener('error', () => setStatus('miniature YouTube non chargée (offline ?).', 'warn'));

  checkExportSupport();
  updateTimecodesUI();
  renderFrame();
})();
