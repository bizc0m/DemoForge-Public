function sanitizeFileStem(value){
  return (value || "demoforge")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "demoforge";
}

export function triggerBlobDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function mimeForExport(format){
  if(typeof MediaRecorder === "undefined") return "";
  const preferred = format === "webm-vp8" ? "video/webm;codecs=vp8" : "video/webm;codecs=vp9";
  if(MediaRecorder.isTypeSupported(preferred)) return preferred;
  if(MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) return "video/webm;codecs=vp8";
  if(MediaRecorder.isTypeSupported("video/webm")) return "video/webm";
  return "";
}

export function exportSvgSnapshot({ svgMarkup, presetId }){
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const filename = `${sanitizeFileStem(presetId)}-${Date.now()}.svg`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

export function exportHtmlSnapshot({ pngDataUrl, presetId, configSnapshot }){
  const escapedConfig = JSON.stringify(configSnapshot).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>DemoForge Snapshot</title><style>:root{color-scheme:dark}html,body{margin:0;height:100%;background:#090909;color:#f8f4ea;font-family:"Trebuchet MS","Avenir Next",sans-serif}body{display:grid;place-items:center;overflow:hidden}main{position:relative;width:100vw;height:100vh;display:grid;place-items:center}img{width:100vw;height:100vh;object-fit:contain;background:#111}aside{position:fixed;left:20px;bottom:20px;max-width:min(440px,calc(100vw - 40px));padding:14px 16px;border-radius:18px;background:rgba(0,0,0,.58);backdrop-filter:blur(12px);font-size:12px;line-height:1.5;border:1px solid rgba(255,255,255,.1)}strong{display:block;margin-bottom:6px}</style></head><body><main><img alt="DemoForge snapshot" src="${pngDataUrl}"><aside><strong>DemoForge Motion Studio</strong>Export HTML plein ecran a partir du rendu preview.<br><br><code id="cfg"></code></aside></main><script>const snapshot=${escapedConfig};document.getElementById("cfg").textContent=JSON.stringify(snapshot.controls,null,2);</script></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const filename = `${sanitizeFileStem(presetId)}-${Date.now()}.html`;
  triggerBlobDownload(blob, filename);
  return { blob, filename };
}

export function exportPngSnapshot({ renderCanvas, presetId }){
  return new Promise((resolve, reject) => {
    renderCanvas.toBlob((blob) => {
      if(!blob){
        reject(new Error("Le PNG n'a pas pu etre genere."));
        return;
      }
      const filename = `${sanitizeFileStem(presetId)}-${Date.now()}.png`;
      triggerBlobDownload(blob, filename);
      resolve({ blob, filename });
    }, "image/png");
  });
}
