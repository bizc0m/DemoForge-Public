# Cahier De Synthèse DemoForge V1

## 1. Finalité

Construire un outil de création demoscene web qui soit à la fois :
- modulaire
- pédagogique
- culturellement crédible
- techniquement solide
- exportable en HTML pur fullscreen

L'ambition n'est pas seulement de "faire des effets".
L'ambition est de permettre à un utilisateur de comprendre, combiner, scénariser et exporter une démo, tout en découvrant l'histoire et les logiques de la demoscene.

## 2. ADN du projet

- esprit demoscene oldschool et web moderne
- transmission et valorisation culturelle
- progression par niveaux d'usage
- modularité réelle
- export autonome
- documentation exploitable
- architecture incrémentale

## 3. Promesse produit

L'utilisateur doit pouvoir :
- choisir un type de démo ou une structure de scène
- ajouter des modules d'effets
- régler les paramètres visuels
- comprendre ce qu'il manipule
- organiser une séquence
- prévisualiser en temps réel
- exporter un HTML autonome fullscreen

## 4. Publics visés

- curieux débutant
- amateur de demoscene
- designer / VJ / bidouilleur visuel
- développeur créatif
- pédagogue ou médiateur culturel

## 5. Niveaux d'usage

### LAME

- accès immédiat
- presets majoritaires
- très peu de paramètres
- export simple

### NOOB

- interface guidée
- lexique et explications
- presets commentés
- premiers réglages utiles

### L33T

- paramètres avancés
- enchaînements plus riches
- contrôle de composition
- logique des modules plus visible

### ROXOR

- vue experte
- métadonnées complètes
- réglages bruts
- debug
- structure d'export
- accès à la logique interne

## 6. Contraintes fondatrices

- HTML pur fullscreen comme sortie principale
- autonomie maximale de l'export
- dépendances réduites
- navigateur moderne desktop prioritaire
- performances acceptables
- fallback raisonné si WebGL indisponible
- conservation de l'existant si déjà fonctionnel

## 7. Piliers fonctionnels

### 7.1 Bibliothèque d'effets

L'outil doit proposer une bibliothèque de modules classés par familles, avec pour chacun :
- nom
- famille
- description courte
- description pédagogique
- paramètres
- variantes
- niveau de difficulté
- coût performance
- références historiques
- exemples de démos
- sources ou implémentations équivalentes

### 7.2 Composition

L'utilisateur doit pouvoir construire une démo par :
- calques
- scènes
- clips
- presets
- combinaisons mémorisées

### 7.3 Prévisualisation

Le moteur doit offrir :
- rendu central lisible
- mode fullscreen
- feedback quasi temps réel
- cohérence entre preview et export

### 7.4 Timeline / structure narrative

Le projet doit tendre vers :
- marqueurs de scène
- gestion de durées
- transitions
- superpositions
- synchronisation simple ou audio-réactive

### 7.5 Export

Le projet doit exporter une production HTML autonome avec :
- rendu fullscreen
- configuration embarquée
- métadonnées projet
- crédits
- références utiles
- commentaires ou fallback quand nécessaire

## 8. Modules prioritaires

Le socle minimal recommandé regroupe 14 grandes familles :

1. Copper / Raster Bars
2. Scrollers
3. Starfields
4. Plasma
5. Fire / Fluids simples
6. Tunnel / Rotozoom / UV Deform
7. Logos / Sprites / Overlays
8. Matrix / Glitch / CRT
9. Audio Reactive / Spectrum / Beat
10. Bitmap Fonts / Typographic FX
11. ASCII / ANSI / NFO
12. Palette Cycling
13. Transitions / Compositing / Blend
14. Templates de démos / cracktros / intros

## 9. Fiche canonique d'un module

Chaque module devrait idéalement être décrit avec ce schéma :

```md
## Nom du module
- id :
- famille :
- alias :
- époque :
- plateformes historiques :
- principe visuel :
- principe algorithmique :
- paramètres principaux :
- variantes :
- niveau d'usage conseillé :
- coût performance :
- pièges :
- démos de référence :
- auteurs / groupes / codeurs :
- sources / équivalents modernes :
- idée de preset pédagogique :
- idée de preset showcase :
```

## 10. Architecture logique cible

### 10.1 Registres

- `EffectRegistry`
- `ModuleRegistry`
- `PresetRegistry`
- `SourceRegistry`
- `FontRegistry`
- `MusicRegistry`
- `TemplateRegistry`

### 10.2 Moteurs

- `RenderEngine`
- `TimelineEngine`
- `ExportEngine`
- `PedagogyEngine`
- `StorageEngine`

### 10.3 Couches UI

- bibliothèque d'effets
- zone preview
- inspecteur de paramètres
- timeline / séquence
- panneau sources / crédits / pédagogie
- panneau export

## 11. Règles de modularité

- un module doit avoir une identité claire
- un module doit pouvoir être paramétré sans casser les autres
- un module doit exposer ses paramètres de façon stable
- un module doit pouvoir être documenté indépendamment
- un module doit pouvoir être inclus dans l'export final

## 12. Règles pédagogiques

Pour chaque effet important, l'outil doit chercher à répondre à 5 questions :

1. Qu'est-ce que je vois ?
2. Comment cet effet marche-t-il ?
3. Pourquoi est-il important dans la demoscene ?
4. Quels paramètres changent réellement le résultat ?
5. Quelle démo ou quelle famille de démos regarder pour aller plus loin ?

## 13. Règles culturelles et de sourcing

- citer les inspirations quand elles sont connues
- distinguer clairement inspiration, réimplémentation et copie
- signaler les limites de licence
- valoriser les groupes, codeurs, graphistes et musiciens si l'information existe
- ne pas inventer les attributions

## 14. Règles de déploiement

Le projet doit rester facile à :
- ouvrir localement
- partager
- versionner
- exporter
- reprendre plus tard

Le modèle idéal reste :
- un projet simple à lancer
- un export simple à diffuser
- une documentation qui évite la dépendance à la mémoire orale

## 15. Roadmap recommandée

### Phase 1

- synthèse de la vision
- stabilisation du vocabulaire
- liste canonique des modules
- structure documentaire commune

### Phase 2

- architecture interne claire
- registres de modules / sources / presets
- séparation UI / moteur / export

### Phase 3

- amélioration de l'édition visuelle
- meilleurs presets
- niveaux LAME / NOOB / L33T / ROXOR

### Phase 4

- timeline et composition narrative
- audio-réactivité
- enrichissement des exports

### Phase 5

- documentation pédagogique avancée
- galerie d'exemples
- paquets de templates prêts à l'emploi

## 16. Critères de réussite

Le projet sera sur de bons rails si :
- la structure des modules est claire
- l'outil reste compréhensible
- l'export HTML est fiable
- la pédagogie n'est pas décorative mais utile
- la culture demoscene est valorisée sérieusement
- le projet peut être enrichi sans devenir ingérable

## 17. Premier usage conseillé de ce cahier

Ce document doit servir de socle.
Quand on ajoute de nouveaux documents de travail, il faut :
- comparer avec ce cadre
- fusionner les idées compatibles
- repérer les contradictions
- enrichir les modules
- préciser la roadmap

## 18. Questions de cadrage à fort impact

1. Le projet cible-t-il d'abord un éditeur complet ou un exporteur de démos prêtes à l'emploi ?
2. Veux-tu prioriser Canvas 2D, WebGL, ou une double stratégie dès le départ ?
3. Le format principal de composition doit-il être calques, scènes, timeline, ou hybride ?
4. L'outil doit-il rester en un seul fichier HTML pendant l'édition, ou seulement à l'export ?
5. Souhaites-tu un angle très pédagogique grand public, ou plutôt pédagogique pour créatifs déjà techniques ?
6. Veux-tu intégrer la musique réellement dans l'outil, ou seulement préparer la synchronisation et les crédits ?
7. Faut-il viser des templates "cracktro", "megademo", "intro moderne", ou les trois ?
8. L'historique demoscene doit-il être affiché dans l'interface, ou seulement dans la documentation et l'export ?
9. Veux-tu privilégier la robustesse du studio d'édition, ou la richesse du catalogue d'effets dans un premier temps ?
10. Souhaites-tu que le prochain livrable soit un super prompt enrichi par tes documents, ou directement un plan d'implémentation fichier par fichier ?

