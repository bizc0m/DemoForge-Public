import { loadEffectModules, loadEffectModulesFromFile } from "./modules.js";
import { createTimelineController } from "./timeline.js";
import { buildConfigSnapshot, downloadConfig, readConfigFile, sanitizeConfig } from "./config.js";
import { exportHtmlSnapshot, exportPngSnapshot, exportSvgSnapshot, mimeForExport, triggerBlobDownload } from "./export.js";

const renderCanvas = document.getElementById("renderCanvas");
const renderCtx = renderCanvas.getContext("2d");
const workCanvas = document.getElementById("workCanvas");
const workCtx = workCanvas.getContext("2d", { willReadFrequently: true });
const maskCanvas = document.getElementById("maskCanvas");
const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
const layerCanvas = document.createElement("canvas");
const layerCtx = layerCanvas.getContext("2d");

const video = document.getElementById("sourceVideo");
const gif = document.getElementById("sourceGif");
const stageWrap = document.getElementById("canvasWrap");
const fileInput = document.getElementById("fileInput");
const clearSourceBtn = document.getElementById("clearSourceBtn");
const dropZone = document.getElementById("dropZone");
const presetSelect = document.getElementById("presetSelect");
const variantSelect = document.getElementById("variantSelect");
const rasterSelect = document.getElementById("rasterSelect");
const paletteSelect = document.getElementById("paletteSelect");
const exportSelect = document.getElementById("exportSelect");
const charSetInput = document.getElementById("charSetInput");
const motionThreshold = document.getElementById("motionThreshold");
const elementSizeRange = document.getElementById("elementSizeRange");
const simplifyRange = document.getElementById("simplifyRange");
const contrastRange = document.getElementById("contrastRange");
const haloRange = document.getElementById("haloRange");
const captureBgBtn = document.getElementById("captureBgBtn");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const recordBtn = document.getElementById("recordBtn");
const recordSeconds = document.getElementById("recordSeconds");
const downloadBtn = document.getElementById("downloadBtn");
const statusBox = document.getElementById("statusBox");
const enginePill = document.getElementById("enginePill");
const statSource = document.getElementById("statSource");
const statMode = document.getElementById("statMode");
const statExport = document.getElementById("statExport");
const statRaster = document.getElementById("statRaster");
const timelineReadout = document.getElementById("timelineReadout");
const totalTimecode = document.getElementById("totalTimecode");
const trimStartInput = document.getElementById("trimStartInput");
const trimEndInput = document.getElementById("trimEndInput");
const setInBtn = document.getElementById("setInBtn");
const setOutBtn = document.getElementById("setOutBtn");
const currentTimeLabel = document.getElementById("currentTimeLabel");
const durationTimeLabel = document.getElementById("durationTimeLabel");
const selectionTimeLabel = document.getElementById("selectionTimeLabel");
const trimStartLabel = document.getElementById("trimStartLabel");
const trimEndLabel = document.getElementById("trimEndLabel");
const trimDurationLabel = document.getElementById("trimDurationLabel");
const timelineRange = document.getElementById("timelineRange");
const debugToggle = document.getElementById("debugToggle");
const debugPanel = document.getElementById("debugPanel");
const debugSourceCanvas = document.getElementById("debugSourceCanvas");
const debugMaskCanvas = document.getElementById("debugMaskCanvas");
const debugFinalCanvas = document.getElementById("debugFinalCanvas");
const debugSourceCtx = debugSourceCanvas.getContext("2d");
const debugMaskCtx = debugMaskCanvas.getContext("2d");
const debugFinalCtx = debugFinalCanvas.getContext("2d");
const exportConfigBtn = document.getElementById("exportConfigBtn");
const importConfigInput = document.getElementById("importConfigInput");
const importConfigBtn = document.getElementById("importConfigBtn");
const moduleFileInput = document.getElementById("moduleFileInput");
const loadModuleBtn = document.getElementById("loadModuleBtn");
const activeModulePack = document.getElementById("activeModulePack");

const timeline = createTimelineController({
  elements: {
    segmentTrack: document.getElementById("segmentTrack"),
    segmentList: document.getElementById("segmentList"),
    segmentSummary: document.getElementById("segmentSummary"),
    addSegmentBtn: document.getElementById("addSegmentBtn"),
    removeSegmentBtn: document.getElementById("removeSegmentBtn"),
    moveUpBtn: document.getElementById("moveSegmentUpBtn"),
    moveDownBtn: document.getElementById("moveSegmentDownBtn")
  },
  onSelectionChange(segment){
    const start = segment?.start ?? 0;
    const end = segment?.end ?? state.timelineDuration;
    trimStartInput.value = formatTime(start);
    trimEndInput.value = formatTime(end);
    trimStartLabel.textContent = formatTime(start);
    trimEndLabel.textContent = formatTime(end);
    trimDurationLabel.textContent = `${Math.max(0, end - start).toFixed(2)}s`;
  },
  onSegmentsChange(){
    updateTimelineUI();
  },
  onPlayheadScrub(time){
    if(state.sourceType === "video"){
      video.currentTime = time;
    }
    state.isScrubbing = true;
    updateTimelineUI();
  }
});

const state = {
  modules: null,
  sourceType: "none",
  currentSource: null,
  sourceUrl: "",
  sourceName: "",
  backgroundFrame: null,
  lastMask: null,
  currentFrameImageData: null,
  lastMaskCoverage: 0,
  lastDownloadBlob: null,
  lastDownloadName: "",
  recorder: null,
  recordChunks: [],
  matrixDrops: [],
  animationFrame: 0,
  ghostFrames: [],
  timelineDuration: 0,
  pendingTimelineSegments: null,
  isScrubbing: false,
  suppressTimecodeSync: false,
  exportWatchTimer: 0
};

function clamp(value, min, max){
  return Math.max(min, Math.min(max, value));
}

function setStatus(title, detail){
  statusBox.innerHTML = `<strong>${title}</strong> ${detail}`;
}

function formatTime(seconds){
  if(!Number.isFinite(seconds)) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function parseTimecode(value){
  const raw = (value || "").trim();
  if(!raw) return null;
  const normalized = raw.replace(",", ".").replace(/\s+/g, "");
  if(/^\d+(\.\d+)?$/.test(normalized)){
    return Number(normalized);
  }
  const parts = normalized.split(":");
  if(parts.length === 2){
    const mins = Number(parts[0]);
    const secs = Number(parts[1]);
    if(Number.isFinite(mins) && Number.isFinite(secs)) return mins * 60 + secs;
  }
  if(parts.length === 3){
    const hours = Number(parts[0]);
    const mins = Number(parts[1]);
    const secs = Number(parts[2]);
    if(Number.isFinite(hours) && Number.isFinite(mins) && Number.isFinite(secs)) return hours * 3600 + mins * 60 + secs;
  }
  return null;
}

function getElementSize(multiplier = 1, minimum = 1){
  return Math.max(minimum, Number(elementSizeRange.value) * multiplier);
}

function getPreset(){
  return state.modules.presets.find((preset) => preset.id === presetSelect.value) || state.modules.presets[0];
}

function getVariant(){
  return state.modules.variants.find((variant) => variant.id === variantSelect.value) || state.modules.variants[0];
}

function getPalette(){
  return state.modules.palettes[paletteSelect.value] || state.modules.palettes.state;
}

function getExportLabel(format){
  if(format === "svg") return "SVG snapshot";
  if(format === "html") return "HTML fullscreen";
  if(format === "png") return "PNG frame";
  if(format === "webm-vp8") return "WebM VP8";
  return "WebM VP9";
}

function populateSelect(select, items, selected){
  select.innerHTML = "";
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
  if(selected) select.value = selected;
}

function applyModulePack(modules, label = "effects.json"){
  state.modules = modules;
  populateSelect(presetSelect, modules.presets, modules.presets[0]?.id);
  populateSelect(variantSelect, modules.variants, modules.variants[0]?.id);
  populateSelect(rasterSelect, modules.rasters, modules.presets[0]?.raster || modules.rasters[0]?.id);

  paletteSelect.innerHTML = "";
  Object.entries(modules.palettes).forEach(([id]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = id;
    paletteSelect.appendChild(option);
  });
  paletteSelect.value = modules.presets[0]?.palette || "state";
  activeModulePack.textContent = label;
  charSetInput.value = modules.presets[0]?.chars || "@#%*+=-:. MATRIX01";
  applyPreset(getPreset());
}

function applyVariant(){
  const preset = getPreset();
  const variant = getVariant();
  if(variant.raster) rasterSelect.value = variant.raster;
  if(variant.palette) paletteSelect.value = variant.palette;
  simplifyRange.value = String(Math.max(2, Math.min(12, preset.pixel + variant.simplifyOffset)));
  elementSizeRange.value = String(Math.max(1, Math.min(24, preset.pixel + 2 + variant.simplifyOffset * 2)));
  contrastRange.value = String(variant.contrast);
  haloRange.value = String(variant.halo);
  if(!charSetInput.value.trim()){
    charSetInput.value = preset.chars;
  }
  updateStats();
}

function applyPreset(preset){
  rasterSelect.value = preset.raster;
  paletteSelect.value = preset.palette;
  simplifyRange.value = String(preset.pixel);
  if(!charSetInput.value.trim()){
    charSetInput.value = preset.chars;
  }
  applyVariant();
}

function setDropzoneActive(active){
  dropZone.classList.toggle("active", active);
}

function syncRangeLimits(duration){
  state.timelineDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  timelineRange.max = "1000";
  timelineRange.value = "0";
  totalTimecode.value = formatTime(state.timelineDuration);
  timeline.setDuration(state.timelineDuration);
  if(state.timelineDuration && state.pendingTimelineSegments){
    timeline.restoreSegments(state.pendingTimelineSegments);
    state.pendingTimelineSegments = null;
  }
  if(state.timelineDuration){
    const segment = timeline.getSelectedSegment();
    trimStartInput.value = formatTime(segment?.start ?? 0);
    trimEndInput.value = formatTime(segment?.end ?? state.timelineDuration);
  }
  updateTimelineUI();
}

function timeToRangeValue(time){
  if(!state.timelineDuration) return 0;
  return Math.max(0, Math.min(1000, Math.round((time / state.timelineDuration) * 1000)));
}

function rangeValueToTime(value){
  if(!state.timelineDuration) return 0;
  return (Number(value) / 1000) * state.timelineDuration;
}

function updateTimelineUI(){
  const current = state.sourceType === "video" && Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const selected = timeline.getSelectedSegment();
  const totalSelection = timeline.getTotalSelectedDuration();
  timelineReadout.textContent = `${formatTime(current)} / ${formatTime(state.timelineDuration)}`;
  currentTimeLabel.textContent = formatTime(current);
  durationTimeLabel.textContent = formatTime(state.timelineDuration);
  selectionTimeLabel.textContent = `${totalSelection.toFixed(2)}s`;
  trimStartLabel.textContent = formatTime(selected?.start ?? 0);
  trimEndLabel.textContent = formatTime(selected?.end ?? state.timelineDuration);
  trimDurationLabel.textContent = `${Math.max(0, (selected?.end ?? 0) - (selected?.start ?? 0)).toFixed(2)}s`;
  if(!state.suppressTimecodeSync){
    trimStartInput.value = formatTime(selected?.start ?? 0);
    trimEndInput.value = formatTime(selected?.end ?? state.timelineDuration);
  }
  if(state.sourceType === "video" && !state.isScrubbing){
    timelineRange.value = String(timeToRangeValue(current));
  }
  timeline.setPlayhead(current);
}

function updateExportUI(){
  const format = exportSelect.value;
  recordBtn.textContent =
    format === "svg" ? "Exporter SVG" :
    format === "html" ? "Exporter HTML" :
    format === "png" ? "Exporter PNG" :
    format === "webm-vp8" ? "Exporter WebM VP8" :
    "Exporter WebM VP9";
  recordSeconds.disabled = format === "png" || format === "html" || format === "svg";
  statExport.textContent = getExportLabel(format);
}

function updateStats(){
  const preset = getPreset();
  const variant = getVariant();
  enginePill.textContent = `${preset.name} / ${variant.name}`;
  statMode.textContent = preset.name;
  statRaster.textContent = (state.modules.rasters.find((item) => item.id === rasterSelect.value) || state.modules.rasters[0]).name;
  statSource.textContent =
    state.sourceType === "video" ? "Video locale" :
    state.sourceType === "gif" ? "GIF local" :
    "None";
  const localReady = state.sourceType === "video" || state.sourceType === "gif";
  playBtn.disabled = !localReady;
  pauseBtn.disabled = !localReady;
  captureBgBtn.disabled = !localReady;
  recordBtn.disabled = !localReady;
  timelineRange.disabled = !localReady || state.sourceType !== "video";
  updateExportUI();
  updateTimelineUI();
}

function updateDebugUI(){
  debugPanel.classList.toggle("hidden", !debugToggle.checked);
}

function resizeRenderSurfaces(){
  const rect = stageWrap.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.max(240, Math.round(rect.height * dpr));

  if(renderCanvas.width !== width || renderCanvas.height !== height){
    renderCanvas.width = width;
    renderCanvas.height = height;
    layerCanvas.width = width;
    layerCanvas.height = height;
  }

  workCanvas.width = 240;
  workCanvas.height = 180;
  maskCanvas.width = 240;
  maskCanvas.height = 180;
}

function resetLocalSource(){
  if(state.exportWatchTimer){
    clearInterval(state.exportWatchTimer);
    state.exportWatchTimer = 0;
  }
  if(state.sourceUrl){
    URL.revokeObjectURL(state.sourceUrl);
    state.sourceUrl = "";
  }
  video.pause();
  video.removeAttribute("src");
  gif.removeAttribute("src");
  state.currentSource = null;
  state.backgroundFrame = null;
  state.lastMask = null;
  state.ghostFrames = [];
  state.sourceName = "";
  syncRangeLimits(0);
}

function clearSource(){
  resetLocalSource();
  state.sourceType = "none";
  fileInput.value = "";
  updateStats();
  setStatus("Source reinitialisee.", "Charge une video locale ou un GIF pour reprendre le rendu.");
}

function drawCover(ctx, source, sw, sh, dw, dh){
  const srcRatio = sw / sh;
  const dstRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sWidth = sw;
  let sHeight = sh;

  if(srcRatio > dstRatio){
    sWidth = sh * dstRatio;
    sx = (sw - sWidth) * 0.5;
  }else{
    sHeight = sw / dstRatio;
    sy = (sh - sHeight) * 0.5;
  }
  ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, dw, dh);
}

function drawSourceFrame(){
  workCtx.clearRect(0, 0, workCanvas.width, workCanvas.height);
  if(state.sourceType === "video" && video.videoWidth){
    drawCover(workCtx, video, video.videoWidth, video.videoHeight, workCanvas.width, workCanvas.height);
  }else if(state.sourceType === "gif" && gif.naturalWidth){
    drawCover(workCtx, gif, gif.naturalWidth, gif.naturalHeight, workCanvas.width, workCanvas.height);
  }
}

function ensureBackgroundCapture(){
  if(state.sourceType !== "video" && state.sourceType !== "gif"){
    setStatus("Capture impossible.", "Le fond fixe ne s'applique qu'aux sources locales.");
    return;
  }
  drawSourceFrame();
  const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
  state.backgroundFrame = new Uint8ClampedArray(imageData.data);
  setStatus("Fond capture.", "La detection de mouvement est recalee sur l'image actuelle.");
}

function loadLocalFile(file){
  resetLocalSource();
  state.sourceUrl = URL.createObjectURL(file);
  state.sourceName = file.name;

  if(file.type.startsWith("video/")){
    state.sourceType = "video";
    state.currentSource = video;
    video.src = state.sourceUrl;
    video.onloadeddata = () => {
      syncRangeLimits(video.duration || 0);
      video.currentTime = 0;
      timeline.setPlayhead(0);
      video.play().catch(() => {});
      setTimeout(ensureBackgroundCapture, 120);
      updateStats();
      setStatus("Video chargee.", "Timeline multi-segments active, playback et export synchronises.");
    };
  }else if(file.type === "image/gif"){
    state.sourceType = "gif";
    state.currentSource = gif;
    gif.src = state.sourceUrl;
    gif.onload = () => {
      syncRangeLimits(0);
      setTimeout(ensureBackgroundCapture, 120);
      updateStats();
      setStatus("GIF charge.", "Le rendu temps reel est actif sur l'animation GIF.");
    };
  }else{
    state.sourceType = "none";
    setStatus("Format non pris en charge.", "Utilise une video ou un GIF.");
  }
  updateStats();
}

function backgroundFill(ctx, palette){
  const w = renderCanvas.width;
  const h = renderCanvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, w, h);

  const halo = Number(haloRange.value) / 100;
  const gradient = ctx.createRadialGradient(w * 0.5, h * 0.42, 30, w * 0.5, h * 0.42, w * 0.34);
  gradient.addColorStop(0, `rgba(212, 224, 121, ${0.16 + halo * 0.22})`);
  gradient.addColorStop(0.42, palette.glow2);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(0,0,0,.02)";
  ctx.fillRect(0, h * 0.79, w, h * 0.21);
}

function buildMask(){
  if(state.sourceType !== "video" && state.sourceType !== "gif"){
    return null;
  }

  drawSourceFrame();
  const imageData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
  state.currentFrameImageData = imageData;
  const data = imageData.data;
  const threshold = Number(motionThreshold.value);
  const contrast = Number(contrastRange.value) / 100;
  const output = maskCtx.createImageData(workCanvas.width, workCanvas.height);
  const out = output.data;
  let sumLum = 0;

  for(let i = 0; i < data.length; i += 4){
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = r * 0.299 + g * 0.587 + b * 0.114;
    sumLum += lum;
    const bgDiff = state.backgroundFrame
      ? Math.abs(r - state.backgroundFrame[i]) + Math.abs(g - state.backgroundFrame[i + 1]) + Math.abs(b - state.backgroundFrame[i + 2])
      : Math.abs(128 - lum) * 1.8;
    const motionValue = bgDiff / 3;
    const contrastValue = Math.abs(lum - 128) * contrast;
    const active = motionValue + contrastValue * 0.45 > threshold;
    const value = active ? 255 : 0;
    out[i] = value;
    out[i + 1] = value;
    out[i + 2] = value;
    out[i + 3] = 255;
  }

  const smoothed = maskCtx.createImageData(workCanvas.width, workCanvas.height);
  const sData = smoothed.data;
  let activeCount = 0;
  for(let y = 1; y < workCanvas.height - 1; y++){
    for(let x = 1; x < workCanvas.width - 1; x++){
      let sum = 0;
      for(let ky = -1; ky <= 1; ky++){
        for(let kx = -1; kx <= 1; kx++){
          const idx = ((y + ky) * workCanvas.width + (x + kx)) * 4;
          sum += out[idx];
        }
      }
      const idx = (y * workCanvas.width + x) * 4;
      const value = sum > 4 * 255 ? 255 : 0;
      if(value) activeCount++;
      sData[idx] = value;
      sData[idx + 1] = value;
      sData[idx + 2] = value;
      sData[idx + 3] = 255;
    }
  }

  const pixelCount = workCanvas.width * workCanvas.height;
  let coverage = activeCount / pixelCount;

  if(coverage < 0.008){
    const averageLum = sumLum / pixelCount;
    activeCount = 0;
    for(let i = 0; i < data.length; i += 4){
      const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const deviation = Math.abs(lum - averageLum);
      const darkerThanAverage = lum < averageLum - 8;
      const value = (deviation > 18 && darkerThanAverage) || deviation > 36 ? 255 : 0;
      if(value) activeCount++;
      sData[i] = value;
      sData[i + 1] = value;
      sData[i + 2] = value;
      sData[i + 3] = 255;
    }
    coverage = activeCount / pixelCount;
  }

  maskCtx.putImageData(smoothed, 0, 0);
  state.lastMask = smoothed;
  state.lastMaskCoverage = coverage;
  return smoothed;
}

function drawMaskScaled(mode, palette){
  if(!state.lastMask) return;
  const scale = Math.max(2, Math.round((Number(simplifyRange.value) + getElementSize(0.35, 1)) / 2));
  const tinyW = Math.max(16, Math.floor(renderCanvas.width / (scale * 3)));
  const tinyH = Math.max(12, Math.floor(renderCanvas.height / (scale * 3)));
  const tiny = document.createElement("canvas");
  tiny.width = tinyW;
  tiny.height = tinyH;
  const tctx = tiny.getContext("2d");
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(maskCanvas, 0, 0, tinyW, tinyH);

  layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  layerCtx.save();
  layerCtx.imageSmoothingEnabled = false;
  if(mode === "ghost"){
    state.ghostFrames.push(tiny);
    state.ghostFrames = state.ghostFrames.slice(-5);
    state.ghostFrames.forEach((frame, index) => {
      layerCtx.globalAlpha = 0.18 + index * 0.12;
      layerCtx.drawImage(frame, 0, 0, renderCanvas.width, renderCanvas.height);
    });
  }else{
    layerCtx.globalAlpha = 1;
    layerCtx.drawImage(tiny, 0, 0, renderCanvas.width, renderCanvas.height);
  }
  layerCtx.globalCompositeOperation = "source-in";
  layerCtx.fillStyle = palette.ink;
  layerCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
  layerCtx.restore();
  renderCtx.drawImage(layerCanvas, 0, 0);

  if(mode === "shadow"){
    renderCtx.fillStyle = palette.ink;
    renderCtx.globalAlpha = 0.16;
    renderCtx.fillRect(0, renderCanvas.height * 0.82, renderCanvas.width, renderCanvas.height * 0.18);
    renderCtx.globalAlpha = 1;
  }
}

function drawSilhouette(palette){ drawMaskScaled("silhouette", palette); }

function drawPosterized(palette, levels){
  if(!state.currentFrameImageData) drawSourceFrame();
  const scale = Math.max(10, Math.floor(Number(simplifyRange.value) * 2 + getElementSize(2.6, 4)));
  const tinyW = Math.max(32, Math.floor(renderCanvas.width / scale));
  const tinyH = Math.max(24, Math.floor(renderCanvas.height / scale));
  const tiny = document.createElement("canvas");
  tiny.width = tinyW;
  tiny.height = tinyH;
  const tctx = tiny.getContext("2d", { willReadFrequently: true });
  tctx.drawImage(workCanvas, 0, 0, tinyW, tinyH);
  const imageData = tctx.getImageData(0, 0, tinyW, tinyH);
  const data = imageData.data;
  for(let i = 0; i < data.length; i += 4){
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const bucket = Math.floor((lum / 255) * (levels - 1)) / (levels - 1 || 1);
    const shade = Math.round(bucket * 255);
    data[i] = shade;
    data[i + 1] = shade;
    data[i + 2] = shade;
  }
  tctx.putImageData(imageData, 0, 0);
  renderCtx.save();
  renderCtx.globalAlpha = 0.36;
  renderCtx.imageSmoothingEnabled = false;
  renderCtx.drawImage(tiny, 0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.restore();
  drawMaskScaled("silhouette", palette);
}

function drawAscii(palette){
  const chars = (charSetInput.value.trim() || getPreset().chars || "@#%*+=-:. ").split("");
  const block = Math.max(6, Math.round(getElementSize(1.1, 4)));
  const image = (state.currentFrameImageData || workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height)).data;
  const useMask = state.lastMask && state.lastMaskCoverage > 0.008;
  renderCtx.fillStyle = palette.ink;
  renderCtx.textAlign = "center";
  renderCtx.textBaseline = "middle";
  renderCtx.font = `${block * 3.3}px monospace`;

  for(let y = 0; y < workCanvas.height; y += block){
    for(let x = 0; x < workCanvas.width; x += block){
      const idx = (y * workCanvas.width + x) * 4;
      const maskActive = useMask ? state.lastMask.data[idx] > 0 : true;
      if(!maskActive) continue;
      const lum = image[idx] * 0.299 + image[idx + 1] * 0.587 + image[idx + 2] * 0.114;
      const charIndex = Math.max(0, Math.min(chars.length - 1, Math.floor((255 - lum) / 256 * chars.length)));
      const px = x / workCanvas.width * renderCanvas.width;
      const py = y / workCanvas.height * renderCanvas.height;
      renderCtx.fillText(chars[charIndex] || chars[0], px, py);
    }
  }
}

function ensureMatrixDrops(columns){
  if(state.matrixDrops.length === columns) return;
  state.matrixDrops = Array.from({ length: columns }, () => Math.floor(Math.random() * 18));
}

function drawMatrix(palette, frameCount){
  const chars = (charSetInput.value.trim() || getPreset().chars || "MATRIX01").split("");
  const fontSize = Math.max(12, Math.round(getElementSize(2.2, 8)));
  const columns = Math.floor(renderCanvas.width / fontSize);
  ensureMatrixDrops(columns);
  const useMask = state.lastMask && state.lastMaskCoverage > 0.008;

  renderCtx.fillStyle = "rgba(238,244,223,.08)";
  renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.font = `${fontSize}px monospace`;
  renderCtx.textAlign = "center";
  renderCtx.textBaseline = "top";

  for(let i = 0; i < columns; i++){
    const x = i * fontSize + fontSize * 0.5;
    const y = state.matrixDrops[i] * fontSize;
    const maskX = Math.floor((x / renderCanvas.width) * workCanvas.width);
    const maskY = Math.floor((y / renderCanvas.height) * workCanvas.height);
    const idx = (maskY * workCanvas.width + maskX) * 4;
    const inside = useMask ? state.lastMask.data[idx] > 0 : (i > columns * 0.28 && i < columns * 0.72);
    renderCtx.fillStyle = inside ? palette.ink : "rgba(31,92,42,.46)";
    renderCtx.fillText(chars[(frameCount + i) % chars.length] || "0", x, y % (renderCanvas.height + fontSize));
    state.matrixDrops[i] = y > renderCanvas.height + Math.random() * 80 ? 0 : state.matrixDrops[i] + 0.55 + Math.random() * 0.9;
  }
}

function drawOutline(palette){
  if(!state.lastMask) return;
  const image = state.lastMask.data;
  const outline = maskCtx.createImageData(workCanvas.width, workCanvas.height);
  const out = outline.data;
  for(let y = 1; y < workCanvas.height - 1; y++){
    for(let x = 1; x < workCanvas.width - 1; x++){
      const idx = (y * workCanvas.width + x) * 4;
      const edge = image[idx] !== image[idx + 4] || image[idx] !== image[idx + workCanvas.width * 4];
      const value = edge ? 255 : 0;
      out[idx] = value;
      out[idx + 1] = value;
      out[idx + 2] = value;
      out[idx + 3] = 255;
    }
  }
  maskCtx.putImageData(outline, 0, 0);
  if(state.lastMaskCoverage < 0.008){
    drawPosterized(palette, 2);
  }
  drawMaskScaled("outline", palette);
}

function drawVector(palette){
  drawMaskScaled("silhouette", palette);
  renderCtx.save();
  renderCtx.globalAlpha = 0.1;
  renderCtx.strokeStyle = palette.ink;
  const step = Math.max(8, Math.round(getElementSize(1.2, 6)));
  for(let y = 0; y < renderCanvas.height; y += step){
    renderCtx.beginPath();
    renderCtx.moveTo(0, y);
    renderCtx.lineTo(renderCanvas.width, y);
    renderCtx.stroke();
  }
  renderCtx.restore();
}

function drawGhost(palette){ drawMaskScaled("ghost", palette); }

function drawAmiga(palette){
  drawPosterized(palette, 3);
  renderCtx.save();
  renderCtx.globalAlpha = 0.92;
  renderCtx.strokeStyle = "rgba(0,0,0,.08)";
  const step = Math.max(4, Math.round(getElementSize(0.6, 3)));
  for(let y = 0; y < renderCanvas.height; y += step){
    renderCtx.beginPath();
    renderCtx.moveTo(0, y);
    renderCtx.lineTo(renderCanvas.width, y);
    renderCtx.stroke();
  }
  renderCtx.restore();
}

function drawPixel(palette){
  renderCtx.save();
  renderCtx.imageSmoothingEnabled = false;
  drawPosterized(palette, 2);
  renderCtx.globalAlpha = 0.22;
  renderCtx.fillStyle = palette.accent;
  const size = Math.max(12, Math.round(getElementSize(3.2, 10)));
  for(let y = 0; y < renderCanvas.height; y += size){
    for(let x = 0; x < renderCanvas.width; x += size){
      if(((x / size) + (y / size)) % 2 === 0){
        renderCtx.fillRect(x, y, size, size);
      }
    }
  }
  renderCtx.restore();
}

function drawContrastFx(palette){
  renderCtx.save();
  drawPosterized(palette, 2);
  renderCtx.globalAlpha = 0.2;
  renderCtx.fillStyle = palette.ink;
  renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.restore();
}

function drawCrtFx(palette){
  drawPosterized(palette, 4);
  renderCtx.save();
  renderCtx.globalAlpha = 0.18;
  renderCtx.fillStyle = palette.accent;
  renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.restore();
}

function drawDuotoneFx(palette){
  drawPosterized(palette, 3);
  renderCtx.save();
  renderCtx.globalCompositeOperation = "multiply";
  renderCtx.fillStyle = palette.accent;
  renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);
  renderCtx.restore();
}

function drawPosterFx(palette){
  drawPosterized(palette, 4);
  renderCtx.save();
  renderCtx.globalAlpha = 0.2;
  renderCtx.fillStyle = palette.accent;
  const step = Math.max(10, Math.round(getElementSize(2.2, 8)));
  for(let y = 0; y < renderCanvas.height; y += step){
    renderCtx.fillRect(0, y, renderCanvas.width, 2);
  }
  renderCtx.restore();
}

function drawShadowDance(palette){
  if(!state.lastMask) return;
  renderCtx.save();
  renderCtx.globalAlpha = 0.2;
  layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
  layerCtx.globalCompositeOperation = "source-over";
  layerCtx.drawImage(maskCanvas, 0, 0, renderCanvas.width, renderCanvas.height);
  layerCtx.globalCompositeOperation = "source-in";
  layerCtx.fillStyle = palette.accent;
  layerCtx.fillRect(0, 0, layerCanvas.width, layerCanvas.height);
  layerCtx.globalCompositeOperation = "source-over";
  renderCtx.drawImage(layerCanvas, -getElementSize(2.8, 10), getElementSize(1.2, 4));
  renderCtx.drawImage(layerCanvas, getElementSize(2.8, 10), getElementSize(1.8, 6));
  renderCtx.restore();
  drawMaskScaled("silhouette", palette);
}

function drawRotoscopeRetro(palette){
  drawPosterized(palette, 5);
  renderCtx.save();
  renderCtx.globalAlpha = 0.75;
  drawOutline(palette);
  renderCtx.restore();
}

function drawInkCutout(palette){
  drawSilhouette(palette);
  renderCtx.save();
  renderCtx.globalAlpha = 0.2;
  renderCtx.fillStyle = palette.accent;
  const radius = Math.max(2, getElementSize(0.22, 2));
  const step = Math.max(8, Math.round(getElementSize(1.8, 6)));
  for(let y = 0; y < renderCanvas.height; y += step){
    for(let x = 0; x < renderCanvas.width; x += step){
      if(((x + y) / step) % 2 !== 0) continue;
      renderCtx.beginPath();
      renderCtx.arc(x, y, radius, 0, Math.PI * 2);
      renderCtx.fill();
    }
  }
  renderCtx.restore();
}

function drawRaster(type, palette){
  const w = renderCanvas.width;
  const h = renderCanvas.height;
  const unit = Math.max(2, Math.round(getElementSize(0.9, 2)));
  renderCtx.save();
  renderCtx.globalAlpha = 0.24;
  renderCtx.strokeStyle = palette.accent;
  renderCtx.fillStyle = palette.accent;
  renderCtx.lineWidth = 1;

  if(type === "horizontal-lines" || type === "scanlines"){
    const step = type === "scanlines" ? Math.max(2, unit) : Math.max(4, unit * 2);
    for(let y = 0; y < h; y += step){
      renderCtx.beginPath();
      renderCtx.moveTo(0, y);
      renderCtx.lineTo(w, y);
      renderCtx.stroke();
    }
  }else if(type === "vertical-lines"){
    for(let x = 0; x < w; x += Math.max(6, unit * 2)){
      renderCtx.beginPath();
      renderCtx.moveTo(x, 0);
      renderCtx.lineTo(x, h);
      renderCtx.stroke();
    }
  }else if(type === "crt-grid"){
    for(let x = 0; x < w; x += Math.max(8, unit * 2)){
      renderCtx.beginPath();
      renderCtx.moveTo(x, 0);
      renderCtx.lineTo(x, h);
      renderCtx.stroke();
    }
    for(let y = 0; y < h; y += Math.max(4, unit)){
      renderCtx.beginPath();
      renderCtx.moveTo(0, y);
      renderCtx.lineTo(w, y);
      renderCtx.stroke();
    }
  }else if(type === "dot-grid" || type === "halftone-dots"){
    const step = type === "halftone-dots" ? Math.max(8, unit * 3) : Math.max(10, unit * 4);
    const radius = type === "halftone-dots" ? Math.max(1.2, unit * 0.45) : Math.max(1, unit * 0.28);
    for(let y = 0; y < h; y += step){
      for(let x = 0; x < w; x += step){
        renderCtx.beginPath();
        renderCtx.arc(x, y, radius, 0, Math.PI * 2);
        renderCtx.fill();
      }
    }
  }else if(type === "checker"){
    const size = Math.max(10, unit * 4);
    for(let y = 0; y < h; y += size){
      for(let x = 0; x < w; x += size){
        if(((x + y) / size) % 2 === 0){
          renderCtx.fillRect(x, y, size, size);
        }
      }
    }
  }else if(type === "diagonal-lines"){
    for(let x = -h; x < w; x += Math.max(8, unit * 3)){
      renderCtx.beginPath();
      renderCtx.moveTo(x, 0);
      renderCtx.lineTo(x + h, h);
      renderCtx.stroke();
    }
  }else if(type === "coarse-pixels"){
    const size = Math.max(10, Math.round(getElementSize(2.8, 8)));
    for(let y = 0; y < h; y += size){
      for(let x = 0; x < w; x += size){
        if((x / size + y / size) % 2 === 0){
          renderCtx.fillRect(x, y, size, size);
        }
      }
    }
  }
  renderCtx.restore();
}

function renderDebugViews(){
  if(!debugToggle.checked) return;

  debugSourceCtx.clearRect(0, 0, debugSourceCanvas.width, debugSourceCanvas.height);
  debugMaskCtx.clearRect(0, 0, debugMaskCanvas.width, debugMaskCanvas.height);
  debugFinalCtx.clearRect(0, 0, debugFinalCanvas.width, debugFinalCanvas.height);

  if(state.sourceType === "video" || state.sourceType === "gif"){
    debugSourceCtx.drawImage(workCanvas, 0, 0, debugSourceCanvas.width, debugSourceCanvas.height);
    if(state.lastMask){
      debugMaskCtx.drawImage(maskCanvas, 0, 0, debugMaskCanvas.width, debugMaskCanvas.height);
    }
    debugFinalCtx.drawImage(renderCanvas, 0, 0, debugFinalCanvas.width, debugFinalCanvas.height);
    return;
  }

  [debugSourceCtx, debugMaskCtx, debugFinalCtx].forEach((ctx) => {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, debugSourceCanvas.width, debugSourceCanvas.height);
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("No local source", debugSourceCanvas.width * 0.5, debugSourceCanvas.height * 0.5);
  });
}

function renderFrame(frameCount){
  const preset = getPreset();
  const palette = getPalette();
  backgroundFill(renderCtx, palette);

  if(state.sourceType === "video" || state.sourceType === "gif"){
    buildMask();
    switch(preset.mode){
      case "ascii": drawAscii(palette); break;
      case "pixel": drawPixel(palette); break;
      case "matrix": drawMatrix(palette, frameCount); break;
      case "outline": drawOutline(palette); break;
      case "shadow": drawShadowDance(palette); break;
      case "rotoscope": drawRotoscopeRetro(palette); break;
      case "contrast": drawContrastFx(palette); break;
      case "duotone": drawDuotoneFx(palette); break;
      case "vector": drawVector(palette); break;
      case "ink": drawInkCutout(palette); break;
      case "crt": drawCrtFx(palette); break;
      case "poster": drawPosterFx(palette); break;
      case "ghost": drawGhost(palette); break;
      case "amiga": drawAmiga(palette); break;
      case "silhouette":
      default:
        drawSilhouette(palette);
        break;
    }
  }else{
    renderCtx.fillStyle = "rgba(0,0,0,.74)";
    renderCtx.textAlign = "center";
    renderCtx.font = "700 28px monospace";
    renderCtx.fillText("LOAD A LOCAL VIDEO OR GIF", renderCanvas.width * 0.5, renderCanvas.height * 0.48);
    renderCtx.font = "400 16px monospace";
    renderCtx.fillText("Le rendu et les exports utilisent uniquement les medias locaux.", renderCanvas.width * 0.5, renderCanvas.height * 0.55);
  }

  drawRaster(rasterSelect.value, palette);
  renderDebugViews();
}

function enforceSegmentPlayback(){
  if(state.sourceType !== "video" || !state.timelineDuration) return;
  const current = video.currentTime;
  const segment = timeline.getSegmentAtTime(current);
  if(segment){
    if(current >= Math.max(segment.end - 0.02, segment.start)){
      const next = timeline.getNextSegmentAfter(segment.end);
      if(next){
        video.currentTime = next.start;
        if(!video.paused){
          video.play().catch(() => {});
        }
      }
    }
    return;
  }

  const nextTime = timeline.getPlaybackTime(current);
  if(Math.abs(nextTime - current) > 0.001){
    video.currentTime = nextTime;
  }
}

function loop(frameCount = 0){
  enforceSegmentPlayback();
  renderFrame(frameCount);
  updateTimelineUI();
  state.animationFrame = requestAnimationFrame(() => loop(frameCount + 1));
}

function playSource(){
  if(state.sourceType === "video"){
    video.currentTime = timeline.getInitialPlaybackTime(video.currentTime);
    video.play().catch(() => {});
  }
  setStatus("Lecture.", "Le rendu live continue sur le canvas.");
}

function pauseSource(){
  if(state.sourceType === "video"){
    video.pause();
  }
  setStatus("Pause.", "La source locale est en pause.");
}

function buildSvgMarkup(){
  if(!state.lastMask) return "";
  const palette = getPalette();
  const scale = Math.max(4, Math.round(Number(simplifyRange.value) + getElementSize(0.8, 2)));
  const tinyW = Math.max(32, Math.floor(renderCanvas.width / scale));
  const tinyH = Math.max(24, Math.floor(renderCanvas.height / scale));
  const tiny = document.createElement("canvas");
  tiny.width = tinyW;
  tiny.height = tinyH;
  const tctx = tiny.getContext("2d");
  tctx.imageSmoothingEnabled = false;
  tctx.drawImage(maskCanvas, 0, 0, tinyW, tinyH);
  const data = tctx.getImageData(0, 0, tinyW, tinyH).data;
  const cellW = renderCanvas.width / tinyW;
  const cellH = renderCanvas.height / tinyH;
  const rects = [];
  for(let y = 0; y < tinyH; y++){
    for(let x = 0; x < tinyW; x++){
      const idx = (y * tinyW + x) * 4;
      if(data[idx] > 0){
        rects.push(`<rect x="${(x * cellW).toFixed(2)}" y="${(y * cellH).toFixed(2)}" width="${Math.ceil(cellW)}" height="${Math.ceil(cellH)}" fill="${palette.ink}"/>`);
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${renderCanvas.width} ${renderCanvas.height}" width="${renderCanvas.width}" height="${renderCanvas.height}"><rect width="100%" height="100%" fill="${palette.bg}"/><g>${rects.join("")}</g></svg>`;
}

function getUiSnapshot(){
  return {
    preset: presetSelect.value,
    variant: variantSelect.value,
    raster: rasterSelect.value,
    palette: paletteSelect.value,
    exportFormat: exportSelect.value,
    chars: charSetInput.value,
    motionThreshold: Number(motionThreshold.value),
    elementSize: Number(elementSizeRange.value),
    simplify: Number(simplifyRange.value),
    contrast: Number(contrastRange.value),
    halo: Number(haloRange.value),
    debug: debugToggle.checked
  };
}

function getConfigSnapshot(){
  return buildConfigSnapshot({
    ui: getUiSnapshot(),
    timeline: timeline.getSegments(),
    metadata: {
      sourceName: state.sourceName,
      sourceType: state.sourceType,
      timelineDuration: state.timelineDuration
    }
  });
}

async function recordExport(){
  if(state.sourceType !== "video" && state.sourceType !== "gif"){
    setStatus("Export impossible.", "Charge une source locale pour exporter le rendu.");
    return;
  }

  recordBtn.disabled = true;
  renderFrame(0);

  try{
    if(exportSelect.value === "html"){
      const result = exportHtmlSnapshot({
        pngDataUrl: renderCanvas.toDataURL("image/png"),
        presetId: presetSelect.value,
        configSnapshot: getConfigSnapshot()
      });
      state.lastDownloadBlob = result.blob;
      state.lastDownloadName = result.filename;
      downloadBtn.disabled = false;
      setStatus("HTML exporte.", "Le snapshot fullscreen a ete telecharge.");
      return;
    }
    if(exportSelect.value === "svg"){
      const svgMarkup = buildSvgMarkup();
      if(!svgMarkup){
        throw new Error("Le SVG n'est pas disponible pour cette frame.");
      }
      const result = exportSvgSnapshot({ svgMarkup, presetId: presetSelect.value });
      state.lastDownloadBlob = result.blob;
      state.lastDownloadName = result.filename;
      downloadBtn.disabled = false;
      setStatus("SVG exporte.", "Le snapshot vectoriel courant a ete telecharge.");
      return;
    }
    if(exportSelect.value === "png"){
      const result = await exportPngSnapshot({ renderCanvas, presetId: presetSelect.value });
      state.lastDownloadBlob = result.blob;
      state.lastDownloadName = result.filename;
      downloadBtn.disabled = false;
      setStatus("PNG exporte.", "Le frame courant du rendu a ete telecharge.");
      return;
    }
    if(typeof renderCanvas.captureStream !== "function"){
      throw new Error("Ce navigateur ne supporte pas captureStream sur le canvas.");
    }
    const stream = renderCanvas.captureStream(18);
    const mimeType = mimeForExport(exportSelect.value);
    if(!mimeType){
      throw new Error("MediaRecorder n'est pas disponible pour WebM.");
    }

    state.recordChunks = [];
    state.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1400000 });
    const localVideo = state.sourceType === "video";
    const originalTime = localVideo ? video.currentTime : 0;
    const wasPaused = localVideo ? video.paused : true;
    const segments = timeline.getSegments();
    const clipSeconds = localVideo ? Math.max(0.05, timeline.getTotalSelectedDuration()) : Number(recordSeconds.value);

    state.recorder.ondataavailable = (event) => {
      if(event.data.size > 0){
        state.recordChunks.push(event.data);
      }
    };

    state.recorder.onstop = () => {
      if(state.exportWatchTimer){
        clearInterval(state.exportWatchTimer);
        state.exportWatchTimer = 0;
      }
      const blob = new Blob(state.recordChunks, { type: mimeType });
      state.lastDownloadBlob = blob;
      state.lastDownloadName = `demoforge-${presetSelect.value}.${mimeType.includes("webm") ? "webm" : "bin"}`;
      downloadBtn.disabled = false;
      triggerBlobDownload(blob, state.lastDownloadName);
      if(localVideo){
        video.pause();
        video.currentTime = wasPaused ? (segments[0]?.start || 0) : originalTime;
        if(!wasPaused){
          video.play().catch(() => {});
        }
      }
      recordBtn.disabled = false;
      setStatus("Export termine.", `Le clip ${state.lastDownloadName} a ete telecharge.`);
    };

    state.recorder.onerror = (event) => {
      if(state.exportWatchTimer){
        clearInterval(state.exportWatchTimer);
        state.exportWatchTimer = 0;
      }
      recordBtn.disabled = false;
      setStatus("Export echoue.", event?.error?.message || "Erreur inconnue pendant l'export.");
    };

    if(localVideo){
      video.pause();
      video.currentTime = segments[0]?.start || 0;
    }

    state.recorder.start();
    if(localVideo){
      video.play().catch(() => {});
      state.exportWatchTimer = setInterval(() => {
        if(!state.recorder || state.recorder.state !== "recording"){
          clearInterval(state.exportWatchTimer);
          state.exportWatchTimer = 0;
          return;
        }
        const last = segments[segments.length - 1];
        if(last && video.currentTime >= Math.max(last.end - 0.02, last.start)){
          state.recorder.stop();
        }
      }, 30);
    }

    setStatus("Export en cours.", `Capture ${clipSeconds.toFixed(2)}s en ${mimeType}.`);
    setTimeout(() => {
      if(state.recorder && state.recorder.state === "recording"){
        state.recorder.stop();
      }
    }, clipSeconds * 1000 + 120);
  }catch(error){
    recordBtn.disabled = false;
    setStatus("Export impossible.", error.message || String(error));
  }finally{
    if(exportSelect.value === "html" || exportSelect.value === "svg" || exportSelect.value === "png"){
      recordBtn.disabled = false;
    }
  }
}

function downloadLastExport(){
  if(!state.lastDownloadBlob) return;
  triggerBlobDownload(state.lastDownloadBlob, state.lastDownloadName || "demoforge-export.bin");
}

function handleDroppedDataTransfer(dataTransfer){
  if(!dataTransfer) return false;
  const files = Array.from(dataTransfer.files || []);
  const pickedFile = files.find((file) => file.type.startsWith("video/") || file.type === "image/gif");
  if(pickedFile){
    loadLocalFile(pickedFile);
    return true;
  }
  return false;
}

function applyImportedConfig(raw){
  const config = sanitizeConfig(raw);
  const controls = config.controls;
  if(controls.preset) presetSelect.value = controls.preset;
  if(controls.variant) variantSelect.value = controls.variant;
  if(controls.raster) rasterSelect.value = controls.raster;
  if(controls.palette) paletteSelect.value = controls.palette;
  if(controls.exportFormat) exportSelect.value = controls.exportFormat;
  if(typeof controls.chars === "string") charSetInput.value = controls.chars;
  if(Number.isFinite(controls.motionThreshold)) motionThreshold.value = String(controls.motionThreshold);
  if(Number.isFinite(controls.elementSize)) elementSizeRange.value = String(controls.elementSize);
  if(Number.isFinite(controls.simplify)) simplifyRange.value = String(controls.simplify);
  if(Number.isFinite(controls.contrast)) contrastRange.value = String(controls.contrast);
  if(Number.isFinite(controls.halo)) haloRange.value = String(controls.halo);
  debugToggle.checked = Boolean(controls.debug);

  if(state.timelineDuration){
    timeline.restoreSegments(config.timeline.segments);
  }else{
    state.pendingTimelineSegments = config.timeline.segments;
  }

  updateDebugUI();
  updateStats();
  setStatus("Configuration rechargee.", "Les controles et segments ont ete restaures. Recharge la source locale si besoin.");
}

function wireEvents(){
  fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if(file) loadLocalFile(file);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDropzoneActive(true);
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDropzoneActive(false);
    });
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDropzoneActive(false);
    const handled = handleDroppedDataTransfer(event.dataTransfer);
    if(!handled){
      setStatus("Drop non pris en charge.", "Depose une video ou un GIF.");
    }
  });

  clearSourceBtn.addEventListener("click", clearSource);
  captureBgBtn.addEventListener("click", ensureBackgroundCapture);
  playBtn.addEventListener("click", playSource);
  pauseBtn.addEventListener("click", pauseSource);
  recordBtn.addEventListener("click", recordExport);
  downloadBtn.addEventListener("click", downloadLastExport);

  timelineRange.addEventListener("input", () => {
    if(state.sourceType !== "video" || !state.timelineDuration) return;
    state.isScrubbing = true;
    video.currentTime = rangeValueToTime(timelineRange.value);
    updateTimelineUI();
  });
  timelineRange.addEventListener("change", () => {
    if(state.sourceType !== "video" || !state.timelineDuration) return;
    state.isScrubbing = false;
    video.currentTime = rangeValueToTime(timelineRange.value);
    updateTimelineUI();
  });

  trimStartInput.addEventListener("change", () => {
    const segment = timeline.getSelectedSegment();
    if(!segment) return;
    const nextStart = parseTimecode(trimStartInput.value);
    if(nextStart == null) return;
    timeline.updateSelectedBounds({ start: nextStart, end: segment.end });
  });
  trimEndInput.addEventListener("change", () => {
    const segment = timeline.getSelectedSegment();
    if(!segment) return;
    const nextEnd = parseTimecode(trimEndInput.value);
    if(nextEnd == null) return;
    timeline.updateSelectedBounds({ start: segment.start, end: nextEnd });
  });

  setInBtn.addEventListener("click", () => {
    const segment = timeline.getSelectedSegment();
    if(!segment || state.sourceType !== "video") return;
    timeline.updateSelectedBounds({ start: video.currentTime, end: segment.end });
  });
  setOutBtn.addEventListener("click", () => {
    const segment = timeline.getSelectedSegment();
    if(!segment || state.sourceType !== "video") return;
    timeline.updateSelectedBounds({ start: segment.start, end: video.currentTime });
  });

  video.addEventListener("loadedmetadata", () => {
    syncRangeLimits(video.duration || 0);
    updateTimelineUI();
  });
  video.addEventListener("timeupdate", () => {
    if(!state.isScrubbing){
      updateTimelineUI();
    }
  });

  [rasterSelect, paletteSelect, exportSelect, motionThreshold, elementSizeRange, simplifyRange, contrastRange, haloRange].forEach((element) => {
    element.addEventListener("input", updateStats);
    element.addEventListener("change", updateStats);
  });

  presetSelect.addEventListener("change", () => {
    applyPreset(getPreset());
    setStatus("Effet mis a jour.", "L'effet et sa variante ont ete ajustes.");
  });
  variantSelect.addEventListener("change", () => {
    applyVariant();
    setStatus("Variante mise a jour.", "La variante courante a ete appliquee.");
  });
  debugToggle.addEventListener("change", updateDebugUI);

  [trimStartInput, trimEndInput].forEach((input) => {
    input.addEventListener("focus", () => {
      state.suppressTimecodeSync = true;
    });
    input.addEventListener("blur", () => {
      state.suppressTimecodeSync = false;
      updateTimelineUI();
    });
  });

  exportConfigBtn.addEventListener("click", () => {
    downloadConfig(getConfigSnapshot());
    setStatus("Configuration exportee.", "Le JSON de l'etat courant a ete telecharge.");
  });
  importConfigBtn.addEventListener("click", () => importConfigInput.click());
  importConfigInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if(!file) return;
    try{
      applyImportedConfig(await readConfigFile(file));
    }catch(error){
      setStatus("Import impossible.", error.message || "JSON invalide.");
    }finally{
      importConfigInput.value = "";
    }
  });

  loadModuleBtn.addEventListener("click", () => moduleFileInput.click());
  moduleFileInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if(!file) return;
    try{
      applyModulePack(await loadEffectModulesFromFile(file), file.name);
      setStatus("Pack charge.", "Le module JSON a remplace les presets actifs.");
    }catch(error){
      setStatus("Pack invalide.", error.message || "Le JSON du module n'est pas exploitable.");
    }finally{
      moduleFileInput.value = "";
    }
  });

  const resizeObserver = new ResizeObserver(() => resizeRenderSurfaces());
  resizeObserver.observe(stageWrap);

  function handleGlobalDropEvent(event){
    event.preventDefault();
    event.stopPropagation();
    setDropzoneActive(false);
    document.body.classList.remove("dragging");
    const handled = handleDroppedDataTransfer(event.dataTransfer);
    if(!handled){
      setStatus("Drop non pris en charge.", "Depose une video ou un GIF.");
    }
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      event.preventDefault();
      document.body.classList.add("dragging");
      setDropzoneActive(true);
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      document.body.classList.remove("dragging");
      setDropzoneActive(false);
    });
  });

  document.addEventListener("drop", handleGlobalDropEvent);
}

async function init(){
  resizeRenderSurfaces();
  applyModulePack(await loadEffectModules(), "effects.json");
  updateStats();
  updateDebugUI();
  wireEvents();
  loop();
  setStatus("Pret.", "Charge une video locale ou un GIF pour commencer.");
}

init().catch((error) => {
  setStatus("Echec d'initialisation.", error.message || String(error));
});
