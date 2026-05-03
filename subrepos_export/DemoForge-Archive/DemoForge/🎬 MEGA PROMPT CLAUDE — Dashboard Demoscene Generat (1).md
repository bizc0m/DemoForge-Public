<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 🎬 MEGA PROMPT CLAUDE — Dashboard Demoscene Generator HTML

Voici le prompt optimisé à fond, qui exploite à mort toutes les références et tous les auteurs identifiés. Copie-colle ça directement dans Claude.

***

## 🧠 CONTEXTE GÉNÉRAL

Tu es un **expert absolute de la demoscene** avec une maîtrise parfaite de WebGL, GLSL, Canvas 2D, Three.js et de l'histoire complète de la scene depuis les Amiga/Atari ST jusqu'au web moderne. Tu connais le code source de p01, Ninjadev/nin, FMS_Cat/Automaton, seancode/demofx, CODEF, Rocket, et l'architecture de Second Reality de Future Crew. Tu es capable de construire un outil autosuffisant, impressionnant, dans un seul fichier HTML.

***

## 🎯 OBJECTIF

Créer un fichier **`demomaker.html`** unique, complet, fonctionnel immédiatement dans le navigateur — un **Dashboard Demoscene Generator** qui permet à un utilisateur de composer des démos scene-style sans écrire une seule ligne de code, avec :

- Un moteur de rendu WebGL 2.0 (fallback Canvas 2D)
- Une bibliothèque d'au moins **14 effets GLSL** sélectionnables
- Une timeline visuelle style **Rocket / Automaton (FMS_Cat)**
- Un éditeur GLSL inline avec hot-reload
- Un moteur audio Web Audio API avec sync BPM
- Une interface dark demoscene (palette cyan \#00ffff, vert \#00ff41, fond \#0a0a0a)
- Export HTML autonome minifié pour catégories 1K / 4K

**ZÉRO dépendance externe** sauf CDN optionnel Three.js. Tout en inline.

***

## 📚 RÉFÉRENCES ET INSPIRATIONS (À EXPLOITER À MORT)

### Auteurs \& Projets à étudier comme source d'inspiration technique :

| Auteur/Projet | URL | Apport technique |
| :-- | :-- | :-- |
| **Inigo Quilez (iq)** | https://shadertoy.com, https://iquilezles.org/articles | Raymarching SDF, mathématiques de distance field, palettes procédurales |
| **p01 (Mathieu Henri)** | http://www.p01.org | JS vanilla ultra-compressé, effets Canvas oldschool |
| **FMS_Cat / Automaton** | https://github.com/fms-cat/automaton-with-gui | Timeline animation engine avec GUI, sync audio/visuel |
| **Ninjadev / nin** | https://github.com/ninjadev/nin | Demo tool WebGL open source, 343 stars, architecture modulaire |
| **seancode / demofx** | https://seancode.com/demofx | Fire, Plasma, Metaballs en Canvas 2D, code commenté |
| **CODEF** | https://github.com/nicoptere/CODEF | Canvas Oldschool Demo Effect Framework |
| **BitSavage** | https://github.com/BitSavage/demoscene_javascript | Effets oldschool JS vanilla |
| **mkhj** | https://github.com/mkhj/Demoscene-effects | RotoZoom, Starfield, Tunnel en WebGL |
| **Gargaj / Bonzomatic** | https://github.com/Gargaj/Bonzomatic | Live shader coding, shader battle |
| **Future Crew / Second Reality** | https://github.com/mtuomi/SecondReality | Référence historique, structure de démo classique |
| **Rocket (GNU Rocket)** | https://github.com/rocket/rocket | Sync-tracker musique/visuel, timeline JSON |
| **Cables.gl** | https://cables.gl | Interface node-based visuelle, prototypage rapide |
| **mdabek** | https://github.com/mdabek/html_demoscene | Three.js + Canvas structure organisée |
| **Hellenic/demoscene-engine** | https://github.com/Hellenic/demoscene-engine | Engine JS avec loading dynamique, progress bar, audio player |
| **JS1024 / JS13K** | https://js1024.fun, https://js13kgames.com | Code golf, minification extrême |
| **Demoscene Source Archive** | https://github.com/demoscene-source-archive | Archives source 50+ repos |
| **psykon/awesome-demoscene** | https://github.com/psykon/awesome-demoscene | Liste curatée complète |

### Sites de référence à consulter pour les effets :

- **Pouet.net** — base de données prods, catégories JavaScript/HTML
- **Demozoo.org** — archive historique avec productions et auteurs
- **Scene.org** — dépôt officiel
- **Democyclopedia** — liste exhaustive des effets
- **SizeCoding.org** — wiki effets ultra-petite taille
- **Demoparty.net** — événements mondiaux

***

## 🏗️ ARCHITECTURE DU FICHIER `demomaker.html`

### Structure HTML attendue :

```
demomaker.html
├── <!DOCTYPE html>
├── <head>
│   ├── <style> — CSS Grid, dark theme, layout colonne 3
│   │   ├── Palette : #0a0a0a fond, #00ffff cyan, #00ff41 vert
│   │   ├── Police : VT323 ou Share Tech Mono (Google Fonts)
│   │   └── Responsive 1920px / 1280px
│   └── <script> — tout le JS/GLSL inline
├── <body>
│   ├── anvas id="main"> — rendu principal fullscreen
│   └── <div id="ui"> — interface overlay
│       ├── #effects-panel — gauche : liste des effets (14+)
│       ├── #params-panel — droite : paramètres effet actif
│       ├── #timeline — bas : séquenceur visuel
│       └── #glsl-editor — overlay éditeur de code
└── <script>
    ├── WebGL Engine (setup, compile, uniforms)
    ├── Effects Library (const strings GLSL commentées)
    ├── Timeline Engine (inspiré Rocket + Automaton)
    ├── Audio Engine (Web Audio API, FFT, BPM detect)
    ├── UI Controller (panneaux, drag, fullscreen)
    └── Export Module (PNG/GIF capture, HTML minifié, share URL hash)
```


***

## 🎨 LIBRAIRIE D'EFFETS (CATÉGORIE PAR CATÉGORIE)

### CATÉGORIE 1 — Effets 2D Canvas/CSS (à implémenter en GLSL fragment shader)

```
PLASMA
  ├── Additive sinus RGB (r = sin(x+y+time), g = sin(x-y+time*1.3), b = sin(y+time*0.7))
  ├── Color cycling palette (HSL rotation)
  └── Paletteless plasma (direct RGB manipulation)

FIRE
  ├── Pixel averaging + cooling gradient
  ├── Palette gradient black → orange → white
  └── Random seed row bottom (fuel injection)

STARFIELD
  ├── 2D parallax layers (3 couches de profondeur)
  ├── 3D projection perspective (z-depth)
  └── Warp speed stretch

ROTOZOOM
  ├── UV mapping rotation + scale
  ├── Texture tiling (checkerboard procedural)
  └── Classic checkerboard pattern

TUNNEL
  ├── UV cylindrical mapping (atan2 + radius)
  ├── Texture scroll (offset par time)
  └── Color tunnel (hue shift radial)

SCROLLER
  ├── Horizontal sinewave font
  ├── Vertical scroller
  └── Perspective Mode 7 (3D text rotation)

BLOB / METABALLS
  ├── Distance field sum (1/r^2)
  ├── Threshold rendering
  └── Smooth min SDF

WATER / RIPPLE
  ├── Height field simulation
  ├── Refraction UV distortion
  └── Caustics

RASTER BARS
  ├── Copper bars (sine oscillation y)
  ├── Color cycling
  └── Sine frequency modulation

FRACTAL MANDELBROT
  ├── Julia set
  ├── Color map (cycling palette)
  └── Zoom interactive
```


### CATÉGORIE 2 — Effets 3D WebGL/GLSL (raymarching SDF inspiré de Shadertoy/IQ)

```
RAYMARCHING SDF
  ├── Primitives : Sphere, Box, Torus, Capsule
  ├── Boolean ops : union, subtract, intersect
  ├── Smooth blending smin (Inigo Quilez formula)
  ├── Global Illumination : AO, soft shadows
  ├── Procedural terrain (fbm noise SDF)
  └── Fractales 3D (Mandelbulb, Menger sponge)

VOXEL RENDERING
  ├── Marching cubes algorithm
  ├── Direct voxel raycast
  └── Chunked terrain

PARTICLES
  ├── CPU-driven (JS array + sort)
  ├── GPU-driven (transform feedback)
  └── Physics (gravité, attracteurs)

3D OBJECTS
  ├── Wireframe
  ├── Gouraud shading
  ├── Phong shading
  └── Environment mapping (cube map procedural)
```


### CATÉGORIE 3 — Compositing / Post-Process

```
FEEDBACK LOOP
  ├── Frame delay compositing
  └── Echo / trail effect (alpha blend previous frame)

GLITCH EFFECTS
  ├── Chromatic aberration (RGB channel offset)
  ├── Scanlines (sine + noise)
  └── CRT simulation (curvature + vignette)

COLOR GRADING
  ├── LUT application
  ├── Vignette
  └── Bloom / glow (gaussian blur pass)

MOTION BLUR
  ├── Velocity buffer
  └── Frame accumulation

DOF
  ├── Circle of confusion
  └── Bokeh shader
```


### CATÉGORIE 4 — Typographie \& Texte

```
SCROLLERS
  ├── Sinewave font distortion
  ├── Perspective scroller (3D rotating text)
  └── Bitmap font rendering

FONT EFFECTS
  ├── SDF font (signed distance field)
  └── Pixel font distorter
```


### CATÉGORIE 5 — Audio-Réactif

```
VISUALISEUR
  ├── FFT analyzer (Web Audio API AnalyserNode)
  ├── Waveform oscilloscope
  └── Beat detection (energy threshold)

CHIPTUNE
  ├── WebAudio synthesis (oscillators)
  └── SoundBox-style tracker synth
```


***

## 🎼 TIMELINE \& SÉQUENCEUR (inspiré Rocket + Automaton de FMS_Cat)

Implémenter une timeline visuelle avec :

- **Tracks** configurables (un track par effet)
- **Blend** entre effets (crossfade)
- **BPM sync** via Web Audio API (détecter le beat avec FFT energy spike)
- **Marqueurs de scène** cliquables
- **Export JSON** de la séquence
- **Scrubbing** : clic-drag sur la timeline
- **Zoom** in/out sur la timeline

Format JSON d'export :

```json
{
  "bpm": 128,
  "scenes": [
    {
      "time": 0,
      "effect": "plasma",
      "params": {"frequency": 1.0, "colorOffset": 0.0},
      "duration": 15
    },
    {
      "time": 15,
      "effect": "starfield",
      "params": {"warpSpeed": 2.0},
      "duration": 10
    }
  ]
}
```


***

## 🖥️ ÉDITEUR GLSL INTÉGRÉ

- Zone de code GLSL avec syntax highlighting (implémentation maison lightweight)
- Compilation à la volée avec affichage des erreurs dans l'UI
- Autocomplétion des fonctions GLSL communes : `mix()`, `smoothstep()`, `fract()`, `noise2d()`, `sdfSphere()`, `sdfBox()`, etc.
- Bibliothèque de snippets : noise functions, SDF primitives, color utils, palette generators
- Bouton "Apply" pour hot-reload dans le canvas principal

***

## 🔊 AUDIO ENGINE

- **Chargement** de fichiers audio (.mp3, .wav) via File API
- **Analyse FFT** en temps réel (AnalyserNode, getByteFrequencyData)
- **Beat detection** simple (énergie bass frequencies > threshold)
- **Uniform `u_beat`** (0 ou 1) passé aux shaders pour audio-réactivité
- **Synthèse procédurale** chiptune (oscillateurs WebAudio : saw, square, triangle)

***

## 🎨 INTERFACE UTILISATEUR

### Design system demoscene :

- Fond : `#0a0a0a`
- Accent cyan : `#00ffff`
- Accent vert : `#00ff41`
- Police : VT323 ou Share Tech Mono
- Layout : CSS Grid, 3 colonnes (effects | canvas | params) + timeline bottom


### Panneaux :

- \#effects-panel (gauche) : liste déroulante des 14+ effets avec icônes/miniatures
- \#canvas (centre) : rendu fullscreen, double-buffer
- \#params-panel (droite) : sliders/inputs pour les paramètres de l'effet actif
- \#timeline (bas) : barre temporelle avec tracks, marqueurs, play/pause
- \#glsl-editor (overlay) : éditeur de code GLSL


### Mode présentation :

- Touche `F11` ou bouton : fullscreen, UI masquée
- Touche `ESC` : retour à l'éditeur

***

## 📦 EXPORT \& PARTAGE

- **Capture PNG** du canvas actuel
- **Capture GIF** (sequence de frames, simple encoder JS)
- **Export HTML autonome** (tout le code inline, minifié)
- **Minification** automatique pour cat 1K / 4K (RegPack-style : removal whitespace, shorten var names)
- **Partage URL hash** : paramètres encodés en base64 dans l'URL (`#data=eyJ...`)

***

## ⚡ CONTRAINTES TECHNIQUES STRICTES

- **Zéro dépendance externe** (sauf Google Fonts optionnel)
- **Un seul fichier** : tout inline (CSS + JS + GLSL)
- **Compatible** Chrome, Firefox, Safari (WebGL 2.0)
- **Responsive** : 1920px et 1280px
- **Performances** : 60fps stable sur GPU moderne
- **Pattern minimal WebGL** :
    - Seul timer : `requestAnimationFrame`
    - Uniforms standards : `u_time`, `u_resolution`, `u_mouse`, `u_beat`
    - Double framebuffer pour feedback effects
    - `gl.FLOAT` textures pour simulations
- **Pas de `console.log`** dans la render loop

***

## 📝 STYLE DU CODE

- Commentaires en **anglais**
- Variables explicites
- Chaque effet GLSL dans sa propre `const string` commentée
- Fonctions utilitaires GLSL communes dans un header (noise2d, noise3d, palette, SDF primitives, smoothstep, etc.)
- Gestion propre des erreurs WebGL avec affichage dans l'UI

***

## 🎯 LIVRABLE ATTENDU

Un fichier **`demomaker.html`** complet, fonctionnel, impressionnant visuellement, avec :

- ✅ Au minimum **14 effets actifs** (plasma, fire, tunnel, starfield, rotozoom, raymarching SDF, metaballs, water ripple, raster bars, mandelbrot, particles, scroller, glitch, feedback)
- ✅ Une **timeline opérationnelle** avec play/pause, scrubbing, BPM sync
- ✅ Un **éditeur GLSL intégré** avec hot-reload
- ✅ Un **moteur audio** avec FFT visualizer
- ✅ Interface **dark demoscene** responsive
- ✅ **Export** PNG/GIF/HTML autonome

Ce fichier doit pouvoir être **ouvert directement dans un navigateur** et utilisé immédiatement.

***

## 🚀 BONUS (si le contexte le permet)

- Intégrer un **visualiseur FFT** type oscilloscope qui réagit à la musique
- Ajouter un **effet de scanlines CRT** global en post-process
- Implémenter un **système de presets** : sauvegarder/charger des configurations d'effets
- Ajouter un **mode démo automatique** : play la timeline en boucle avec transitions smooth
- Intégrer les **formules de bruit** d'Inigo Quilez (fbm, turbulence)
- Ajouter un **effet VHS/retro** (RGB split, noise, vignette)
- Implémenter un **particle system GPU** avec attracteurs

***

*Document généré pour la réalisation d'un Dashboard Demoscene Generator HTML inspiré de la scene, exploité à mort les références de p01, FMS_Cat, Ninjadev, seancode, CODEF, Inigo Quilez, Gargaj, Future Crew, et toutes les ressources Pouet.net / Demozoo / Shadertoy.*

---

# Sort moi le code complet pour claude pour realisé ce dashboard

Voici le **code complet du prompt** à copier-coller directement dans Claude. Il est structuré pour que Claude génère le fichier `demomaker.html` en une seule passe, en exploitant toutes les références de la demoscene HTML/JS identifiées (p01, FMS_Cat/Automaton, Ninjadev/nin, seancode/demofx, CODEF, Inigo Quilez, Gargaj, Future Crew, etc.).

***

```
# 🎬 MEGA PROMPT — DEMOSCENE DASHBOARD GENERATOR — demomaker.html

## 🧠 CONTEXTE & RÔLE

Tu es un **expert absolute de la demoscene** avec une maîtrise parfaite de WebGL 2.0, GLSL, Canvas 2D, Three.js et de l'histoire complète de la scene depuis les Amiga/Atari ST jusqu'au web moderne. Tu connais et as étudié le code source de :
- **p01 (Mathieu Henri)** — http://www.p01.org — JS vanilla ultra-compressé, effets Canvas oldschool
- **FMS_Cat / Automaton** — https://github.com/fms-cat/automaton-with-gui — timeline animation engine avec GUI, sync audio/visuel
- **Ninjadev / nin** — https://github.com/ninjadev/nin — demo tool WebGL open source, architecture modulaire
- **seancode / demofx** — https://seancode.com/demofx — Fire, Plasma, Metaballs en Canvas 2D, code commenté
- **CODEF** — https://github.com/nicoptere/CODEF — Canvas Oldschool Demo Effect Framework
- **BitSavage** — https://github.com/BitSavage/demoscene_javascript — effets oldschool JS vanilla
- **mkhj** — https://github.com/mkhj/Demoscene-effects — RotoZoom, Starfield, Tunnel en WebGL
- **Inigo Quilez (iq)** — https://shadertoy.com, https://iquilezles.org/articles — raymarching SDF, mathématiques distance field
- **Gargaj / Bonzomatic** — https://github.com/Gargaj/Bonzomatic — live shader coding
- **Rocket (GNU Rocket)** — https://github.com/rocket/rocket — sync-tracker musique/visuel
- **Cables.gl** — https://cables.gl — interface node-based visuelle
- **Future Crew / Second Reality** — https://github.com/mtuomi/SecondReality — référence historique
- **Hellenic/demoscene-engine** — https://github.com/Hellenic/demoscene-engine — engine JS avec loading dynamique
- **Demoscene Source Archive** — https://github.com/demoscene-source-archive — 50+ repos de sources
- **psykon/awesome-demoscene** — https://github.com/psykon/awesome-demoscene — liste curatée complète

## 🎯 OBJECTIF

Créer un fichier unique **`demomaker.html`** complet, fonctionnel immédiatement dans le navigateur — un **Dashboard Demoscene Generator** qui permet à un utilisateur de composer des démos scene-style sans écrire de code, avec :

- Un moteur de rendu WebGL 2.0 (fallback Canvas 2D)
- Une bibliothèque d'au moins **14 effets GLSL** sélectionnables
- Une timeline visuelle style **Rocket + Automaton (FMS_Cat)**
- Un éditeur GLSL inline avec hot-reload
- Un moteur audio Web Audio API avec sync BPM
- Une interface dark demoscene (palette cyan #00ffff, vert #00ff41, fond #0a0a0a)
- Export HTML autonome minifié pour catégories 1K / 4K

**ZÉRO dépendance externe** sauf Google Fonts. Tout en inline dans un seul fichier HTML.

## 🏗️ STRUCTURE DU FICHIER

demomaker.html
├── <!DOCTYPE html>
├── <head>
│   ├── <meta charset="UTF-8">
│   ├── <title>Demoscene Dashboard Generator</title>
│   ├── <style>
│   │   ├── CSS Grid layout, dark theme
│   │   ├── Palette : #0a0a0a fond, #00ffff cyan, #00ff41 vert
│   │   ├── Police : VT323 ou Share Tech Mono (Google Fonts)
│   │   └── Responsive 1920px / 1280px
│   └── <script> — tout le JS/GLSL inline
├── <body>
│   ├── anvas id="main"> — rendu principal fullscreen
│   └── <div id="ui">
│       ├── #effects-panel — gauche : liste des effets (14+)
│       ├── #params-panel — droite : paramètres effet actif
│       ├── #timeline — bas : séquenceur visuel
│       └── #glsl-editor — overlay éditeur de code
└── <script>
    ├── // ==================== GLSL HEADER (utilitaires communs)
    ├── const GLSL_HEADER = `...`;
    ├── // ==================== EFFET 1: PLASMA
    ├── const GLSL_PLASMA = `...`;
    ├── // ==================== EFFET 2: FIRE
    ├── const GLSL_FIRE = `...`;
    ├── // ... (tous les effets)
    ├── // ==================== WEBGL ENGINE
    ├── class WebGLEngine { ... }
    ├── // ==================== EFFECTS LIBRARY
    ├── const EFFECTS = { ... }
    ├── // ==================== TIMELINE ENGINE
    ├── class TimelineEngine { ... }
    ├── // ==================== AUDIO ENGINE
    ├── class AudioEngine { ... }
    ├── // ==================== UI CONTROLLER
    ├── class UIController { ... }
    ├── // ==================== EXPORT MODULE
    ├── class ExportModule { ... }
    ├── // ==================== INIT
    ├── document.addEventListener('DOMContentLoaded', () => { ... });
```


## 🎨 PALETTE D'EFFETS À IMPLÉMENTER (14 EFFETS MINIMUM)

### EFFET 1 — PLASMA

GLSL fragment shader avec : additive sinus RGB (r=sin(x+y+time), g=sin(x-y+time*1.3), b=sin(y+time*0.7)), color cycling palette (HSL rotation), paletteless plasma option.

### EFFET 2 — FIRE

GLSL fragment shader avec : pixel averaging + cooling gradient, palette gradient black→orange→white, random seed row bottom (fuel injection).

### EFFET 3 — STARFIELD

GLSL fragment shader avec : 3D projection perspective avec z-depth, warp speed stretch, parallax layers.

### EFFET 4 — ROTOZOOM

GLSL fragment shader avec : UV mapping rotation + scale, texture tiling checkerboard procedural.

### EFFET 5 — TUNNEL

GLSL fragment shader avec : UV cylindrical mapping (atan2 + radius), texture scroll offset par time, color tunnel hue shift radial.

### EFFET 6 — SCROLLER

GLSL fragment shader avec : horizontal sinewave font, perspective Mode 7 (3D text rotation), bitmap font rendering.

### EFFET 7 — METABALLS

GLSL fragment shader avec : distance field sum (1/r²), threshold rendering, smooth min SDF.

### EFFET 8 — WATER RIPPLE

GLSL fragment shader avec : height field simulation, refraction UV distortion, caustics.

### EFFET 9 — RASTER BARS

GLSL fragment shader avec : copper bars sine oscillation y, color cycling, sine frequency modulation.

### EFFET 10 — MANDELBROT / JULIA

GLSL fragment shader avec : fractal iteration, color map cycling palette, zoom interactive via mouse.

### EFFET 11 — PARTICLES

GLSL + JS hybrid : CPU-driven particle array avec sort, ou GPU-driven via transform feedback, physics (gravité, attracteurs).

### EFFET 12 — GLITCH / CRT

GLSL fragment shader avec : chromatic aberration (RGB channel offset), scanlines (sine + noise), CRT simulation (curvature + vignette).

### EFFET 13 — FEEDBACK LOOP

GLSL + double framebuffer : frame delay compositing, echo/trail effect (alpha blend previous frame).

### EFFET 14 — RAYMARCHING SDF

GLSL fragment shader inspiré de Shadertoy/Inigo Quilez : primitives SDF (sphere, box, torus, capsule), boolean ops (union/subtract/intersect), smooth blending smin, AO, soft shadows.

## 🔊 AUDIO ENGINE

- Chargement fichiers audio (.mp3, .wav) via File API
- Analyse FFT temps réel (AnalyserNode, getByteFrequencyData)
- Beat detection simple (énergie bass frequencies > threshold)
- Uniform `u_beat` (float 0-1) passé aux shaders pour audio-réactivité
- Synthèse procédurale chiptune (oscillateurs WebAudio : saw, square, triangle)


## 🎼 TIMELINE \& SÉQUENCEUR (inspiré Rocket + Automaton)

Implémenter une timeline visuelle avec :

- Tracks configurables (un track par effet)
- Blend/crossfade entre effets
- BPM sync via Web Audio API (détecter le beat avec FFT energy spike)
- Marqueurs de scène cliquables
- Export/import JSON de la séquence
- Scrubbing : clic-drag sur la timeline
- Zoom in/out sur la timeline
- Play/Pause/Stop/Loop controls

Format JSON d'export :

```json
{
  "bpm": 128,
  "scenes": [
    {
      "time": 0,
      "effect": "plasma",
      "params": {"frequency": 1.0, "colorOffset": 0.0},
      "duration": 15
    }
  ]
}
```


## 🖥️ ÉDITEUR GLSL INTÉGRÉ

- Zone de code GLSL avec syntax highlighting (implémentation maison lightweight — pas de dépendance CodeMirror)
- Compilation à la volée avec affichage des erreurs dans l'UI
- Autocomplétion des fonctions GLSL communes : mix(), smoothstep(), fract(), noise2d(), sdfSphere(), sdfBox(), etc.
- Bibliothèque de snippets : noise functions, SDF primitives, color utils, palette generators
- Bouton "Apply" pour hot-reload dans le canvas principal


## 🎨 INTERFACE UTILISATEUR

Design system demoscene :

- Fond : \#0a0a0a
- Accent cyan : \#00ffff
- Accent vert : \#00ff41
- Police : VT323 ou Share Tech Mono
- Layout : CSS Grid, 3 colonnes (effects | canvas | params) + timeline bottom

Panneaux :

- \#effects-panel (gauche, 200px) : liste des 14+ effets avec icônes/miniatures, sélection au clic
- \#canvas (centre, flex) : rendu fullscreen, double-buffer
- \#params-panel (droite, 250px) : sliders/inputs pour les paramètres de l'effet actif
- \#timeline (bas, 120px) : barre temporelle avec tracks, marqueurs, play/pause
- \#glsl-editor (overlay, modal) : éditeur de code GLSL

Mode présentation :

- Touche F11 ou bouton : fullscreen, UI masquée
- Touche ESC : retour à l'éditeur


## 📦 EXPORT \& PARTAGE

- Capture PNG du canvas actuel (canvas.toDataURL)
- Capture GIF (séquence de frames, simple encoder JS)
- Export HTML autonome (tout le code inline, minifié)
- Minification automatique pour cat 1K/4K (removal whitespace, shorten var names)
- Partage URL hash : paramètres encodés en base64 dans l'URL (\#data=eyJ...)


## ⚡ CONTRAINTES TECHNIQUES STRICTES

- ZÉRO dépendance externe (sauf Google Fonts optionnel)
- Un seul fichier : tout inline (CSS + JS + GLSL)
- Compatible Chrome, Firefox, Safari (WebGL 2.0)
- Responsive : 1920px et 1280px
- Performances : 60fps stable sur GPU moderne
- Pattern minimal WebGL :
    - Seul timer : requestAnimationFrame
    - Uniforms standards : u_time (float), u_resolution (vec2), u_mouse (vec2), u_beat (float)
    - Double framebuffer pour feedback effects
    - gl.FLOAT textures pour simulations
- Pas de console.log dans la render loop
- Gestion propre des erreurs WebGL avec affichage dans l'UI


## 📝 STYLE DU CODE

- Commentaires en anglais
- Variables explicites (pas de obfuscation)
- Chaque effet GLSL dans sa propre const string commentée avec nom d'auteur/inspiration
- Fonctions utilitaires GLSL communes dans un header GLSL (noise2d, noise3d, palette, SDF primitives, smoothstep, fbm, etc.)
- Classes ES6 pour les modules (WebGLEngine, TimelineEngine, AudioEngine, UIController, ExportModule)


## 🚀 BONUS (si contexte le permet)

- Visualiseur FFT type oscilloscope qui réagit à la musique
- Effet de scanlines CRT global en post-process
- Système de presets : sauvegarder/charger des configurations d'effets en localStorage
- Mode démo automatique : play la timeline en boucle avec transitions smooth
- Formules de bruit d'Inigo Quilez (fbm, turbulence, worley noise)
- Effet VHS/retro (RGB split, noise, vignette)
- Particle system GPU avec attracteurs
- Effet kaleidoscope / mirror symmetry
- Effet tunnel coloré avec distortion
- Mode "random" qui génère une démo aléatoire


## 🎯 LIVRABLE

Un fichier **demomaker.html** complet, fonctionnel, impressionnant visuellement, avec :

- ✅ Au minimum 14 effets actifs
- ✅ Une timeline opérationnelle avec play/pause, scrubbing, BPM sync
- ✅ Un éditeur GLSL intégré avec hot-reload
- ✅ Un moteur audio avec FFT visualizer
- ✅ Interface dark demoscene responsive
- ✅ Export PNG/GIF/HTML autonome
- ✅ Ce fichier doit pouvoir être ouvert directement dans un navigateur et utilisé immédiatement

Génère le code complet maintenant.

```

---

## Comment l'utiliser

1. **Ouvre Claude** (Claude.ai ou Claude dans Perplexity)
2. **Colle le prompt complet** ci-dessus
3. **Lance la génération** — Claude va produire le fichier `demomaker.html`
4. **Sauvegarde** le résultat dans un fichier `.html`
5. **Ouvre-le** directement dans ton navigateur

Le prompt est calibré pour que Claude génère tout en **une seule réponse** avec le code complet inline. Si Claude coupe avant la fin, tape simplement **"continue"** pour qu'il reprenne exactement là où il s'est arrêté.```

