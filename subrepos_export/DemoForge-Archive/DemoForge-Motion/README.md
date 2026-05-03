# DemoForge Motion Studio

DemoForge Motion Studio est un module front-end de rendu video/GIF local dans le navigateur. Il sert a charger une source locale, detecter une silhouette ou un mouvement dans un canvas, appliquer des effets demoscene retro, piloter une timeline multi-segments, puis exporter le resultat en `WebM`, `PNG`, `SVG` ou `HTML` fullscreen.

## A quoi sert ce module

- Transformer une video locale ou un GIF en rendu stylise temps reel.
- Construire des decoupes multi-segments directement dans la timeline.
- Tester rapidement des presets d'effets charges depuis JSON.
- Sauvegarder une configuration de travail en JSON puis la recharger.
- Exporter un rendu qui reste visuellement aligne avec la preview.

## Structure

- `index.html` : UI et structure de la page.
- `js/core.js` : pipeline principal, rendu canvas, orchestration des controles.
- `js/timeline.js` : timeline multi-segments, ordre des segments, drag direct des poignées.
- `js/export.js` : exports `HTML`, `WebM`, `PNG`, `SVG`.
- `js/config.js` : export/import de l'etat courant en JSON.
- `js/modules.js` : chargement securise des packs d'effets JSON.
- `modules/effects.json` : pack d'effets par defaut.

## Comportement cle

- UI legacy preservee dans son langage visuel: sidebar, preview, stats, timeline et debug.
- Code YouTube retire completement du flux applicatif.
- Canvas responsive avec adaptation au `devicePixelRatio`.
- Segments ordonnes par index avec selection, reordonnancement et edition directe sur la timeline.
- Aucune dependance externe.

## Usage

1. Ouvrir `index.html` depuis le dossier `Demoforge-Motion-Studio`.
2. Charger une video locale ou un GIF.
3. Ajuster preset, variante, raster, palette et moteur.
4. Creer ou modifier les segments dans la timeline.
5. Exporter le rendu ou la configuration.

## Notes

- La configuration JSON n'embarque pas les medias locaux: il faut recharger la source apres import.
- Le module JSON d'effets est valide avant usage, sans `eval` ni execution dynamique.
- Pour le chargement direct de `modules/effects.json`, un serveur local simple est recommande; un fallback embarque reste present pour conserver le fonctionnement local.
