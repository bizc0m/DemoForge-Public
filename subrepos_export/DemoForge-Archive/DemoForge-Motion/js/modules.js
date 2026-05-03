const FALLBACK_SCRIPT_ID = "effectsModulesData";

function isObject(value){
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clampNumber(value, fallback, min = -Infinity, max = Infinity){
  const parsed = Number(value);
  if(!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function asString(value, fallback = ""){
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sanitizePreset(entry, index){
  return {
    id: asString(entry?.id, `preset-${index + 1}`),
    name: asString(entry?.name, `Preset ${index + 1}`),
    mode: asString(entry?.mode, "silhouette"),
    raster: asString(entry?.raster, "scanlines"),
    palette: asString(entry?.palette, "state"),
    pixel: clampNumber(entry?.pixel, 4, 1, 24),
    chars: typeof entry?.chars === "string" ? entry.chars : "@#%*+=-:. "
  };
}

function sanitizeVariant(entry, index){
  return {
    id: asString(entry?.id, `variant-${index + 1}`),
    name: asString(entry?.name, `Variant ${index + 1}`),
    simplifyOffset: clampNumber(entry?.simplifyOffset, 0, -12, 12),
    contrast: clampNumber(entry?.contrast, 138, 70, 220),
    halo: clampNumber(entry?.halo, 58, 0, 100),
    raster: entry?.raster == null ? null : asString(entry.raster, null),
    palette: entry?.palette == null ? null : asString(entry.palette, null)
  };
}

function sanitizeRaster(entry, index){
  return {
    id: asString(entry?.id, `raster-${index + 1}`),
    name: asString(entry?.name, `Raster ${index + 1}`)
  };
}

function sanitizePalettes(palettes){
  if(!isObject(palettes)) return {};
  return Object.fromEntries(
    Object.entries(palettes).map(([key, value]) => [
      asString(key, "state"),
      {
        bg: asString(value?.bg, "#f4f0df"),
        glow: asString(value?.glow, "#ccd47a"),
        glow2: asString(value?.glow2, "rgba(208,219,112,.30)"),
        ink: asString(value?.ink, "#050505"),
        accent: asString(value?.accent, "#dce88f")
      }
    ])
  );
}

function validateModules(raw){
  const presets = Array.isArray(raw?.presets) ? raw.presets.map(sanitizePreset) : [];
  const variants = Array.isArray(raw?.variants) ? raw.variants.map(sanitizeVariant) : [];
  const rasters = Array.isArray(raw?.rasters) ? raw.rasters.map(sanitizeRaster) : [];
  const palettes = sanitizePalettes(raw?.palettes);

  if(!presets.length || !variants.length || !rasters.length || !Object.keys(palettes).length){
    throw new Error("Le pack de modules est incomplet.");
  }

  return { presets, variants, rasters, palettes };
}

async function readEmbeddedFallback(){
  const node = document.getElementById(FALLBACK_SCRIPT_ID);
  if(!node) throw new Error("Fallback JSON introuvable.");
  return JSON.parse(node.textContent || "{}");
}

export async function loadEffectModules(url = "./modules/effects.json"){
  try{
    const response = await fetch(url, { cache: "no-store" });
    if(!response.ok){
      throw new Error(`HTTP ${response.status}`);
    }
    return validateModules(await response.json());
  }catch{
    return validateModules(await readEmbeddedFallback());
  }
}

export function loadEffectModulesFromObject(raw){
  return validateModules(raw);
}

export async function loadEffectModulesFromFile(file){
  const text = await file.text();
  return validateModules(JSON.parse(text));
}
