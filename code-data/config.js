function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function buildConfigSnapshot({ ui, timeline, metadata }){
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: {
      name: metadata.sourceName || "",
      type: metadata.sourceType || "none",
      note: "Les fichiers locaux ne sont pas inclus. Recharge la source manuellement avant replay/export."
    },
    controls: { ...ui },
    timeline: {
      duration: metadata.timelineDuration || 0,
      segments: timeline
    }
  };
}

export function downloadConfig(snapshot, filename = "demoforge-config.json"){
  downloadBlob(
    new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" }),
    filename
  );
}

export async function readConfigFile(file){
  return JSON.parse(await file.text());
}

export function sanitizeConfig(config){
  const controls = config?.controls && typeof config.controls === "object" ? config.controls : {};
  const timeline = config?.timeline && typeof config.timeline === "object" ? config.timeline : {};
  return {
    controls,
    timeline: {
      duration: Number(timeline.duration) || 0,
      segments: Array.isArray(timeline.segments) ? timeline.segments : []
    }
  };
}
